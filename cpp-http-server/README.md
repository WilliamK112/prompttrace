# C++ Multithreaded HTTP Server (C++17 + CMake)

A clean, interview-friendly HTTP server built from scratch in modern C++.

This project starts from correctness and incrementally adds production-minded features: routing, request parsing, a thread pool, static file serving, logging, and benchmarking scripts.

---

## Project Overview

- Language: **C++17**
- Build system: **CMake**
- Networking: POSIX sockets (`socket`, `bind`, `listen`, `accept`, `recv`, `send`)
- Concurrency: fixed-size **thread pool** (`std::thread`, `std::mutex`, `std::condition_variable`)
- Goal: be practical, understandable, and easy to explain in interviews

---

## Features

- HTTP/1.1 response formatting with status line, headers, and content length
- Simple HTTP request parsing (request line + headers)
- Routes:
  - `GET /` → `HTTP server is running`
  - `GET /health` → `{"status":"ok"}`
  - `GET /hello` → `Hello from C++ HTTP server`
- 404 for unknown dynamic routes
- 400 for malformed requests / unsupported methods in this minimal server
- Fixed-size thread pool for concurrent client handling
- Static file serving from `public/` using `/static/...`
- Basic MIME support: `html`, `css`, `js`, `json`, `txt`
- Path traversal protection (`../` blocked)
- Request logging (client, method, path, status)
- Configurable host/port/thread count/static dir via CLI flags
- Benchmark + smoke test scripts

---

## Architecture

### Core modules

- `Server`: socket lifecycle, accept loop, dispatches client tasks to thread pool
- `ThreadPool`: worker threads consume queued connection-handling tasks
- `HttpRequest` parser: parses raw bytes into method/path/version/headers/body
- `Router`: path → handler map for dynamic routes
- `StaticFileHandler`: serves files from static directory with safety checks
- `HttpResponse`: serializes to wire-format HTTP/1.1 response
- `Logger`: structured console logging
- `Config`: command-line config parsing

### Request lifecycle

1. Main thread accepts a TCP client.
2. Accepted socket gets enqueued as a task in `ThreadPool`.
3. Worker reads request bytes and parses headers.
4. Server routes:
   - `/`, `/hello`, `/health` via `Router`
   - `/static/...` via `StaticFileHandler`
5. Worker serializes and sends HTTP response, logs request, closes client socket.

---

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
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── data.json
│   └── hello.txt
├── scripts/
│   └── run.sh
└── benchmarks/
    ├── README.md
    ├── smoke_test.sh
    ├── run_bench.sh
    └── results/
```

---

## Build Instructions

```bash
cd cpp-http-server
cmake -S . -B build
cmake --build build
```

## Run Instructions

```bash
# defaults: host 127.0.0.1, port 8080, threads 4, static_dir public
./build/http_server

# custom options
./build/http_server --host=127.0.0.1 --port=9090 --threads=8 --static-dir=public

# one-command helper
./scripts/run.sh --port=8080 --threads=4
```

---

## Example curl Usage

```bash
curl -i http://127.0.0.1:8080/
curl -i http://127.0.0.1:8080/health
curl -i http://127.0.0.1:8080/hello

# static files
curl -i http://127.0.0.1:8080/static/index.html
curl -i http://127.0.0.1:8080/static/style.css
curl -i http://127.0.0.1:8080/static/data.json

# error paths
curl -i http://127.0.0.1:8080/does-not-exist
curl -i http://127.0.0.1:8080/static/../../etc/passwd
curl -i -X POST http://127.0.0.1:8080/hello
```

---

## Benchmark Section

### Run

```bash
./benchmarks/smoke_test.sh
./benchmarks/run_bench.sh
# or a custom URL
./benchmarks/run_bench.sh http://127.0.0.1:9090
```

### Tool selection

`run_bench.sh` auto-selects:
1. `wrk` (preferred)
2. `ab`
3. `curl` fallback loops

### Benchmark results

Results are written to `benchmarks/results/bench-<timestamp>.txt`.

Sample run in this environment (using `ab -n 5000 -c 100`):

- `/`: Requests/sec = `36,475`, Mean latency = `2.742 ms`
- `/hello`: Requests/sec = `43,180`, Mean latency = `2.316 ms`
- `/health`: Requests/sec = `42,430`, Mean latency = `2.357 ms`
- `/static/index.html`: Requests/sec = `35,538`, Mean latency = `2.814 ms`

Reference output file:
`benchmarks/results/bench-20260308-043314.txt`

> These are machine-dependent; rerun locally for your own final numbers.

---

## Optimizations Applied (Measured/Practical)

- Added thread pool so accept loop stays responsive while workers process requests.
- Increased listen backlog (`128`) to better tolerate bursty clients.
- Avoided repeated small socket writes by building one HTTP response string and using `SendAll`.
- Reserved request buffer upfront to reduce allocation churn for common request sizes.
- Static file handler uses direct file streaming and simple extension lookup map.

---

## Future Improvements

- Keep-alive + multiple requests per connection (deferred intentionally)
- Better HTTP compliance (more methods, robust header parsing, chunked transfer)
- Connection/read timeouts and max request body handling
- Metrics endpoint and structured JSON logs
- TLS (via reverse proxy or direct integration)

---

## Lessons Learned

- Concurrency can stay simple when responsibilities are explicit: accept thread + worker pool.
- Correctness first (parsing, status codes, safety checks) keeps later optimization straightforward.
- A small modular design is easier to explain than a highly abstract one in interviews.

---

## Resume Bullet Points (3)

- Built a modular **multithreaded HTTP server in C++17** using POSIX sockets and CMake, implementing request parsing, routing, and RFC-style HTTP/1.1 response serialization.
- Designed and integrated a **fixed-size thread pool + task queue** to process concurrent client connections safely with `std::mutex` and `std::condition_variable`.
- Implemented **secure static file serving** (MIME mapping + path traversal protection), structured request logging, and reproducible load-testing workflows (`wrk`/`ab`/`curl`).

---

## Interview Summary

### 30-second version

“I built a C++17 HTTP server from scratch with clean modules for server lifecycle, request parsing, routing, and response formatting. After validating correctness in a single-threaded version, I added a fixed-size thread pool so the accept loop can dispatch client sockets and handle requests concurrently. I also added secure static file serving, request logging, and benchmark scripts, so it’s not just a toy server—it’s measurable and interview-ready.”

### 90-second version

“This project is a from-scratch HTTP server in modern C++ with a strong focus on clear architecture. The `Server` owns socket setup (`socket/bind/listen/accept`) and pushes accepted connections into a fixed-size `ThreadPool`. Worker threads parse HTTP requests, route dynamic paths like `/`, `/health`, and `/hello`, or serve files from `public/` via `/static/...`.

I split concerns into small modules: `HttpRequest` parsing, `HttpResponse` serialization, `Router`, `StaticFileHandler`, `Logger`, and `Config`. That keeps the code easy to reason about and easy to discuss in interviews. For practical robustness, I return appropriate status codes for malformed requests and unknown routes, log method/path/status/client, and block path traversal attempts in static file paths.

I also added benchmarking scripts that use `wrk` or `ab` with a curl fallback, so performance discussions are based on reproducible runs rather than guesses. Keep-alive and deeper HTTP compliance are intentionally deferred to keep the implementation clean and focused for this version.”
