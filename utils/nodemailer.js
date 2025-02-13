require('dotenv').config();
const nodemailer=require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.COMPANY_MAIL,
      pass: process.env.COMPANY_PASSWORD,
    },
  });

  module.exports=transporter;