#pragma once

#include <condition_variable>
#include <functional>
#include <mutex>
#include <queue>
#include <thread>
#include <vector>

namespace http {

class ThreadPool {
 public:
  explicit ThreadPool(std::size_t num_threads);
  ~ThreadPool();

  void Enqueue(std::function<void()> task);

 private:
  std::vector<std::thread> workers_;
  std::queue<std::function<void()>> tasks_;
  std::mutex mutex_;
  std::condition_variable cv_;
  bool stopping_{false};
};

}  // namespace http
