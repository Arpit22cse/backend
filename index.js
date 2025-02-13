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
const authenticateToken=require('./middlewares/auth');
const checkParameter=require('./middlewares/zod');
const transporter=require('./utils/nodemailer');




const app = express();



const port = 3000;

const JWT_SECRET=process.env.SECRET_KEY;



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





app.post('/signIn', checkParameter, async (req, res, next) => {
  try {
    const hashedPassword = await hashPassword(req.body.password);
    const userData={name:req.body.name , email:req.body.email , password:hashedPassword};
    const user = new User(userData);

    user.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    next(error);
  }
});



app.post('/logIn',limiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    //console.log(req.body);
    const user = await db.collection('users').findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const isValid = await validatePassword(password, user.password);

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 3600000 });

    res.status(200).json({ message: 'Logged in successfully', token });
  } catch (error) {
    next(error);
  }
});


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



app.post('/addTask', authenticateToken, async (req, res, next) => {
  try {

    const result = await db.collection('users').findOne({ email: req.user.email });

    const taskData={
      title:req.body.title,
      description:req.body.description,
      user:result._id,
    }

    const task=new Task(taskData);
    const saveTask = await task.save();

    const saveUser=await db.collection('users').updateOne({_id:result._id},{$push:{todos:saveTask._id}});

    if (saveUser.modifiedCount === 1) {
      res.status(200).json({ message: 'Task added successfully' });
    } else {
      res.status(404).json({ message: 'User not found or task not added' });
    }
  } catch (error) {
    next(error);
  }
});



app.post("/addItem", authenticateToken, async(req,res,next)=>{
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


app.get("/getItems",  async (req,res,next) => {

  try{
    const items = await Item.find().exec();
    res.status(200).json({ items });
  }catch (error) {
    next(error);
  }

})

app.get('/getTodos', authenticateToken, async (req, res, next) => {
  try {
    const user=await db.collection('users').findOne({email:req.user.email});
    const todos=await db.collection('tasks').find({ user: user._id }).toArray();
    res.status(200).json({todos:todos});
  } catch (error) {
    next(error);
  }



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
