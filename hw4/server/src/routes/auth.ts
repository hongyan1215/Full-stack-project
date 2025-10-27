import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import db from '../db';

const router = express.Router();

// Zod 驗證 schema
const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(6)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const validated = registerSchema.parse(req.body);
    const { email, username, password } = validated;

    // 檢查 email 是否已存在
    const emailExists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (emailExists) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    // 檢查 username 是否已存在
    const usernameExists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (usernameExists) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // 雜湊密碼
    const passwordHash = await bcrypt.hash(password, 10);

    // 建立使用者
    const result = db.prepare(
      'INSERT INTO users (email, username, passwordHash) VALUES (?, ?, ?)'
    ).run(email, username, passwordHash);

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.issues.reduce((acc, issue) => {
        const field = issue.path.join('.');
        acc[field] = issue.message;
        return acc;
      }, {} as Record<string, string>);
      
      return res.status(400).json({ 
        error: 'Validation failed', 
        fieldErrors,
        details: error.issues 
      });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const validated = loginSchema.parse(req.body);
    const { email, password } = validated;

    // 尋找使用者
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as {
      id: number;
      email: string;
      username: string;
      passwordHash: string;
    } | undefined;

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 驗證密碼
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 生成 JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.issues.reduce((acc, issue) => {
        const field = issue.path.join('.');
        acc[field] = issue.message;
        return acc;
      }, {} as Record<string, string>);
      
      return res.status(400).json({ 
        error: 'Validation failed', 
        fieldErrors,
        details: error.issues 
      });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
