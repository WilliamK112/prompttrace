#include "http/logger.hpp"

#include <iostream>

namespace http {

void Logger::Info(const std::string& message) { std::cout << "[INFO] " << message << std::endl; }

void Logger::Warn(const std::string& message) { std::cout << "[WARN] " << message << std::endl; }

void Logger::Error(const std::string& message) {
  std::cerr << "[ERROR] " << message << std::endl;
}

void Logger::Request(const std::string& client,
                     const std::string& method,
                     const std::string& path,
                     int status_code) {
  std::cout << "[REQ] client=" << client << " method=" << method << " path=" << path
            << " status=" << status_code << std::endl;
}

}  // namespace http
