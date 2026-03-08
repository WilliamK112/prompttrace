#pragma once

#include "http/config.hpp"
#include "http/router.hpp"

namespace http {

class Server {
 public:
  explicit Server(Config config);
  void Run();

 private:
  Config config_;
  Router router_;
};

}  // namespace http
