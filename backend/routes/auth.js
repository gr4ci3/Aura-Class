const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../database');
const { sendPasswordResetEmail } = require('../services/email');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_aura_class_2026';

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// GET current logged in user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.getUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Don't return password
    const { password, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST register user
router.post('/register', async (req, res) => {
  const { name, email, password, role, department, admissionYear, matricNumber } = req.body;

  // Basic validation
  if (!name || !email || !password || !role || !department) {
    return res.status(400).json({ error: 'All fields (name, email, password, role, department) are required' });
  }

  if (role !== 'lecturer' && role !== 'student') {
    return res.status(400).json({ error: 'Role must be either lecturer or student' });
  }

  if (role === 'student' && !admissionYear) {
    return res.status(400).json({ error: 'Students must specify their admission year/set (e.g., 2024/2025)' });
  }

  if (role === 'student' && !matricNumber) {
    return res.status(400).json({ error: 'Students must provide their Matriculation Number' });
  }

  // School email check
  const isSchoolEmail = email.toLowerCase().endsWith('.edu') || email.toLowerCase().includes('.edu.');
  
  try {
    // Check if user already exists by email or matric number
    const existingEmail = await db.getUserByEmailOrMatric(email);
    if (existingEmail) {
      return res.status(400).json({ error: 'A user with this email address already exists' });
    }

    if (role === 'student' && matricNumber) {
      const existingMatric = await db.getUserByEmailOrMatric(matricNumber);
      if (existingMatric) {
        return res.status(400).json({ error: 'A student with this Matriculation Number already exists' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await db.createUser({
      name,
      email,
      password: hashedPassword,
      role,
      department,
      admissionYear: role === 'student' ? admissionYear : null,
      matricNumber: role === 'student' ? matricNumber : null
    });

    // Generate JWT token
    const tokenPayload = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
      department: newUser.department,
      admissionYear: newUser.admissionYear,
      matricNumber: newUser.matricNumber
    };
    
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: tokenPayload,
      warning: !isSchoolEmail ? 'Registered with a non-school email address. School emails typically end in .edu' : null
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST login user
router.post('/login', async (req, res) => {
  const { email, emailOrMatric, password } = req.body;
  const identifier = emailOrMatric || email;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Email/Matric Number and password are required' });
  }

  try {
    // Find user by either email or matric number
    const user = await db.getUserByEmailOrMatric(identifier);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email/matric number or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email/matric number or password' });
    }

    // Generate JWT
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      department: user.department,
      admissionYear: user.admissionYear,
      matricNumber: user.matricNumber
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Login successful',
      token,
      user: tokenPayload
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  try {
    const user = await db.getUserByEmailOrMatric(email);

    if (!user) {
      return res.json({
        message: 'If an account exists with this email, a password reset link has been sent.',
        emailSent: false
      });
    }

    await db.invalidateAllPasswordResetTokensForUser(user.id);

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await db.savePasswordResetToken(resetToken, user.id, expiresAt);

    const previewUrl = await sendPasswordResetEmail(user, resetToken);

    return res.json({
      message: 'If an account exists with this email, a password reset link has been sent.',
      emailSent: true,
      previewUrl: previewUrl || null
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Reset token and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    const resetRecord = await db.findPasswordResetToken(token);

    if (!resetRecord) {
      return res.status(400).json({ error: 'Invalid or expired password reset link' });
    }

    if (new Date(resetRecord.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'This password reset link has expired. Please request a new one.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.updateUserPassword(resetRecord.userId, hashedPassword);
    await db.markPasswordResetTokenUsed(resetRecord.id);
    await db.invalidateAllPasswordResetTokensForUser(resetRecord.userId);

    res.json({ message: 'Password has been reset successfully. You can now log in with your new password.' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = {
  router,
  authenticateToken
};
