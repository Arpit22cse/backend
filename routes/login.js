const express=require('express');
const router =express.Router();
const db=require('../config/Database');
const { validatePassword } = require('../utils/bcrypt');
const jwt=require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const JWT_SECRET=process.env.SECRET_KEY;



router.post('/', async (req, res, next) => {
    try {
      const { email, password } = req.body;
      
      const user = await db.collection('users').findOne({ email });

      //console.log(req.body);
      
  
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
  
      const isValid = await validatePassword(password, user.password);
      
  
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid password' });
      }

      const id = uuidv4();
      const makeUser={email: user.email, id, username: user.username,};
  
      const token = jwt.sign({email: user.email, id, username: user.username}, JWT_SECRET, { expiresIn: '1h' });
      res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 3600000 });
      
      
              
      res.status(200).json({ user:makeUser, token });
    } catch (error) {
      next(error);
    }
  });

  module.exports=router;