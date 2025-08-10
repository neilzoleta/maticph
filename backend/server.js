// ✅ Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
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
  methods: ['GET', 'POST', 'PUT','OPTIONS'],
  credentials: true
}));

// ✅ Middleware
app.use(express.json());

// ✅ Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Chat API endpoint for testing
app.post('/api/chat', (req, res) => {
  try {
    const { message, conversation_history } = req.body;
    
    // Simple mock responses based on user input
    let response = "Thank you for your message! I'm a demo version of the MATIC Studio assistant. ";
    
    if (message.toLowerCase().includes('tune-up') || message.toLowerCase().includes('call')) {
      response = "Great! I'd be happy to help you set up a tune-up call. Please visit our contact form at https://maticstudio.net/form.html to schedule a consultation. Our team will get back to you within 24 hours.";
    } else if (message.toLowerCase().includes('offer') || message.toLowerCase().includes('services')) {
      response = "MATIC Studio offers comprehensive business process automation solutions including:\n\n• **Process Analysis & Optimization**\n• **Custom Automation Development**\n• **AI Integration & Implementation**\n• **Workflow Design & Deployment**\n• **Ongoing Support & Maintenance**\n\nWe specialize in making automation accessible and practical for Filipino businesses.";
    } else if (message.toLowerCase().includes('matic') || message.toLowerCase().includes('studio')) {
      response = "MATIC Studio is a team of engineers and IT professionals based in Metro Manila. We're passionate about making automation accessible, practical, and impactful for Filipino businesses. We combine deep tech experience with real-world process know-how to design solutions that actually work.";
    } else if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
      response = "Hello! I'm your MATIC Studio assistant. I'm here to help you discover how automation can transform your business processes. What would you like to learn about today?";
    } else {
      response = "That's an interesting question! While I'm currently in demo mode, I'd be happy to connect you with our team for a detailed discussion. You can reach us at inquire@maticstudio.net or visit our website to learn more about our automation solutions.";
    }
    
    res.json({ response });
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ 
      response: "I apologize, but I'm having trouble processing your request right now. Please try again later or contact us directly at inquire@maticstudio.net." 
    });
  }
});

// ✅ Clean route for /employee
app.get('/employee', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'public', 'employee', 'index.html'), (err) => {
    if (err) {
      console.error('SendFile Error:', err);
      next(err);
    }
  });
});

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

  // ✅ Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});