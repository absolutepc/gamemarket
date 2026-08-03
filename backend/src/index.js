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
const { isOriginAllowed } = require('./utils/origins');
const { apiLimiter } = require('./middleware/security');
const { authenticate, JWT_SECRET } = require('./middleware/auth');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) callback(null, true);
      else callback(new Error('Not allowed by CORS'));
    },
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
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(compression());
app.use(express.json({ limit: '6mb' }));
app.use(express.urlencoded({ extended: false, limit: '6mb' }));
app.use(cookieParser());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/listings/import', require('./routes/listingsImport'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/users', require('./routes/users'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/assortment', require('./routes/assortment'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/founders', require('./routes/founders'));
app.use('/api/contest', require('./routes/contest'));
app.use('/api', require('./routes/seo'));

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
    pool.query('UPDATE users SET last_seen_at=NOW() WHERE id=$1', [rows[0].id]).catch(() => {});
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  socket.on('join_transaction', (transactionId) => {
    socket.join(`tx:${transactionId}`);
  });

  socket.on('join_conversation', (conversationId) => {
    socket.join(`chat:${conversationId}`);
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

  socket.on('send_chat_message', async ({ conversation_id, content }) => {
    if (!content || content.length > 2000) return;
    try {
      const { rows: convRows } = await pool.query(
        'SELECT * FROM conversations WHERE id=$1',
        [conversation_id]
      );
      const conv = convRows[0];
      if (!conv) return;
      if (conv.participant1_id !== socket.user.id && conv.participant2_id !== socket.user.id) return;

      const { rows } = await pool.query(
        `INSERT INTO chat_messages (conversation_id, sender_id, content)
         VALUES ($1,$2,$3) RETURNING *`,
        [conversation_id, socket.user.id, content.trim()]
      );
      await pool.query(
        'UPDATE conversations SET last_message_at=NOW() WHERE id=$1',
        [conversation_id]
      );
      io.to(`chat:${conversation_id}`).emit('new_chat_message', {
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
const { startAutoReleaseJob } = require('./services/escrow');
const { startListingExpiryJob } = require('./services/listingExpiry');

async function start() {
  // Bind port first so deploys/healthchecks are not blocked by DDL locks
  server.listen(PORT, HOST, () => {
    logger.info(`Server running on http://${HOST}:${PORT}`);
  });

  try {
    await migrate();
  } catch (err) {
    logger.error(`Migration failed: ${err.message || err}`);
    if (err.code) logger.error(`DB error code: ${err.code}`);
    if (err.detail) logger.error(`DB error detail: ${err.detail}`);
  }

  startAutoReleaseJob(60_000);
  startListingExpiryJob(300_000);
}

start();

module.exports = { app, server };
