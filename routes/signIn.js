const User=require('../models/User');
const hashPassword=require('../utils/bcrypt');
const express=require('express');
const checkParameter=require('../middlewares/zod')
const router =express.Router();
router.post('/', checkParameter, async (req, res, next) => {
    try {
      const hashedPassword = await hashPassword(req.body.password);
      const userData={name:req.body.name , email:req.body.email , password:hashedPassword};
      const user = new User(userData);
  
      user.save();
  
      res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
      next(error);
    }
  });
  module.exports=router;