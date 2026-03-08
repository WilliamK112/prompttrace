#include "http/server.hpp"

#include <arpa/inet.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include <unistd.h>

#include <cerrno>
#include <cstring>
#include <iostream>
#include <string>
#include <utility>

#include "http/request.hpp"
#include "http/response.hpp"

namespace http {
namespace {

HttpResponse MakeResponse(int status_code,
                          std::string status_text,
                          std::string content_type,
                          std::string body) {
  HttpResponse response;
  response.status_code = status_code;
  response.status_text = std::move(status_text);
  response.body = std::move(body);
  response.headers["Content-Type"] = std::move(content_type);
  response.headers["Connection"] = "close";
  return response;
}

bool SendAll(int fd, const std::string& data) {
  std::size_t total_sent = 0;
  while (total_sent < data.size()) {
    const auto bytes_sent = send(fd, data.data() + total_sent, data.size() - total_sent, 0);
    if (bytes_sent < 0) {
      return false;
    }
    total_sent += static_cast<std::size_t>(bytes_sent);
  }
  return true;
}

}  // namespace

Server::Server(Config config) : config_(std::move(config)) {
  router_.RegisterRoute("/", [](const HttpRequest&) {
    return MakeResponse(200, "OK", "text/plain; charset=utf-8", "HTTP server is running\n");
  });

  router_.RegisterRoute("/health", [](const HttpRequest&) {
    return MakeResponse(200, "OK", "application/json", "{\"status\":\"ok\"}\n");
  });

  router_.RegisterRoute("/hello", [](const HttpRequest&) {
    return MakeResponse(200, "OK", "text/plain; charset=utf-8", "Hello from C++ HTTP server\n");
  });
}

void Server::Run() {
  const int server_fd = socket(AF_INET, SOCK_STREAM, 0);
  if (server_fd < 0) {
    std::cerr << "[error] socket() failed: " << std::strerror(errno) << std::endl;
    return;
  }

  int enable = 1;
  if (setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &enable, sizeof(enable)) < 0) {
    std::cerr << "[error] setsockopt(SO_REUSEADDR) failed: " << std::strerror(errno) << std::endl;
    close(server_fd);
    return;
  }

  sockaddr_in address{};
  address.sin_family = AF_INET;
  address.sin_port = htons(config_.port);

  if (inet_pton(AF_INET, config_.host.c_str(), &address.sin_addr) <= 0) {
    std::cerr << "[error] invalid host: " << config_.host << std::endl;
    close(server_fd);
    return;
  }

  if (bind(server_fd, reinterpret_cast<sockaddr*>(&address), sizeof(address)) < 0) {
    std::cerr << "[error] bind() failed on " << config_.host << ':' << config_.port << " - "
              << std::strerror(errno) << std::endl;
    close(server_fd);
    return;
  }

  if (listen(server_fd, 16) < 0) {
    std::cerr << "[error] listen() failed: " << std::strerror(errno) << std::endl;
    close(server_fd);
    return;
  }

  std::cout << "[info] Listening on " << config_.host << ':' << config_.port << std::endl;

  while (true) {
    sockaddr_in client_addr{};
    socklen_t client_len = sizeof(client_addr);
    const int client_fd = accept(server_fd, reinterpret_cast<sockaddr*>(&client_addr), &client_len);
    if (client_fd < 0) {
      std::cerr << "[warn] accept() failed: " << std::strerror(errno) << std::endl;
      continue;
    }

    std::string raw_request;
    raw_request.reserve(4096);

    char buffer[4096];
    bool header_complete = false;
    while (raw_request.size() < 16 * 1024) {
      const auto bytes = recv(client_fd, buffer, sizeof(buffer), 0);
      if (bytes <= 0) {
        break;
      }

      raw_request.append(buffer, static_cast<std::size_t>(bytes));
      if (raw_request.find("\r\n\r\n") != std::string::npos) {
        header_complete = true;
        break;
      }
    }

    HttpResponse response;
    HttpRequest request;

    if (!header_complete || !ParseHttpRequest(raw_request, &request)) {
      response = MakeResponse(400, "Bad Request", "text/plain; charset=utf-8", "400 Bad Request\n");
    } else if (request.method != "GET") {
      response =
          MakeResponse(400, "Bad Request", "text/plain; charset=utf-8", "Only GET is supported\n");
    } else {
      response = router_.Route(request);
      if (!response.headers.count("Content-Type")) {
        response.headers["Content-Type"] = "text/plain; charset=utf-8";
      }
      response.headers["Connection"] = "close";
    }

    const std::string wire_response = response.ToHttpString();
    if (!SendAll(client_fd, wire_response)) {
      std::cerr << "[warn] send() failed: " << std::strerror(errno) << std::endl;
    }

    close(client_fd);
  }
}

}  // namespace http
