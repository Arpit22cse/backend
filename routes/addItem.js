const authenticateToken = require("../middlewares/auth");
const express=require('express');
const Item=require("../models/Items");
const router=express.Router();
 
 
router.post("/",authenticateToken,async (req,res,next)=>{
    try {
      const itemData={
        itemId: crypto.createHash,
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        image: req.body.imageData,
        category: req.body.category,
        stock: 50
      }
  
      const item=new Item(itemData);
      const itemSave = await item.save();
      //console.log(req.body);
  
      res.status(200).json({message:"Item added successfully"});
      
    } catch (error) {
      next(error);
    }
  });
  module.exports=router;