require('dotenv').config();
const mongoose=require('mongoose');
//const uri="mongodb://arpiconn:27017/mydb";
const uri =process.env.DATABASE_URI;
mongoose.connect(uri).then(()=>{
    console.log("cluster connected");
}).catch(err=>console.log(err)
);
const db=mongoose.connection;
module.exports=db;
