// const express = require("express");
// const http = require("http");
// const socketIO = require("socket.io");
// const mediasoup = require("mediasoup");
// const cors = require("cors");

// const app = express();
// app.use(cors());

// const server = http.createServer(app);
// const io = socketIO(server, {
//   cors: { origin: "*" }
// });

// let worker;
// let router;
// let producerTransport;
// let consumerTransports = {};
// let producers = {};
// let consumers = {};

// const mediaCodecs = [
//   {
//     kind: "audio",
//     mimeType: "audio/opus",
//     clockRate: 48000,
//     channels: 2
//   },
//   {
//     kind: "video",
//     mimeType: "video/VP8",
//     clockRate: 90000
//   }
// ];

// (async () => {
//   worker = await mediasoup.createWorker();
//   router = await worker.createRouter({ mediaCodecs });
//   console.log("Mediasoup Worker & Router created");
// })();

// io.on("connection", socket => {
//   console.log("Client connected:", socket.id);

//   socket.on("getRtpCapabilities", cb => {
//     cb(router.rtpCapabilities);
//   });

//   socket.on("createProducerTransport", async cb => {
//     producerTransport = await router.createWebRtcTransport({
//       listenIps: [{ ip: "0.0.0.0", announcedIp: null }],
//       enableUdp: true,
//       enableTcp: true
//     });

//     cb({
//       id: producerTransport.id,
//       iceParameters: producerTransport.iceParameters,
//       iceCandidates: producerTransport.iceCandidates,
//       dtlsParameters: producerTransport.dtlsParameters
//     });
//   });

//   socket.on("connectProducerTransport", async ({ dtlsParameters }) => {
//     await producerTransport.connect({ dtlsParameters });
//   });

//   socket.on("produce", async ({ kind, rtpParameters }, cb) => {
//     const producer = await producerTransport.produce({ kind, rtpParameters });
//     producers[kind] = producer;
//     cb({ id: producer.id });
//   });

//   socket.on("createConsumerTransport", async cb => {
//     const transport = await router.createWebRtcTransport({
//       listenIps: [{ ip: "0.0.0.0", announcedIp: null }],
//       enableUdp: true,
//       enableTcp: true
//     });

//     consumerTransports[socket.id] = transport;

//     cb({
//       id: transport.id,
//       iceParameters: transport.iceParameters,
//       iceCandidates: transport.iceCandidates,
//       dtlsParameters: transport.dtlsParameters
//     });
//   });

//   socket.on("connectConsumerTransport", async ({ dtlsParameters }) => {
//     await consumerTransports[socket.id].connect({ dtlsParameters });
//   });

//   socket.on("consume", async ({ rtpCapabilities }, cb) => {
//     const consumersList = [];

//     for (const kind in producers) {
//       if (!router.canConsume({
//         producerId: producers[kind].id,
//         rtpCapabilities
//       })) continue;

//       const consumer = await consumerTransports[socket.id].consume({
//         producerId: producers[kind].id,
//         rtpCapabilities,
//         paused: false
//       });

//       consumers[kind] = consumer;

//       consumersList.push({
//         id: consumer.id,
//         producerId: producers[kind].id,
//         kind,
//         rtpParameters: consumer.rtpParameters
//       });
//     }

//     cb(consumersList);
//   });

//   socket.on("disconnect", () => {
//     console.log("Disconnected:", socket.id);
//   });
// });

// server.listen(4000, () => {
//   console.log("Server running on http://localhost:4000");
// });


// const express = require('express');
// const http = require('http');
// const socketIO = require('socket.io');
// const mediasoup = require('mediasoup');
// const cors = require('cors');

// const app = express();
// app.use(cors());
// app.use(express.json());

// const httpServer = http.createServer(app);
// const io = socketIO(httpServer, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"]
//   }
// });

// const PORT = 3001;

// let worker;
// let router;
// let producerTransport;
// let consumerTransports = new Map();
// let producer;
// let consumers = new Map();

// const mediaCodecs = [
//   {
//     kind: 'audio',
//     mimeType: 'audio/opus',
//     clockRate: 48000,
//     channels: 2
//   },
//   {
//     kind: 'video',
//     mimeType: 'video/VP8',
//     clockRate: 90000,
//     parameters: {
//       'x-google-start-bitrate': 1000
//     }
//   }
// ];

// async function createWorker() {
//   worker = await mediasoup.createWorker({
//     rtcMinPort: 10000,
//     rtcMaxPort: 10100,
//     logLevel: 'warn',
//     logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp']
//   });

//   console.log(`Worker pid ${worker.pid}`);

//   worker.on('died', error => {
//     console.error('mediasoup worker has died', error);
//     setTimeout(() => process.exit(1), 2000);
//   });

//   return worker;
// }

// async function createRouter() {
//   router = await worker.createRouter({ mediaCodecs });
//   console.log('Router created');
// }

// (async () => {
//   await createWorker();
//   await createRouter();
// })();

// io.on('connection', (socket) => {
//   console.log('Client connected:', socket.id);

//   socket.on('getRouterRtpCapabilities', (callback) => {
//     callback(router.rtpCapabilities);
//   });

