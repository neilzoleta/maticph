const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const generatePassword = require('../utils/generatePassword');
const sendEmail = require('../utils/sendEmail');

// ✅ Register new employee
exports.register = async (req, res) => {
  try {
    const { preferredName, firstName, lastName, position, department, admin } = req.body;

    // Validate required fields
    if (!preferredName || !firstName || !lastName || !admin) {
      return res.status(400).json({ message: "All fields including admin email are required." });
    }

    // Check if admin exists
    const adminUser = await User.findOne({ email: admin });
    if (!adminUser) {
      return res.status(401).json({ message: "Invalid Admin Email. Registration denied." });
    }

    // Generate employee email
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@maticstudio.net`;

    // Check for existing employee
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Employee already registered." });
    }

    // Generate random password
    const plainPassword = generatePassword(16);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Create new employee
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

    // Send email with credentials
    await sendEmail(email, 'Your MATIC Studio Portal Credentials',
      `Hello ${preferredName},

Here are your credentials for the MATIC Studio Employee Portal:

Email: ${email}
Password: ${plainPassword}

Please login at maticstudio.net/employee/index.html and change your password after first login.

Thanks,
MATIC Studio Admin Team`
    );

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

// ✅ Login existing employee
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "yoursecretkey",
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during login." });
  }
};

// ✅ Get employee profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error retrieving profile." });
  }
};