const express = require('express');
const { authenticateToken } = require('../middlewares/authenticateToken');
const { db } = require('../config/Database');

const router = express.Router();



router.get('/',async (req, res, next) => {
    try {
      const user=await db.collection('users').findOne({email:req.user.email});
      const todos=await db.collection('tasks').find({ user: user._id }).toArray();
      res.status(200).json({todos:todos});
    } catch (error) {
      next(error);
    }
});
module.exports=router;