require('dotenv').config();
const express=require('express');
const router=express.Router();
const JWT_SECRET=process.env.SECRET_KEY;
const jwt=require('jsonwebtoken');
const authenticateToken=require('../middlewares/authenticateToken');
router.get('/me',(req,res)=>{
    
    const authHeader = req.headers.authorization;
    

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  
    const token = authHeader.split(' ')[1]; // Extract token after 'Bearer '
  
    // Now you can verify the token (e.g., using JWT)
    try {
      const user = jwt.verify(token, JWT_SECRET);
      req.user = user; // Optional: attach to request for future use
      res.json(user);
    } catch (err) {
      res.status(403).json({ message: 'Invalid or expired token' });
    }

});
module.exports=router;