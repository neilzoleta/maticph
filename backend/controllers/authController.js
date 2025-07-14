const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const generatePassword = require('../utils/generatePassword');
const sendEmail = require('../utils/sendEmail'); // ✅ added

exports.register = async (req, res) => {
  try {
    const { preferredName, firstName, lastName, position, department, admin } = req.body;

    if (!preferredName || !firstName || !lastName || !admin) {
      return res.status(400).json({ message: "All fields including admin email are required." });
    }

    const adminUser = await User.findOne({ email: admin });
    if (!adminUser) {
      return res.status(401).json({ message: "Invalid Admin Email. Registration denied." });
    }

    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@maticstudio.net`;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Employee already registered." });
    }

    const plainPassword = generatePassword(16);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

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

    // ✅ Send email with credentials
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