//   socket.on('createProducerTransport', async (callback) => {
//     try {
//       const transport = await router.createWebRtcTransport({
//         listenIps: [{ ip: '0.0.0.0', announcedIp: '127.0.0.1' }],
//         enableUdp: true,
//         enableTcp: true,
//         preferUdp: true
//       });

//       producerTransport = transport;

//       callback({
//         id: transport.id,
//         iceParameters: transport.iceParameters,
//         iceCandidates: transport.iceCandidates,
//         dtlsParameters: transport.dtlsParameters
//       });
//     } catch (error) {
//       console.error('Error creating producer transport:', error);
//       callback({ error: error.message });
//     }
//   });

//   socket.on('connectProducerTransport', async ({ dtlsParameters }, callback) => {
//     await producerTransport.connect({ dtlsParameters });
//     callback();
//   });

//   socket.on('produce', async ({ kind, rtpParameters }, callback) => {
//     producer = await producerTransport.produce({ kind, rtpParameters });

//     console.log('Producer created:', producer.id, kind);

//     producer.on('transportclose', () => {
//       console.log('Producer transport closed');
//       producer = null;
//     });

//     socket.broadcast.emit('newProducer');

//     callback({ id: producer.id });
//   });

//   socket.on('createConsumerTransport', async (callback) => {
//     try {
//       const transport = await router.createWebRtcTransport({
//         listenIps: [{ ip: '0.0.0.0', announcedIp: '127.0.0.1' }],
//         enableUdp: true,
//         enableTcp: true,
//         preferUdp: true
//       });

//       consumerTransports.set(socket.id, transport);

//       callback({
//         id: transport.id,
//         iceParameters: transport.iceParameters,
//         iceCandidates: transport.iceCandidates,
//         dtlsParameters: transport.dtlsParameters
//       });
//     } catch (error) {
//       console.error('Error creating consumer transport:', error);
//       callback({ error: error.message });
//     }
//   });

//   socket.on('connectConsumerTransport', async ({ dtlsParameters }, callback) => {
//     const transport = consumerTransports.get(socket.id);
//     await transport.connect({ dtlsParameters });
//     callback();
//   });

//   socket.on('consume', async ({ rtpCapabilities }, callback) => {
//     try {
//       if (!producer) {
//         callback({ error: 'No active producer' });
//         return;
//       }

//       const transport = consumerTransports.get(socket.id);

//       if (!router.canConsume({ producerId: producer.id, rtpCapabilities })) {
//         callback({ error: 'Cannot consume' });
//         return;
//       }

//       const consumer = await transport.consume({
//         producerId: producer.id,
//         rtpCapabilities,
//         paused: true
//       });

//       consumers.set(socket.id, consumer);

//       consumer.on('transportclose', () => {
//         console.log('Consumer transport closed');
//         consumers.delete(socket.id);
//       });

//       consumer.on('producerclose', () => {
//         console.log('Producer closed');
//         socket.emit('producerClosed');
//         consumers.delete(socket.id);
//       });

//       callback({
//         id: consumer.id,
//         producerId: producer.id,
//         kind: consumer.kind,
//         rtpParameters: consumer.rtpParameters
//       });
//     } catch (error) {
//       console.error('Error consuming:', error);
//       callback({ error: error.message });
//     }
//   });

//   socket.on('resumeConsumer', async (callback) => {
//     const consumer = consumers.get(socket.id);
//     if (consumer) {
//       await consumer.resume();
//       callback();
//     }
//   });

//   socket.on('disconnect', () => {
//     console.log('Client disconnected:', socket.id);
//     const transport = consumerTransports.get(socket.id);
//     if (transport) {
//       transport.close();
//       consumerTransports.delete(socket.id);
//     }
//     consumers.delete(socket.id);
//   });
// });

// httpServer.listen(PORT, () => {
//   console.log(`
// ╔═══════════════════════════════════════════════╗
// ║   MediaSoup Server Running                    ║
// ║   URL: http://localhost:${PORT}                ║
// ╚═══════════════════════════════════════════════╝
//   `);
// });

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mediasoup = require('mediasoup');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = http.createServer(app);
const io = socketIO(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = 3001;

let worker;
let router;
const rooms = new Map(); // roomId -> { producer, producerTransport, consumerTransports, consumers }

const mediaCodecs = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
    parameters: {
      'x-google-start-bitrate': 1000
    }
  }
];

async function createWorker() {
  worker = await mediasoup.createWorker({
    rtcMinPort: 10000,
    rtcMaxPort: 10100,
    logLevel: 'warn',
    logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp']
  });
  
  console.log(`Worker pid ${worker.pid}`);
  
  worker.on('died', error => {
    console.error('mediasoup worker has died', error);
    setTimeout(() => process.exit(1), 2000);
  });
  
  return worker;
}

async function createRouter() {
  router = await worker.createRouter({ mediaCodecs });
  console.log('Router created');
}

