#include "http/thread_pool.hpp"

namespace http {

ThreadPool::ThreadPool(std::size_t num_threads) {
  workers_.reserve(num_threads);
  // Phase 3: spin up worker threads and consume tasks from queue.
}

ThreadPool::~ThreadPool() {
  // Phase 3: signal stop and join worker threads.
}

void ThreadPool::Enqueue(std::function<void()> task) {
  // Phase 3: push task into queue and notify one worker.
  (void)task;
}

}  // namespace http
