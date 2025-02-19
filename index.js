require('dotenv').config();
const express=require('express');
const User=require('./models/User');
const Task=require('./models/Task');
const Item=require('./models/Items');
const limiter=require('./middlewares/ratelimiter');
const swaggerSpec=require('./config/swagger');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const jwt=require('jsonwebtoken');
const crypto=require('crypto')
const bodyParser=require('body-parser');
const db=require('./config/Database');
const cors=require('cors');
const cookie=require('cookie');
const ws=require('ws');



const {hashPassword,validatePassword}=require('./utils/bcrypt');
const authenticateToken=require('./middlewares/authenticateToken');
const checkParameter=require('./middlewares/zod');
const transporter=require('./utils/nodemailer');




const app = express();



const port = 3000;

const JWT_SECRET=process.env.SECRET_KEY;


app.set('trust proxy', true);
app.use(bodyParser.json({limit:'10mb'}));
app.use(cors());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /users:
 *   get:
 *     description: Get all users
 *     responses:
 *       200:
 *         description: Success
 */
app.get('/users', (req, res) => {
  res.status(200).json([{ name: 'John Doe' }, { name: 'Jane Doe' }]);
});

app.get('/', (req, res) => {
  res.send('Hello World!')
})




const login=require('./routes/login');
app.use('/logIn',login);

const signIn=require('./routes/signIn');
app.use('/signIn',signIn);

const getTodos = require('./routes/getTodos');
app.use('/getTodos',authenticateToken, getTodos);

const getItems = require('./routes/getItems');
app.use('/getItems', getItems);



app.post("/sendMail",async(req,res)=>{
  const mailOptions = {
    from: process.env.COMPANY_MAIL, // Sender address
    to: 'arpit.khandelwal2022@glbajajgroup.org', // List of recipients
    subject: 'Hello from Nodemailer', // Subject line
    text: 'This is a plain text message.', // Plain text body
    html: '<h1>This is an HTML message</h1>' // HTML body
};

// Send the email
transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.error('Error sending email:', error);
    } else {
        console.log('Email sent successfully:', info.response);
    }
});
})






//Global error handler
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: 'Internal Server Error' });
});

//start server
let x=app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

const wss = new ws.WebSocketServer({ server: x });

wss.on('connection', function connection(ws) {
  authenticateToken();
    ws.on('message', function message(data, isBinary) {
      wss.clients.forEach((client) => {
       if (client !== ws && client.readyState === ws.OPEN) {
         client.send(data, { binary: isBinary });
       }
      });
    });

    ws.send("Hello message from server");
});
