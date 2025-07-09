const express = require('express');
const crypto = require('crypto');
const logger = require('../loggingmiddleware/middleware/logger');


const app = express();
const PORT = 3000;

app.use(express.json());
app.use(logger);

const urlMap = {};

// Fake location generator
function getFakeLocation() {
  const locations = ['India', 'USA', 'Germany', 'UK', 'Australia'];
  return locations[Math.floor(Math.random() * locations.length)];
}

// POST /shorturls → Create a short URL
app.post('/shorturls', (req, res) => {
  const { url, validity = 30, shortcode } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const code = shortcode || crypto.randomBytes(3).toString('hex');

  if (urlMap[code]) {
    return res.status(409).json({ error: 'Shortcode already exists' });
  }

  const createdAt = Date.now();
  const expiresAt = createdAt + validity * 60 * 1000;

  urlMap[code] = {
    originalUrl: url,
    createdAt,
    expiresAt,
    clicks: []
  };

  return res.status(201).json({
    shortLink: `http://localhost:${PORT}/${code}`,
    expiry: new Date(expiresAt).toISOString()
  });
});

// GET /:shortcode → Redirect to original URL
app.get('/:shortcode', (req, res) => {
  const { shortcode } = req.params;
  const entry = urlMap[shortcode];

  if (!entry) {
    return res.status(404).json({ error: 'Short URL not found' });
  }

  if (Date.now() > entry.expiresAt) {
    delete urlMap[shortcode];
    return res.status(410).json({ error: 'Short URL has expired' });
  }

  entry.clicks.push({
    timestamp: new Date().toISOString(),
    referrer: req.get('Referrer') || 'direct',
    location: getFakeLocation()
  });

  res.redirect(entry.originalUrl);
});

// GET /shorturls/:shortcode → Get statistics
app.get('/shorturls/:shortcode', (req, res) => {
  const { shortcode } = req.params;
  const entry = urlMap[shortcode];

  if (!entry) {
    return res.status(404).json({ error: 'Short URL not found' });
  }

  res.json({
    originalUrl: entry.originalUrl,
    createdAt: new Date(entry.createdAt).toISOString(),
    expiresAt: new Date(entry.expiresAt).toISOString(),
    totalClicks: entry.clicks.length,
    clickLogs: entry.clicks
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
