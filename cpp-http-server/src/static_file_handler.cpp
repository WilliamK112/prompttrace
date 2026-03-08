#include "http/static_file_handler.hpp"

#include <filesystem>
#include <fstream>
#include <sstream>
#include <unordered_map>

namespace http {
namespace {

std::string GetMimeType(const std::filesystem::path& path) {
  static const std::unordered_map<std::string, std::string> kMime = {
      {".html", "text/html; charset=utf-8"},
      {".css", "text/css; charset=utf-8"},
      {".js", "application/javascript; charset=utf-8"},
      {".json", "application/json"},
      {".txt", "text/plain; charset=utf-8"},
  };

  const std::string ext = path.extension().string();
  const auto it = kMime.find(ext);
  return it == kMime.end() ? "application/octet-stream" : it->second;
}

bool IsSafeRelativePath(const std::filesystem::path& relative_path) {
  if (relative_path.is_absolute()) {
    return false;
  }

  for (const auto& part : relative_path) {
    if (part == "..") {
      return false;
    }
  }
  return true;
}

}  // namespace

StaticFileHandler::StaticFileHandler(std::string root_dir) : root_dir_(std::move(root_dir)) {}

HttpResponse StaticFileHandler::Serve(const std::string& request_path) const {
  namespace fs = std::filesystem;

  try {
    std::string local = request_path;
    if (local.rfind("/static/", 0) == 0) {
      local = local.substr(8);  // remove /static/
    }

    if (local.empty()) {
      local = "index.html";
    }

    fs::path relative = fs::path(local).lexically_normal();
    if (!IsSafeRelativePath(relative)) {
      return HttpResponse{400,
                          "Bad Request",
                          {{"Content-Type", "text/plain; charset=utf-8"}},
                          "400 Bad Request\n"};
    }

    const fs::path base = fs::weakly_canonical(fs::path(root_dir_));
    const fs::path full_path = fs::weakly_canonical(base / relative);

    const std::string base_str = base.string();
    const std::string full_str = full_path.string();
    if (full_str.rfind(base_str, 0) != 0) {
      return HttpResponse{400,
                          "Bad Request",
                          {{"Content-Type", "text/plain; charset=utf-8"}},
                          "400 Bad Request\n"};
    }

    if (!fs::exists(full_path) || fs::is_directory(full_path)) {
      return HttpResponse{404,
                          "Not Found",
                          {{"Content-Type", "text/plain; charset=utf-8"}},
                          "404 Not Found\n"};
    }

    std::ifstream file(full_path, std::ios::binary);
    if (!file) {
      return HttpResponse{500,
                          "Internal Server Error",
                          {{"Content-Type", "text/plain; charset=utf-8"}},
                          "500 Internal Server Error\n"};
    }

    std::ostringstream buffer;
    buffer << file.rdbuf();

    HttpResponse response;
    response.status_code = 200;
    response.status_text = "OK";
    response.body = buffer.str();
    response.headers["Content-Type"] = GetMimeType(full_path);
    return response;
  } catch (...) {
    return HttpResponse{500,
                        "Internal Server Error",
                        {{"Content-Type", "text/plain; charset=utf-8"}},
                        "500 Internal Server Error\n"};
  }
}

}  // namespace http
