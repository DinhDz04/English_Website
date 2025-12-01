const rateLimit = require('express-rate-limit');

// Rate limiter for shop purchases
const purchaseLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Max 5 purchases per minute
  message: {
    success: false,
    message: 'Quá nhiều giao dịch. Vui lòng thử lại sau 1 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for item usage
const usageLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 10, // Max 10 uses per 10 seconds
  message: {
    success: false,
    message: 'Đang sử dụng vật phẩm quá nhanh. Vui lòng chậm lại.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  purchaseLimiter,
  usageLimiter
};




