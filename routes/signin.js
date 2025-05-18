require('dotenv').config();
const User=require('../models/User');
const {hashPassword}=require('../utils/bcrypt');
const express=require('express');
const checkParameter=require('../middlewares/zod')
const router =express.Router();
const jwt=require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid');
const JWT_SECRET=process.env.SECRET_KEY;

router.post('/', checkParameter, async (req, res, next) => {
    try {
      const hashedPassword = await hashPassword(req.body.password);
      const userData={username:req.body.username , email:req.body.email , password:hashedPassword};
      const user = new User(userData);
      const email=req.body.email;
      const id = uuidv4();
  
      user.save();


      const token = jwt.sign({ email: user.email , id , username:user.username}, JWT_SECRET, { expiresIn: '1h' });
      res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 3600000 });

      const makeUser={email: user.email, id, username: req.body.username,};
        
      res.status(200).json({ user:makeUser, token });
    } catch (error) {
      next(error);
    }
  });
  module.exports=router;