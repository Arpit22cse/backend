require('dotenv').config();
const express=require('express');
const User=require('./models/User');
const Task=require('./models/Task');
const jwt=require('jsonwebtoken');
const bodyParser=require('body-parser');
const db=require('./config/Database');
const {hashPassword,validatePassword}=require('./utils/bcrypt');
const authenticateToken=require('./middlewares/auth');
const checkParameter=require('./middlewares/zod')
const ws=require('ws');
const app = express();
const cors=require('cors');
const cookie=require('cookie');
const port = 3000;

const JWT_SECRET=process.env.SECRET_KEY;

app.use(bodyParser.json());
app.use(cors());

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

app.post('/logIn', async (req, res, next) => {
  try {
    const { email, password } = req.body;

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
