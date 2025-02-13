require('dotenv').config();
const JWT_SECRET=process.env.SECRET_KEY;
const jwt=require('jsonwebtoken');
const cookie=require('cookie')
function authenticateToken(req, res, next) {
  try {
    const token = cookie.parse(req.headers.cookie || '').token;
  
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
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
module.exports=authenticateToken;