
const rateLimit=require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 25, // Limit each IP to 25 requests per windowMs
    message: 'Too many requests, please try again later.',
  });

module.exports=limiter;