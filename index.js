require('dotenv').config();
const express=require('express');
const User=require('./models/User');
const Task=require('./models/Task');
const Item=require('./models/Items');
const swaggerSpec=require('./config/swagger');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const jwt=require('jsonwebtoken');
const crypto=require('crypto')
const bodyParser=require('body-parser');
const db=require('./config/Database');
const cors=require('cors');
const cookie=require('cookie');
const WebSocket = require('ws');



const {hashPassword,validatePassword}=require('./utils/bcrypt');
const authenticateToken=require('./middlewares/authenticateToken');
const checkParameter=require('./middlewares/zod');
const transporter=require('./utils/nodemailer');




const app = express();
app.use(cors({
  origin: [
    'https://portfolio-umber-mu-89.vercel.app',
    'https://instagram-gray-six.vercel.app'
  ], // Allow both deployed frontend and local dev
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Allow credentials
}));


const port = 3000;

const JWT_SECRET=process.env.SECRET_KEY;


//app.set('trust proxy', true);
app.use(bodyParser.json({limit:'10mb'}));
//app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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


const {rooms}=require('./routes/game');

const login=require('./routes/login');
app.use('/login',login);

const signin=require('./routes/signin');
app.use('/signin',signin);

const getTodos = require('./routes/getTodos');
app.use('/getTodos',authenticateToken, getTodos);

const getItems = require('./routes/getItems');
app.use('/getItems', getItems);

const game =require("./routes/game");
app.use("/rooms",game.router);

const aut = require('./routes/auth');
app.use('/auth',aut);

const instagram = require('./routes/instagram');
app.use('/instagram', instagram);

app.post("/sendMail",async(req,res)=>{
  
  const { message, email, name, subject} = req.body;

  const mailOptions = {
    from: process.env.COMPANY_MAIL, // Sender address
    to: 'arpit.khandelwal2022@glbajajgroup.org', // List of recipients
    subject: 'Hello from Nodemailer', // Subject line
    text: 'This is a plain text message.', // Plain text body      
    html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,

  };

// Send the email
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, message: 'Failed to send email', error: error.toString() });
  } else {
    res.status(200).json({ success: true, message: 'Email sent successfully' });
  }
});

})






//Global error handler
app.get((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: 'Internal Server Error' });
});

//start server
const x=app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

const wss = new WebSocket.Server({ server: x });

// Map to store room details: roomId -> { id, name, players: [], status, createdAt }

const roomState=new Map();

app.get("/getData",(req,res)=>{
	const a = [...rooms.values()];
	const b = [...roomState.values()];
	
	res.status(200).json({a,b});
});

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      handleMessage(ws, message);
    } catch (error) {
      console.error('Error parsing message:', error);
      ws.send(JSON.stringify({ type: 'ERROR', payload: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    handleDisconnection(ws);
  });
});

function handleMessage(ws, message) {
  const { type, payload } = message;

  switch (type) {

    case 'JOIN_ROOM':
      joinRoom(ws, payload.roomId,payload.token);
      break;

    case 'LEAVE_ROOM':
      leaveRoom(ws);
      break;

    case 'MAKE_MOVE':
      makeMove(ws, payload.index);
      break;

    default:
      ws.send(JSON.stringify({ type: 'ERROR', payload: 'Unknown message type' }));
  }
}



async function joinRoom(ws, roomId, token) {
  
  const user=jwt.decode(token).id;

  const room=rooms.get(roomId);

  if(roomState.get(roomId)===undefined){
    const gameState = {
      board: Array(9).fill(null),
      currentPlayer: 'X',
      winner: null,
      isGameOver: false,
      playerX: null,
      playerO: null,
      roomId: null,
    };
    gameState.roomId=roomId;
    roomState.set(roomId,gameState);
  }

  const gameState=roomState.get(roomId);
  

  if (room && room.players.length < 2) {
    room.players.push(ws);
    room.room=room;

    if (room.players.length === 1) {
      gameState.playerX = user;
      room.status = 'waiting';
    } else if (room.players.length === 2) {
      gameState.playerO = user;
      room.status = 'waiting';
    }

    

    room.players.forEach((player) => {
      if (player && typeof player.send === 'function') {
        player.send(JSON.stringify({ type: 'GAME_STATE_UPDATE', payload: gameState }));
      }
    });
  } else {
    ws.send(JSON.stringify({ type: 'ERROR', payload: 'Room full or not found' }));
  }
}

function leaveRoom(ws) {
  const room = findRoomByPlayer(ws);
  if (room) {
    room.players = room.players.filter((player) => player !== ws);


    if (room.players.length === 1) {
      rooms.delete(room.id);
      room.players.forEach((player) => {
        if (player && typeof player.send === 'function') {
          const gameState=roomState.get(room.id);
          gameState.isGameOver=true;
          roomState.delete(gameState.roomId);
          player.send(JSON.stringify({ type: 'GAME_STATE_UPDATE', payload: gameState }));
        }
      });
    }
  }
}

function makeMove(ws, index) {

  const room = findRoomByPlayer(ws);
  const gameState=roomState.get(room.id);

  if(gameState.currentPlayer==='O'){
    gameState.board[index]='O';
    gameState.currentPlayer='X';
  }else{
    gameState.board[index]='X';
    gameState.currentPlayer='O';
  }

  if(checkWinner(gameState.board)){
    if(gameState.currentPlayer==='X'){
      gameState.status='finished';
      gameState.winner='O';
    }else{
      gameState.status='finished';
      gameState.winner='X';
    }
  }else{
    if(checkGameover(gameState.board)){
      gameState.winner='draw';
    }
  }
  
  
  if (room) {
    room.players.forEach((player) => {
      if (player && typeof player.send === 'function') {
        player.send(JSON.stringify({ type: 'GAME_STATE_UPDATE', payload: gameState }));
      }
    });
  } else {
    ws.send(JSON.stringify({ type: 'ERROR', payload: 'Room not found or player not in a room' }));
  }
}

function handleDisconnection(ws) {
  const room = findRoomByPlayer(ws);
  if (room) {
    room.players = room.players.filter((player) => player !== ws);

    if (room.players.length === 1) {
      const remainingPlayer = room.players[0];
      if (remainingPlayer && typeof remainingPlayer.send === 'function') {
        remainingPlayer.send(JSON.stringify({ type: 'PLAYER_LEFT', payload: 'Opponent left the room' }));
      }
    }

    rooms.delete(room.id);
  }
  leaveRoom(ws);
}

function findRoomByPlayer(ws) {
  return [...rooms.values()].find((room) => room.players.includes(ws));
}

function checkWinner(arr){
  if(arr[0]===arr[1] && arr[1]===arr[2] && arr[1]!=null) return true;
  if(arr[3]===arr[4] && arr[4]===arr[5] && arr[5]!=null) return true;
  if(arr[6]===arr[7] && arr[8]===arr[7] && arr[7]!=null) return true;
  if(arr[0]===arr[4] && arr[4]===arr[8] && arr[4]!=null) return true;
  if(arr[2]===arr[4] && arr[4]===arr[6] && arr[6]!=null) return true;
  if(arr[0]===arr[3] && arr[6]===arr[0] && arr[3]!=null) return true;
  if(arr[1]===arr[4] && arr[4]===arr[7] && arr[4]!=null) return true;
  if(arr[2]===arr[5] && arr[5]===arr[8] && arr[5]!=null) return true;
  return false;
}

function checkGameover(arr){
  var count=0;
  arr.map((key)=>{
    if(key!=null) count++;
  });
  return count===9;
}

module.exports = rooms;