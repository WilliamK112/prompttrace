#include "http/static_file_handler.hpp"

namespace http {

StaticFileHandler::StaticFileHandler(std::string root_dir) : root_dir_(std::move(root_dir)) {}

HttpResponse StaticFileHandler::Serve(const std::string& path) const {
  // Phase 4: safe path resolution + file read + content-type mapping.
  (void)path;
  return HttpResponse{501,
                      "Not Implemented",
                      {{"Content-Type", "text/plain"}},
                      "Static file serving not implemented yet.\n"};
}

}  // namespace http
