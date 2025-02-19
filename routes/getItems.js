const express = require('express');
const Item = require('../models/Items'); // Adjust the path as necessary
const router=express.Router();


router.get("/",  async (req,res,next) => {
    try{
      const items = await Item.find().exec();
      res.status(200).json({ items });
    }catch (error) {
      next(error);
    }
  
  });
module.exports=router;