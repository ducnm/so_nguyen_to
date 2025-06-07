const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const express = require('express');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const app = express();
const PORT = 3000;

// Middleware bảo mật
app.use(helmet());

// Middleware nén response
app.use(compression());

// Middleware để xử lý CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    error: 'Quá nhiều yêu cầu, vui lòng thử lại sau'
  }
});

// Hàm kiểm tra số nguyên tố song song
function isPrimeParallel(n) {
  return new Promise((resolve) => {
    if (n <= 1) return resolve(false);
    if (n <= 3) return resolve(true);
    if (n % 2 === 0 || n % 3 === 0) return resolve(false);

    // Chia công việc cho 4 worker
    const numWorkers = 4;
    let finished = 0;
    let found = false;
    const sqrtN = Math.floor(Math.sqrt(n));
    const step = Math.ceil((sqrtN - 5 + 1) / numWorkers);

    for (let i = 0; i < numWorkers; i++) {
      const start = 5 + i * step;
      const end = Math.min(sqrtN, start + step - 1);

      const worker = new Worker(`
        const { parentPort, workerData } = require('worker_threads');
        let { n, start, end } = workerData;
        let isPrime = true;
        for (let i = start; i <= end; i += 6) {
          if (n % i === 0 || n % (i + 2) === 0) {
            isPrime = false;
            break;
          }
        }
        parentPort.postMessage(isPrime);
      `, { eval: true, workerData: { n, start, end } });

      worker.on('message', (isPrime) => {
        if (!isPrime && !found) {
          found = true;
          resolve(false);
        }
        finished++;
        if (finished === numWorkers && !found) {
          resolve(true);
        }
      });
    }
  });
}

// API endpoint
app.get('/check-prime', limiter, async (req, res) => {
  const number = parseInt(req.query.number);

  if (isNaN(number)) {
    return res.status(400).json({
      error: 'Vui lòng nhập số hợp lệ'
    });
  }

  try {
    const result = await isPrimeParallel(Math.abs(number));
    res.json({
      number,
      isPrime: result
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi xử lý song song' });
  }
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});