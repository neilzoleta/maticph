const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Core routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile/:id', authMiddleware, authController.getProfile);
router.put('/profile/:id', authMiddleware, authController.updateProfile);

// ✅ TEMP: Create test user in MongoDB
const bcrypt = require('bcryptjs');
const User = require('../models/User');

router.get('/test-register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash("password123", 10);

    const newUser = new User({
      email: "neilzoleta@maticstudio.net",
      password: hashedPassword,
      preferredName: "Neil",
      firstName: "Neil",
      lastName: "Zoleta",
      department: "Tech",
      position: "Founder"
    });

    await newUser.save();
    res.status(201).send("✅ Test user created");
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Failed to create test user");
  }
});
module.exports = router;