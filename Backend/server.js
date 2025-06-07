const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// Cache để lưu trữ kết quả đã tính toán
const primeCache = new Map();
const MAX_CACHE_SIZE = 10000;

// Middleware bảo mật
app.use(helmet());

// Middleware nén response
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 1000, // Giới hạn 1000 requests mỗi 15 phút
  message: {
    error: 'Quá nhiều yêu cầu, vui lòng thử lại sau'
  }
});
app.use('/check-prime', limiter);

// CORS middleware cải tiến
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Hàm kiểm tra số nguyên tố được tối ưu
function isPrime(n) {
  // Kiểm tra cache trước
  if (primeCache.has(n)) {
    return primeCache.get(n);
  }
  
  let result;
  
  if (n <= 1) {
    result = false;
  } else if (n <= 3) {
    result = true;
  } else if (n % 2 === 0 || n % 3 === 0) {
    result = false;
  } else {
    // Sử dụng thuật toán 6k±1 optimization
    result = true;
    const sqrt = Math.sqrt(n);
    
    for (let i = 5; i <= sqrt; i += 6) {
      if (n % i === 0 || n % (i + 2) === 0) {
        result = false;
        break;
      }
    }
  }
  
  // Lưu vào cache nếu cache chưa đầy
  if (primeCache.size < MAX_CACHE_SIZE) {
    primeCache.set(n, result);
  }
  
  return result;
}

// Middleware validation
const validateNumber = (req, res, next) => {
  const number = req.query.number;
  
  if (!number) {
    return res.status(400).json({
      error: 'Thiếu tham số number',
      example: '/check-prime?number=17'
    });
  }
  
  const parsedNumber = parseInt(number);
  
  if (isNaN(parsedNumber)) {
    return res.status(400).json({
      error: 'Tham số number phải là số nguyên hợp lệ',
      received: number
    });
  }
  
  // Giới hạn số quá lớn để tránh timeout
  const absNumber = Math.abs(parsedNumber);
  if (absNumber > Number.MAX_SAFE_INTEGER) {
    return res.status(400).json({
      error: 'Số quá lớn để xử lý an toàn',
      maxValue: Number.MAX_SAFE_INTEGER
    });
  }
  
  if (absNumber > 1000000) {
    return res.status(400).json({
      error: 'Số quá lớn, giới hạn tối đa là 1,000,000',
      received: absNumber
    });
  }
  
  req.validatedNumber = parsedNumber;
  next();
};

// API endpoint được tối ưu
app.get('/check-prime', validateNumber, (req, res) => {
  const number = req.validatedNumber;
  const absNumber = Math.abs(number);
  
  const start = process.hrtime.bigint();
  const result = isPrime(absNumber);
  const end = process.hrtime.bigint();
  
  const executionTime = Number(end - start) / 1000000; // Convert to milliseconds
  
  res.json({
    number: number,
    absoluteValue: absNumber,
    isPrime: result,
    executionTime: `${executionTime.toFixed(3)}ms`,
    cached: primeCache.has(absNumber)
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    cacheSize: primeCache.size
  });
});

// API info endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Prime Number Checker API',
    version: '2.0.0',
    endpoints: {
      '/check-prime?number=N': 'Kiểm tra số N có phải số nguyên tố không',
      '/health': 'Kiểm tra trạng thái server',
      '/': 'Thông tin API'
    },
    limits: {
      maxNumber: 1000000,
      rateLimit: '1000 requests/15 minutes'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Lỗi server nội bộ'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint không tồn tại',
    availableEndpoints: ['/', '/check-prime', '/health']
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Đang tắt server...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Đang tắt server...');
  process.exit(0);
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`🚀 Prime Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📊 Cache size limit: ${MAX_CACHE_SIZE}`);
  console.log(`🔒 Rate limit: 1000 requests/15 minutes`);
});