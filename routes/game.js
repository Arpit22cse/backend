const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const authenticateToken = require('../middlewares/authenticateToken');

 // roomId -> { id, name, players: [] }
const rooms = new Map();
router.get('/', (req, res) => {
  const roomList = [...rooms.values()].map(room => ({
    id: room.id,
    name: room.name,
    players:room.players,
    status: room.status || 'waiting', // Default status if not set
    createdAt: room.createdAt || new Date().toISOString(), // Default createdAt if not set
  }));
  res.json(roomList);
});

router.post('/',(req, res) => {
  const { name } = req.body;
  const id = uuidv4();

  const newRoom = {
    id,
    name,
    players: [],
    status: 'waiting', // Default status
    createdAt: new Date().toISOString(), // Timestamp of creation
  };
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Invalid room name' });
  }
  rooms.set(id, newRoom);
  res.status(200).json(newRoom);
});

router.post('/falcon/join', (req, res) => {
  
  const {roomId} = req.params;
  const room = rooms.get(roomId);
 

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (room.players.length >= 2) {
    return res.status(400).json({ error: 'Room is full' });
  }

  room.players.push({ id: uuidv4() }); 
  if(room.players.length===2){
    room.status='playing';
  }
  // Simplified player representation
  
  res.status(200).json({ message: 'Joined room', roomId });
});

router.post('/random/join', (req, res) => {
  
  const availableRoom = [...rooms.values()].find(room => room.players.length < 2);

  if (!availableRoom) {
    return res.status(200).json({ error: 'No available rooms' });
  }

  //availableRoom.players.push({ id: uuidv4() });
  res.status(200).json({ message: 'Joined random room', roomId: availableRoom.id });
});

module.exports = {router,rooms};
