const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// 🔒 Core routes connecting to live MongoDB via authController
router.post('/register', authController.register); // Registers new employee (checks admin in DB)
router.post('/login', authController.login);       // Logs in user using DB credentials
router.get('/profile/:id', authMiddleware, authController.getProfile); // Gets profile
router.put('/profile/:id', authMiddleware, authController.updateProfile); // Updates profile

module.exports = router;