(async () => {
  await createWorker();
  await createRouter();
})();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('createRoom', async ({ roomId }, callback) => {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        producers: new Map(),
        producerTransport: null,
        consumerTransports: new Map(),
        consumers: new Map()
      });
      callback({ success: true });
    } else {
      callback({ success: false, error: 'Room already exists' });
    }
  });

  socket.on('getRouterRtpCapabilities', (callback) => {
    callback(router.rtpCapabilities);
  });

  socket.on('createProducerTransport', async ({ roomId }, callback) => {
    try {
      const transport = await router.createWebRtcTransport({
        listenIps: [{ ip: '0.0.0.0', announcedIp: '127.0.0.1' }],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true
      });

      const room = rooms.get(roomId);
      if (room) {
        room.producerTransport = transport;
      }

      callback({
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters
      });
    } catch (error) {
      console.error('Error creating producer transport:', error);
      callback({ error: error.message });
    }
  });

  socket.on('connectProducerTransport', async ({ roomId, dtlsParameters }, callback) => {
    const room = rooms.get(roomId);
    if (room && room.producerTransport) {
      await room.producerTransport.connect({ dtlsParameters });
      callback();
    }
  });

  socket.on('produce', async ({ roomId, kind, rtpParameters }, callback) => {
    const room = rooms.get(roomId);
    if (room && room.producerTransport) {
      const producer = await room.producerTransport.produce({ kind, rtpParameters });
      console.log('Producer created:', producer.id, kind);

      room.producers.set(kind, producer);

      producer.on('transportclose', () => {
        console.log('Producer transport closed');
        room.producers.delete(kind);
      });

      // Notify all clients in the room
      socket.to(roomId).emit('newProducer', { producerId: producer.id, kind });

      callback({ id: producer.id });
    }
  });

  socket.on('joinRoom', async ({ roomId }, callback) => {
    socket.join(roomId);
    const room = rooms.get(roomId);
    
    if (room) {
      const producerIds = Array.from(room.producers.entries()).map(([kind, producer]) => ({
        id: producer.id,
        kind
      }));
      callback({ success: true, producers: producerIds });
    } else {
      callback({ success: false, error: 'Room not found' });
    }
  });

  socket.on('createConsumerTransport', async ({ roomId }, callback) => {
    try {
      const transport = await router.createWebRtcTransport({
        listenIps: [{ ip: '0.0.0.0', announcedIp: '127.0.0.1' }],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true
      });

      const room = rooms.get(roomId);
      if (room) {
        if (!room.consumerTransports.has(socket.id)) {
          room.consumerTransports.set(socket.id, []);
        }
        room.consumerTransports.get(socket.id).push(transport);
      }

      callback({
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters
      });
    } catch (error) {
      console.error('Error creating consumer transport:', error);
      callback({ error: error.message });
    }
  });

  socket.on('connectConsumerTransport', async ({ roomId, transportId, dtlsParameters }, callback) => {
    const room = rooms.get(roomId);
    if (room && room.consumerTransports.has(socket.id)) {
      const transports = room.consumerTransports.get(socket.id);
      const transport = transports.find(t => t.id === transportId);
      if (transport) {
        await transport.connect({ dtlsParameters });
        callback();
      }
    }
  });

  socket.on('consume', async ({ roomId, transportId, producerId, rtpCapabilities }, callback) => {
    try {
      const room = rooms.get(roomId);
      if (!room) {
        callback({ error: 'Room not found' });
        return;
      }

      const transports = room.consumerTransports.get(socket.id);
      const transport = transports.find(t => t.id === transportId);

      if (!transport) {
        callback({ error: 'Transport not found' });
        return;
      }

      if (!router.canConsume({ producerId, rtpCapabilities })) {
        callback({ error: 'Cannot consume' });
        return;
      }

      const consumer = await transport.consume({
        producerId,
        rtpCapabilities,
        paused: true
      });

      if (!room.consumers.has(socket.id)) {
        room.consumers.set(socket.id, []);
      }
      room.consumers.get(socket.id).push(consumer);

      consumer.on('transportclose', () => {
        console.log('Consumer transport closed');
      });

      consumer.on('producerclose', () => {
        console.log('Producer closed');
        socket.emit('producerClosed', { producerId });
      });

      callback({
        id: consumer.id,
        producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters
      });
    } catch (error) {
      console.error('Error consuming:', error);
      callback({ error: error.message });
    }
  });

  socket.on('resumeConsumer', async ({ roomId, consumerId }, callback) => {
    const room = rooms.get(roomId);
    if (room && room.consumers.has(socket.id)) {
      const consumers = room.consumers.get(socket.id);
      const consumer = consumers.find(c => c.id === consumerId);
      if (consumer) {
        await consumer.resume();
        callback();
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Clean up all rooms
    rooms.forEach((room, roomId) => {
      if (room.consumerTransports.has(socket.id)) {
        room.consumerTransports.get(socket.id).forEach(transport => transport.close());
        room.consumerTransports.delete(socket.id);
      }
      if (room.consumers.has(socket.id)) {
        room.consumers.delete(socket.id);
      }
    });
  });
});

httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║         MediaSoup Server Running              ║
║         URL: http://localhost:${PORT}         ║
╚═══════════════════════════════════════════════╝
  `);
});