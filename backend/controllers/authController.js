const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { preferredName, firstName, lastName, position, department, admin } = req.body;

    // ✅ Validate required fields
    if (!preferredName || !firstName || !lastName || !admin) {
      return res.status(400).json({ message: "All fields including admin email are required." });
    }

    // ✅ Check if admin email exists and is an admin
    const adminUser = await User.findOne({ email: admin });
    if (!adminUser) {
      return res.status(401).json({ message: "Invalid Admin Email. Registration denied." });
    }

    // ✅ Generate employee email and password
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@maticstudio.net`;
    const plainPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // ✅ Check if employee already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Employee already registered." });
    }

    // ✅ Create new employee
    const newUser = await User.create({
      preferredName,
      firstName,
      lastName,
      position,
      department,
      admin,
      email,
      password: hashedPassword
    });

    // ✅ TODO: Send email notification with credentials

    res.status(201).json({
      message: "Employee registered successfully.",
      email,
      password: plainPassword
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during registration." });
  }
};