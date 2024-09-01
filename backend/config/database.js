const {
  Sequelize
} = require('sequelize');

const {
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_HOST
} = process.env;

if (!DB_NAME || !DB_USER || !DB_PASSWORD || !DB_HOST) {
  throw new Error('One or more required environment variables are missing: DB_NAME, DB_USER, DB_PASSWORD, DB_HOST');
}

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  dialect: 'mysql',
  port: process.env.DB_PORT || 3306, // Port beállítása környezeti változóból
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: false
});

// Kapcsolat ellenőrzése
sequelize.authenticate()
  .then(() => console.log('Adatbázis kapcsolat sikeresen létrehozva.'))
  .catch(err => {
    console.error('Nem sikerült kapcsolódni az adatbázishoz:', err);
    process.exit(1); // Kilépés hiba esetén
  });

module.exports = sequelize;