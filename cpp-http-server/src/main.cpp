#include <iostream>

#include "http/config.hpp"
#include "http/server.hpp"

int main(int argc, char* argv[]) {
  const auto config = http::ParseConfig(argc, argv);

  std::cout << "[bootstrap] Starting server scaffold on " << config.host << ':' << config.port
            << std::endl;

  http::Server server(config);
  server.Run();

  return 0;
}
