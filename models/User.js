const mongoose=require('mongoose');
const zod=require('zod');

const userSchema=mongoose.Schema({
    name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
      },
      password: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      todos:[{type:mongoose.Schema.ObjectId,ref:'Task'}]
});
const User=new mongoose.model('User',userSchema);

module.exports=User;
