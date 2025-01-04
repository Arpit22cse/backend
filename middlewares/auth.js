require('dotenv').config();
const JWT_SECRET=process.env.SECRET_KEY;
const jwt=require('jsonwebtoken');
const cookie=require('cookie')
function authenticateToken(req, res, next) {
    try {
      const token = req.cookies?.token;
  
      if (!token) {
        return res.status(401).json({ message: "Token required" });
      }
  
      jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
          return res.status(403).json({ message: "Invalid token" });
        }
  
        req.user = user;
        next();
      });
    } catch (error) {
      return error;
    }
  }
module.exports=authenticateToken;