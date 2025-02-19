const express = require('express');
const { authenticateToken } = require('../middleware/authenticateToken');
const { Task } = require('../models/Task');
const { db } = require('../db/connection');
const router=express.Router();

router.post('/', authenticateToken, async (req, res, next) => {
    try {
  
      const result = await db.collection('users').findOne({ email: req.user.email });
  
      const taskData={
        title:req.body.title,
        description:req.body.description,
        user:result._id,
      }
  
      const task=new Task(taskData);
      const saveTask = await task.save();
  
      const saveUser=await db.collection('users').updateOne({_id:result._id},{$push:{todos:saveTask._id}});
  
      if (saveUser.modifiedCount === 1) {
        res.status(200).json({ message: 'Task added successfully' });
      } else {
        res.status(404).json({ message: 'User not found or task not added' });
      }
    } catch (error) {
      next(error);
    }
  });
module.exports=router;