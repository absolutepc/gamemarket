require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const pool = require('./config/database');
const logger = require('./utils/logger');
const { apiLimiter } = require('./middleware/security');
const { authenticate, JWT_SECRET } = require('./middleware/auth');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/users', require('./routes/users'));
app.use('/api/categories', require('./routes/categories'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Global error handler
app.use((err, req, res, next) => {
  logger.error(err);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' && status === 500
    ? 'Internal server error'
    : err.message;
  res.status(status).json({ error: message });
});

// WebSocket for real-time chat
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const { rows } = await pool.query('SELECT id, username FROM users WHERE id=$1', [payload.sub]);
    if (!rows[0]) return next(new Error('User not found'));
    socket.user = rows[0];
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  socket.on('join_transaction', (transactionId) => {
    socket.join(`tx:${transactionId}`);
  });

  socket.on('send_message', async ({ transaction_id, content }) => {
    if (!content || content.length > 2000) return;
    try {
      const { rows: tx } = await pool.query(
        'SELECT * FROM transactions WHERE id=$1',
        [transaction_id]
      );
      if (!tx[0]) return;
      if (tx[0].buyer_id !== socket.user.id && tx[0].seller_id !== socket.user.id) return;

      const { rows } = await pool.query(
        `INSERT INTO messages (transaction_id, sender_id, content)
         VALUES ($1,$2,$3) RETURNING *`,
        [transaction_id, socket.user.id, content.trim()]
      );
      io.to(`tx:${transaction_id}`).emit('new_message', {
        ...rows[0],
        sender_username: socket.user.username,
      });
    } catch (err) {
      logger.error(err);
    }
  });
});

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';
const { migrate } = require('./migrate');

async function start() {
  try {
    await migrate();
  } catch (err) {
    logger.error(`Migration failed: ${err.message || err}`);
    if (err.code) logger.error(`DB error code: ${err.code}`);
    if (err.detail) logger.error(`DB error detail: ${err.detail}`);
  }

  server.listen(PORT, HOST, () => {
    logger.info(`Server running on http://${HOST}:${PORT}`);
  });
}

start();

module.exports = { app, server };
