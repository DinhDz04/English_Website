const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// ✅ PHẢI load .env TRƯỚC KHI import routes
dotenv.config();

const app = express();

// ✅ Middleware phải đặt TRƯỚC routes
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// ✅ Import routes SAU KHI đã config dotenv
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');

// ✅ Health check
app.get('/', (req, res) => {
  res.send('English backend is running!');
});

// ✅ API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);

// ✅ 404 Handler - PHẢI Ở CUỐI CÙNG
app.use((req, res) => {
  console.log('❌ 404 - Route not found:', req.method, req.originalUrl);
  res.status(404).json({ 
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl
  });
});

// ✅ Error Handler
app.use((err, req, res, next) => {
  console.error('💥 Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});