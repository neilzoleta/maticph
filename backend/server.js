// ✅ Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');

// ✅ Load environment variables from .env file into process.env
dotenv.config();

// ✅ Initialize Express app
const app = express();
const PORT = process.env.PORT || 5001;

// ✅ Future-proof CORS configuration
const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  process.env.FRONTEND_URL // e.g. https://your-production-frontend.com
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. mobile apps, curl requests)
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

// ✅ Middleware to parse incoming JSON data
app.use(express.json());

// ✅ Routes
// All routes in authRoutes will be prefixed with /api
app.use('/api', authRoutes);

// ✅ Test route to confirm server is running
app.get('/ping', (req, res) => {
  res.send('pong');
});

// ✅ Connect to MongoDB then start server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });