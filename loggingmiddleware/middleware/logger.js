const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'logs.txt');

const logger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const log = `[${new Date().toISOString()}] ${req.method} ${
      req.originalUrl
    } ${res.statusCode} ${Date.now() - start}ms\n`;

    fs.appendFile(logFile, log, err => {
      if (err) console.error('Logging failed:', err.message);
    });
  });

  next();
};

module.exports = logger;
