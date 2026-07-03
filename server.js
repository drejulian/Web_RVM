const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { default: mqttService } = require('./src/services/mqtt-service.js');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Store io instance globally for API routes
  global.io = io;

  // Initialize MQTT Service
  console.log('🚀 Initializing MQTT Service...');
  mqttService.connect();

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('📴 Shutting down gracefully...');
    mqttService.disconnect();
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('📴 Received SIGINT, shutting down...');
    mqttService.disconnect();
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // Join bottle detection room
    socket.join('bottle-detection');

    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to BottleIn real-time updates',
      timestamp: new Date().toISOString(),
    });
  });

  server
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log('> Socket.IO server initialized');
    });
});
