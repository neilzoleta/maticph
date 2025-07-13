const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { preferredName, firstName, lastName, position, department, admin } = req.body;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@maticstudio.net`;
    const plainPassword = Math.random().toString(36).slice(-8);
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

    // TODO: Send email with plainPassword
    res.status(201).json({ message: 'Employee registered', email, password: plainPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ success: false, message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ success: false, message: 'Invalid email or password' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
      success: true,
      message: 'Login successful',
      data: { token, user }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};