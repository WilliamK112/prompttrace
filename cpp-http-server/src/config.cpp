#include "http/config.hpp"

#include <cstdlib>
#include <string>

namespace http {

Config ParseConfig(int argc, char* argv[]) {
  Config config;

  // Simple CLI override for port: --port=9090
  for (int i = 1; i < argc; ++i) {
    const std::string arg(argv[i]);
    const std::string prefix = "--port=";
    if (arg.rfind(prefix, 0) == 0) {
      const auto value = arg.substr(prefix.size());
      const auto port = std::stoi(value);
      if (port > 0 && port <= 65535) {
        config.port = static_cast<std::uint16_t>(port);
      }
    }
  }

  return config;
}

}  // namespace http
