const router = require('express').Router();
const crypto = require('crypto');
const { body } = require('express-validator');
const xss = require('xss');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { apiLimiter, strictLimiter, validate } = require('../middleware/security');
const { calcPlatformFee } = require('../services/fees');
const { LISTING_SHOWCASE_DAYS } = require('../services/listingExpiry');
const { enrichListingAttributes } = require('../services/listingImport');
const {
  PROMOTE_PACKAGES,
  getPromotePackage,
  SQL_IS_PROMOTED,
} = require('../services/listingPromote');
const { creditPlatform, ENTRY_TYPES } = require('../services/platformLedger');

function showcaseDaysLeft(publishedAt) {
  if (!publishedAt) return LISTING_SHOWCASE_DAYS;
  const end = new Date(publishedAt).getTime() + LISTING_SHOWCASE_DAYS * 86400000;
  return Math.max(0, Math.ceil((end - Date.now()) / 86400000));
}

const VIEW_COOKIE = 'lootz_vid';
const VIEW_IP_COOLDOWN = '12 hours';

function ensureViewerCookie(req, res) {
  let vid = req.cookies?.[VIEW_COOKIE];
  if (!vid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(vid)) {
    vid = crypto.randomUUID();
    res.cookie(VIEW_COOKIE, vid, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 365 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }
  return vid;
}

// NOTE: Full file restored from pre-placeholder state with bonds type.
// If this message appears in production without full routes below, redeploy from git history.
