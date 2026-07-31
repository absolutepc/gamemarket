const router = require('express').Router();
const { body } = require('express-validator');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { strictLimiter, validate } = require('../middleware/security');

// List my conversations
router.get('/', authenticate(), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.*,
            CASE WHEN c.participant1_id = $1 THEN u2.username ELSE u1.username END AS partner_username,
            CASE WHEN c.participant1_id = $1 THEN u2.avatar_url ELSE u1.avatar_url END AS partner_avatar,
            CASE WHEN c.participant1_id = $1 THEN u2.id ELSE u1.id END AS partner_id,
            l.title AS listing_title,
            (
              SELECT content FROM chat_messages cm
              WHERE cm.conversation_id = c.id
              ORDER BY cm.created_at DESC LIMIT 1
            ) AS last_message,
            (
              SELECT COUNT(*)::int FROM chat_messages cm
              WHERE cm.conversation_id = c.id AND cm.sender_id != $1 AND cm.is_read = FALSE
            ) AS unread_count
     FROM conversations c
     JOIN users u1 ON u1.id = c.participant1_id
     JOIN users u2 ON u2.id = c.participant2_id
     LEFT JOIN listings l ON l.id = c.listing_id
     WHERE c.participant1_id = $1 OR c.participant2_id = $1
     ORDER BY c.last_message_at DESC NULLS LAST`,
    [req.user.id]
  );
  res.json(rows);
});

// Get or create conversation
router.post('/',
  authenticate(),
  strictLimiter,
  [
    body('partner_id').isUUID(),
    body('listing_id').optional().isUUID(),
    body('message').optional().trim().isLength({ min: 1, max: 2000 }),
  ],
  validate,
  async (req, res) => {
    const { partner_id, listing_id, message } = req.body;
    if (partner_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot chat with yourself' });
    }

    const p1 = req.user.id < partner_id ? req.user.id : partner_id;
    const p2 = req.user.id < partner_id ? partner_id : req.user.id;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let { rows } = await client.query(
        `SELECT * FROM conversations
         WHERE participant1_id=$1 AND participant2_id=$2
           AND (($3::uuid IS NULL AND listing_id IS NULL) OR listing_id=$3)
         FOR UPDATE`,
        [p1, p2, listing_id || null]
      );

      if (!rows[0]) {
        const inserted = await client.query(
          `INSERT INTO conversations (participant1_id, participant2_id, listing_id)
           VALUES ($1,$2,$3) RETURNING *`,
          [p1, p2, listing_id || null]
        );
        rows = inserted.rows;
      }

      const conversation = rows[0];
      if (message) {
        await client.query(
          `INSERT INTO chat_messages (conversation_id, sender_id, content)
           VALUES ($1,$2,$3)`,
          [conversation.id, req.user.id, message]
        );
        await client.query(
          'UPDATE conversations SET last_message_at=NOW() WHERE id=$1',
          [conversation.id]
        );
      }
      await client.query('COMMIT');
      res.status(201).json(conversation);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
);

// Get conversation with messages
router.get('/:id', authenticate(), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.*,
            CASE WHEN c.participant1_id = $2 THEN u2.username ELSE u1.username END AS partner_username,
            CASE WHEN c.participant1_id = $2 THEN u2.avatar_url ELSE u1.avatar_url END AS partner_avatar,
            CASE WHEN c.participant1_id = $2 THEN u2.id ELSE u1.id END AS partner_id,
            l.title AS listing_title
     FROM conversations c
     JOIN users u1 ON u1.id = c.participant1_id
     JOIN users u2 ON u2.id = c.participant2_id
     LEFT JOIN listings l ON l.id = c.listing_id
     WHERE c.id=$1`,
    [req.params.id, req.user.id]
  );
  const conv = rows[0];
  if (!conv) return res.status(404).json({ error: 'Not found' });
  if (conv.participant1_id !== req.user.id && conv.participant2_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await pool.query(
    `UPDATE chat_messages SET is_read=TRUE
     WHERE conversation_id=$1 AND sender_id != $2 AND is_read=FALSE`,
    [req.params.id, req.user.id]
  );

  const { rows: messages } = await pool.query(
    `SELECT m.*, u.username AS sender_username, u.avatar_url AS sender_avatar
     FROM chat_messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.conversation_id=$1
     ORDER BY m.created_at ASC`,
    [req.params.id]
  );

  res.json({ ...conv, messages });
});

// Send message via REST (fallback; WS preferred)
router.post('/:id/messages',
  authenticate(),
  strictLimiter,
  [body('content').trim().isLength({ min: 1, max: 2000 })],
  validate,
  async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM conversations WHERE id=$1', [req.params.id]);
    const conv = rows[0];
    if (!conv) return res.status(404).json({ error: 'Not found' });
    if (conv.participant1_id !== req.user.id && conv.participant2_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { rows: msgs } = await pool.query(
      `INSERT INTO chat_messages (conversation_id, sender_id, content)
       VALUES ($1,$2,$3) RETURNING *`,
      [req.params.id, req.user.id, req.body.content]
    );
    await pool.query(
      'UPDATE conversations SET last_message_at=NOW() WHERE id=$1',
      [req.params.id]
    );

    const partnerId = conv.participant1_id === req.user.id ? conv.participant2_id : conv.participant1_id;
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1,'chat','Новое сообщение',$2,$3)`,
      [partnerId, req.body.content.slice(0, 100), JSON.stringify({ conversation_id: req.params.id })]
    );

    res.status(201).json({
      ...msgs[0],
      sender_username: req.user.username,
    });
  }
);

module.exports = router;
