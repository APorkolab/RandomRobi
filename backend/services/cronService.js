const cron = require('node-cron');
const { generateAndStoreRandomVideo } = require('./videoService');
const logger = require('../logger/logger');

const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 0 */12 * * *';
const MAX_RETRIES = 3;

function initCronJob() {
  cron.schedule(CRON_SCHEDULE, async () => {
    let retries = 0;
    while (retries < MAX_RETRIES) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await generateAndStoreRandomVideo();
        logger.info('Cron job sikeresen végrehajtva');
        break;
      } catch (error) {
        // eslint-disable-next-line no-plusplus
        retries++;
        logger.error(`Hiba a cron job futtatásakor (${retries}. próbálkozás):`, error);
        if (retries >= MAX_RETRIES) {
          logger.error('Maximális újrapróbálkozások száma elérve. A cron job sikertelen.');
        }
      }
    }
  }, {
    timezone: 'Europe/Budapest'
  });

  logger.info('Cron job inicializálva');
}

module.exports = { initCronJob };
