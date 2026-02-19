const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const { connectDB, port } = require('./config/config');
const { initializeSocket } = require('./lib/socket');

// Initialize app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize socket handlers
initializeSocket(io);

// Connect to Database
connectDB();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Static folder for uploads
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api', require('./routes/index'));

app.get('/', (req, res) => {
  res.json({ message: 'TaskiFy API is running...' });
});

// Error Handling Middleware
app.use((err, req, res) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`💬 Socket.io server ready for chat`);
});
