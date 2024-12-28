require('dotenv').config();
const mongoose=require('mongoose');
const uri=process.env.DATABASE_URI;
mongoose.connect(uri).then(()=>{
    console.log("cluster connected");
}).catch(err=>console.log(err)
);
const db=mongoose.connection;
module.exports=db;