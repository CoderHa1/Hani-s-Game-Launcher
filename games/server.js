const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the "Bro Moves" folder
app.use(express.static(__dirname));

const rooms = {};

io.on('connection', (socket) => {
  console.log(`Connected: ${socket.id}`);

  socket.on('createServer', (roomCode) => {
    socket.join(roomCode);
    rooms[roomCode] = [socket.id];
    socket.emit('joinedServer', { roomCode });
    console.log(`Created server: ${roomCode}`);
  });

  socket.on('joinServer', (roomCode) => {
    if (rooms[roomCode]) {
      socket.join(roomCode);
      rooms[roomCode].push(socket.id);
      socket.emit('joinedServer', { roomCode });
      socket.to(roomCode).emit('playerJoined', { id: socket.id });
      console.log(`Player joined server: ${roomCode}`);
    } else {
      socket.emit('errorJoin', 'Room not found.');
    }
  });

  socket.on('move', ({ roomCode, data }) => {
    socket.to(roomCode).emit('playerMove', { id: socket.id, data });
  });

  socket.on('disconnect', () => {
    for (const [roomCode, players] of Object.entries(rooms)) {
      const index = players.indexOf(socket.id);
      if (index !== -1) {
        players.splice(index, 1);
        socket.to(roomCode).emit('playerLeft', { id: socket.id });
        console.log(`Player left: ${socket.id}`);
        break;
      }
    }
  });
});

server.listen(3000, () => console.log('✅ Server running at http://localhost:3000'));
