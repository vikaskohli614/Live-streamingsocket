
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { ExpressPeerServer } = require('peer');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// PeerJS server setup (signaling server)
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/myapp'
});

app.use('/peerjs', peerServer);

// Store active streams
const activeStreams = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Broadcaster starts streaming
  socket.on('broadcaster-start', ({ streamId, peerId }) => {
    activeStreams.set(streamId, {
      peerId,
      viewers: new Set(),
      broadcasterSocketId: socket.id
    });
    console.log(`Stream started: ${streamId} by peer ${peerId}`);
    socket.join(streamId);
  });

  // Viewer joins stream
  socket.on('viewer-join', ({ streamId, peerId }) => {
    const stream = activeStreams.get(streamId);
    if (stream) {
      stream.viewers.add(socket.id);
      socket.join(streamId);
      
      // Send broadcaster peer ID to viewer
      socket.emit('broadcaster-peer-id', { 
        broadcasterPeerId: stream.peerId 
      });
      
      // Notify broadcaster of new viewer count
      io.to(streamId).emit('viewer-count', { 
        count: stream.viewers.size 
      });
      
      console.log(`Viewer joined ${streamId}. Total: ${stream.viewers.size}`);
    } else {
      socket.emit('stream-not-found');
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Check if broadcaster disconnected
    activeStreams.forEach((stream, streamId) => {
      if (stream.broadcasterSocketId === socket.id) {
        io.to(streamId).emit('stream-ended');
        activeStreams.delete(streamId);
        console.log(`Stream ended: ${streamId}`);
      } else if (stream.viewers.has(socket.id)) {
        stream.viewers.delete(socket.id);
        io.to(streamId).emit('viewer-count', { 
          count: stream.viewers.size 
        });
      }
    });
  });

  // Broadcaster manually ends stream
  socket.on('broadcaster-stop', ({ streamId }) => {
    const stream = activeStreams.get(streamId);
    if (stream && stream.broadcasterSocketId === socket.id) {
      io.to(streamId).emit('stream-ended');
      activeStreams.delete(streamId);
      console.log(`Stream stopped: ${streamId}`);
    }
  });
});

// API endpoint to check if stream exists
app.get('/api/stream/:streamId', (req, res) => {
  const { streamId } = req.params;
  const stream = activeStreams.get(streamId);
  
  if (stream) {
    res.json({ 
      exists: true, 
      viewerCount: stream.viewers.size 
    });
  } else {
    res.json({ exists: false });
  }
});

// Get all active streams
app.get('/api/streams', (req, res) => {
  const streams = Array.from(activeStreams.entries()).map(([id, data]) => ({
    streamId: id,
    viewerCount: data.viewers.size
  }));
  res.json(streams);
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`PeerJS server running on /peerjs`);
});