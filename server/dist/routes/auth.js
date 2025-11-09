import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { authenticateToken, generateToken } from '../middleware/auth.js';
const router = Router();
// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            email,
            password: hashedPassword,
        });
        await user.save();
        const token = generateToken(user._id.toString());
        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
            },
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message || 'Registration failed' });
    }
});
// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = generateToken(user._id.toString());
        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message || 'Login failed' });
    }
});
// Get current user
router.get('/me', authenticateToken, async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            id: user._id,
            email: user.email,
            githubConnected: !!user.githubToken,
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: error.message || 'Failed to get user' });
    }
});
router.post('/logout', authenticateToken, (_req, res) => {
    res.status(204).send();
});
export default router;
