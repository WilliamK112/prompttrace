# C++ Multithreaded HTTP Server (Interview Project)

A clean, modular HTTP server built from scratch in modern C++ (C++17), designed to be easy to explain in interviews.

## Status

- ✅ Phase 1: Project scaffold
- ⏳ Phase 2+: implementation in progress

## Goals

- Build a working local HTTP server on `localhost`
- Start with correctness, then optimize
- Keep design simple, readable, and practical

## Planned Architecture

- **`Server`**: owns socket lifecycle, accepts client connections
- **`Router`**: maps request paths to handlers (e.g., `/`, `/health`, `/hello`)
- **`HttpRequest` / `HttpResponse`**: request parsing and response formatting
- **`ThreadPool`**: worker threads process accepted connections concurrently
- **`StaticFileHandler`**: serves files from `public/`
- **`Logger`**: request/response logging for observability
- **`Config`**: runtime settings such as port and document root

## Folder Structure

```text
cpp-http-server/
├── CMakeLists.txt
├── .gitignore
├── README.md
├── include/http/
│   ├── config.hpp
│   ├── logger.hpp
│   ├── request.hpp
│   ├── response.hpp
│   ├── router.hpp
│   ├── server.hpp
│   ├── static_file_handler.hpp
│   └── thread_pool.hpp
├── src/
│   ├── config.cpp
│   ├── logger.cpp
│   ├── main.cpp
│   ├── request.cpp
│   ├── response.cpp
│   ├── router.cpp
│   ├── server.cpp
│   ├── static_file_handler.cpp
│   └── thread_pool.cpp
├── public/
│   └── index.html
├── scripts/
└── benchmarks/
```

## Build (Scaffold Check)

```bash
cd cpp-http-server
cmake -S . -B build
cmake --build build
./build/http_server
```

> Current binary is scaffold-only and will be expanded in Phase 2.
