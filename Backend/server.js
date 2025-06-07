const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');

const express = require('express');
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
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 30, // Giới hạn 1000 requests mỗi 15 phút
  message: {
    error: 'Quá nhiều yêu cầu, vui lòng thử lại sau'
  }
});

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
app.get('/check-prime', limiter, (req, res) => {
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
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});