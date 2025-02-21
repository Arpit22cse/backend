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
const ws=require('ws');



const {hashPassword,validatePassword}=require('./utils/bcrypt');
const authenticateToken=require('./middlewares/authenticateToken');
const checkParameter=require('./middlewares/zod');
const transporter=require('./utils/nodemailer');




const app = express();



const port = 3000;

const JWT_SECRET=process.env.SECRET_KEY;


//app.set('trust proxy', true);
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

//const wss = new ws.WebSocketServer({ server: x });

// wss.on('connection', function connection(ws) {
//   //authenticateToken();
//     ws.on('message', function message(data, isBinary) {
//       wss.clients.forEach((client) => {
//        if (client !== ws && client.readyState === ws.OPEN) {
//          client.send(data, { binary: isBinary });
//        }
//       });
//     });
//     ws.on('close',()=>{
//       console.log("closed");
//     })
//     console.log(wss.clients.size);

//     ws.send("Hello message from server");
// });



const server = new ws.WebSocketServer({ port:x });
const rooms = {}; // Store rooms and players
const waitingPlayers = []; // Queue for random matchmaking

server.on('connection', (socket) => {
    socket.on('message', (message) => {
        const data = JSON.parse(message);
        
        if (data.type === 'createOrJoin') {
            if (data.roomId) {
                // Join specific room
                joinRoom(socket, data.roomId);
            } else {
                // Join random matchmaking
                joinRandom(socket);
            }
        } else if (data.type === 'move') {
            handleMove(socket, data.roomId, data.index);
        }
    });

    socket.on('close', () => {
        removePlayer(socket);
    });
});

function joinRoom(socket, roomId) {
    if (!rooms[roomId]) {
        rooms[roomId] = { players: [], board: Array(9).fill(null), turn: 'X' };
    }
    
    if (rooms[roomId].players.length < 2) {
        rooms[roomId].players.push(socket);
        socket.roomId = roomId;
        socket.send(JSON.stringify({ type: 'joined', roomId, symbol: rooms[roomId].players.length === 1 ? 'X' : 'O' }));
        
        if (rooms[roomId].players.length === 2) {
            broadcast(roomId, { type: 'start', board: rooms[roomId].board, turn: rooms[roomId].turn });
        }
    } else {
        socket.send(JSON.stringify({ type: 'full' }));
    }
}

function joinRandom(socket) {
    if (waitingPlayers.length > 0) {
        const opponent = waitingPlayers.pop();
        const roomId = `room-${Date.now()}`;
        rooms[roomId] = { players: [opponent, socket], board: Array(9).fill(null), turn: 'X' };
        
        opponent.roomId = roomId;
        socket.roomId = roomId;
        
        opponent.send(JSON.stringify({ type: 'joined', roomId, symbol: 'X' }));
        socket.send(JSON.stringify({ type: 'joined', roomId, symbol: 'O' }));
        
        broadcast(roomId, { type: 'start', board: rooms[roomId].board, turn: 'X' });
    } else {
        waitingPlayers.push(socket);
    }
}

function handleMove(socket, roomId, index) {
    const room = rooms[roomId];
    if (!room || room.board[index] !== null) return;
    
    const playerIndex = room.players.indexOf(socket);
    if (playerIndex === -1 || room.turn !== (playerIndex === 0 ? 'X' : 'O')) return;
    
    room.board[index] = room.turn;
    room.turn = room.turn === 'X' ? 'O' : 'X';
    
    broadcast(roomId, { type: 'update', board: room.board, turn: room.turn });
    
    const winner = checkWinner(room.board);
    if (winner) {
        broadcast(roomId, { type: 'win', winner });
        delete rooms[roomId];
    } else if (!room.board.includes(null)) {
        broadcast(roomId, { type: 'draw' });
        delete rooms[roomId];
    }
}

function broadcast(roomId, message) {
    rooms[roomId]?.players.forEach(player => player.send(JSON.stringify(message)));
}

function checkWinner(board) {
    const winningPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];
    
    for (const pattern of winningPatterns) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a]; // 'X' or 'O'
        }
    }
    return null;
}

function removePlayer(socket) {
    const { roomId } = socket;
    if (roomId && rooms[roomId]) {
        rooms[roomId].players = rooms[roomId].players.filter(player => player !== socket);
        broadcast(roomId, { type: 'opponentLeft' });
        delete rooms[roomId];
    }
    const index = waitingPlayers.indexOf(socket);
    if (index !== -1) waitingPlayers.splice(index, 1);
}

//console.log('WebSocket server running on ws://localhost:8080');

