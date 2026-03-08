#pragma once

#include <string>

#include "http/response.hpp"

namespace http {

class StaticFileHandler {
 public:
  explicit StaticFileHandler(std::string root_dir);
  HttpResponse Serve(const std::string& path) const;

 private:
  std::string root_dir_;
};

}  // namespace http
