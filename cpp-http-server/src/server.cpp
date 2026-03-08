#include "http/server.hpp"

#include <iostream>

namespace http {

Server::Server(Config config) : config_(std::move(config)) {}

void Server::Run() {
  // Phase 2: Socket setup, accept loop, request parsing, and response writing.
  std::cout << "[bootstrap] Server::Run() placeholder. Implementing network loop in Phase 2."
            << std::endl;
}

}  // namespace http
