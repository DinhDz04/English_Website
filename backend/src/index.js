const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

dotenv.config();





// Kiểm tra API

app.get('/', (req, res) => {
  res.send('English backend is running!');
});


// Auth routes
app.use('/api/auth', authRoutes);
app.use('/uploads', express.static('uploads'));
// Admin routes
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});