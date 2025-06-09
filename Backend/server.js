const cluster = require('cluster');
const os = require('os');
const express = require('express');
const rateLimit = require('express-rate-limit');
const numCPUs = os.cpus().length;
const PORT = 3000;

if (cluster.isMaster) {
  // Fork worker processes bằng số lượng CPU
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  const app = express();

  // Middleware xử lý CORS
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
  });

  // Middleware rate limiting: 100 requests mỗi 15 phút cho mỗi IP
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 100, // giới hạn mỗi IP 100 requests
    message: { error: 'Quá nhiều request, vui lòng thử lại sau.' }
  });
  app.use(limiter);

  // Hàm kiểm tra số nguyên tố
  function isPrime(n) {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    for (let i = 5; i * i <= n; i += 6) {
      if (n % i === 0 || n % (i + 2) === 0) return false;
    }
    return true;
  }

  // API endpoint
  app.get('/check-prime', (req, res) => {
    const number = parseInt(req.query.number);
    if (isNaN(number)) {
      return res.status(400).json({
        error: 'Vui lòng nhập số hợp lệ'
      });
    }
    res.json({
      number,
      isPrime: isPrime(Math.abs(number))
    });
  });

  // Khởi động server
  app.listen(PORT, () => {
    console.log(`Worker ${process.pid} đang chạy tại http://localhost:${PORT}`);
  });
}
