// ✅ Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// ✅ Future-proof CORS configuration
const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'https://www.maticstudio.net',  // ✅ Squarespace domain
  process.env.FRONTEND_URL        // ✅ Future production frontend URL
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT'],
  credentials: true
}));

// ✅ Middleware
app.use(express.json());

// ✅ Routes
app.use('/api', authRoutes);

// ✅ Health check route
app.get('/ping', (req, res) => {
  res.send('pong');
});

// ✅ Root route
app.get('/', (req, res) => {
  res.send('MATIC Studio API is live');
});

// ✅ Connect to MongoDB then start server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });