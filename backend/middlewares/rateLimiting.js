const rateLimit = require('express-rate-limit');

const rateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 perc időablak
  max: 50, // max 50 kérés IP-nként ezen az időtartamon belül
  message: "Too many requests from this IP address, try again later.",
  headers: true,
  skip: function (req, res) {
    // Ellenőrizze, ha a felhasználó JWT tokenje adminisztrátori jogosultságokat tartalmaz
    return req.user && req.user.role === '3';
  },
  validate: {
    trustProxy: false // Tiltja a proxy beállítások ellenőrzését
  }
});

module.exports = rateLimiter;
