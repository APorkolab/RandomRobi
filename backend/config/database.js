const { Sequelize } = require('sequelize');

const {
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_HOST
} = process.env;

if (!DB_NAME) {
  throw new Error('DB_NAME environment variable is required');
}

// Use SQLite for development if database name ends with .db or host is localhost without proper DB settings
const usesSQLite = DB_NAME.endsWith('.db') || (!DB_HOST || !DB_USER || !DB_PASSWORD);

const sequelize = usesSQLite
  ? new Sequelize({
    dialect: 'sqlite',
    storage: DB_NAME,
    logging: false,
  })
  : new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306,
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
  .catch((err) => {
    console.error('Nem sikerült kapcsolódni az adatbázishoz:', err);
    process.exit(1); // Kilépés hiba esetén
  });

module.exports = sequelize;
