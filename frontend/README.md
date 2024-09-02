# RandomRobi Project Documentation

## Database Initialization

Our application uses Sequelize ORM to manage database operations. The database initialization process is controlled by an environment variable `CREATE_TABLES`.

## How it works

The server initialization process is handled in the `startServer` function in the `index.js` file:

```
This function does the following:

1. Authenticates the database connection.
2. Checks the `CREATE_TABLES` environment variable.
3. If `CREATE_TABLES` is set to 'true', it will force sync the database, dropping and recreating all tables.
4. If `CREATE_TABLES` is not set to 'true', it will perform an 'alter' sync, which updates existing tables without dropping them.

## Usage

To control the database initialization process:

1. For first-time setup or when you need to reset the database:
   Set `CREATE_TABLES=true` in your environment variables.

2. For normal operation after initial setup:
   Set `CREATE_TABLES=false` or remove the variable.

## Docker Usage

When using Docker, you can set the `CREATE_TABLES` environment variable in your Dockerfile or when running the container:

```
To run the container with table creation:

```
docker run -e CREATE_TABLES=true ...
```
For subsequent runs:

```
docker run -e CREATE_TABLES=false ...
```

## Important Notes

- Always backup your database before setting `CREATE_TABLES=true` in a production environment, as it will delete all existing data.
- In development environments, you might want to keep `CREATE_TABLES=true` to easily reset your database during testing.
- For production deployments, ensure `CREATE_TABLES` is set to 'false' or not set at all to prevent accidental data loss.

## Overview

RandomRobi is a web application that generates random YouTube video links. It consists of a backend API built with Node.js and Express, and a frontend application (not shown in the provided snippets).

## Backend Architecture

### Main Components

1. **Server Setup** (`server.js` and `index.js`)
   - Express application setup
   - Middleware configuration (CORS, body-parser, rate limiting)
   - Route definitions
   - Database initialization
   - Admin user creation

2. **Database Configuration** (`config/database.js`)
   - Sequelize ORM setup for MySQL database
   - Connection pool configuration

3. **API Routes**
   - User authentication (`controllers/login/router.js`)
   - Video management (implied from `services/videoService.js`)
   - User management (implied from route setup in `index.js`)

4. **Services**
   - Video generation service (`services/videoService.js`)
   - Cron job service (implied from `initCronJob()` in `server.js`)

5. **Middleware**
   - Authentication middleware (`middlewares/authenticate.js`)
   - Rate limiting (`middlewares/rateLimiting.js`)

6. **Documentation**
   - Swagger API documentation setup

### Key Features

1. **Database Initialization**
   - Controlled by `CREATE_TABLES` environment variable
   - Options for force sync (drop and recreate tables) or alter sync (update existing tables)


```141:162:backend/index.js
const startServer = async () => {
	try {
		await sequelize.authenticate();
		logger.info('Connected to the database.');

		if (process.env.CREATE_TABLES === 'true') {
			await sequelize.sync({ force: true });
			logger.info('Database tables created.');
		} else {
			await sequelize.sync({ alter: true });
			logger.info('Database tables updated.');
		}
	} catch (error) {
		app.listen(port, () => {
			logger.info(`App listening at http://localhost:${port}`);
			logger.info(`Swagger docs available at http://localhost:${port}/api-docs`);
		});
	} catch (error) {
		logger.error(`Unable to start the server: ${error.message}`);
		process.exit(1);
	}
};
```


2. **Admin User Creation**
   - Automatically creates an admin user on server start


```15:41:backend/server.js
const createAdminUser = async () => {
	const username = process.env.ADMIN_USERNAME || 'admin';
	const email = process.env.ADMIN_EMAIL || 'admin@example.com';
	const password = process.env.ADMIN_PASSWORD || 'adminPassword';

	logger.info(`Kísérlet admin felhasználó létrehozására: ${username}, ${email}`);

	try {
		const [user, created] = await User.findOrCreate({
			where: { username },
			defaults: {
				username,
				password,
				email
			}
		});

		if (created) {
			logger.info(`Admin felhasználó sikeresen létrehozva: ${username}`);
		} else {
			logger.info(`Admin felhasználó már létezik: ${username}`);
		}
	} catch (err) {
		logger.error(`Admin felhasználó létrehozása sikertelen: ${err.message}`);
		logger.error(err.stack); // Teljes hibaverem naplózása
	}
};
```


3. **Random Video Generation**
   - Uses Puppeteer for web scraping
   - Implements retry mechanism and fallback to a default video


```90:134:backend/services/videoService.js
async function generateRandomLink() {
    if (isGeneratingVideo) {
        logger.warn("Video generation already in progress. Returning pending promise.");
        return pendingPromise; // Visszatér az éppen folyamatban lévő ígérettel
    }

    isGeneratingVideo = true;

    pendingPromise = (async () => {
        try {
            await initializeBrowser();

            let tries = 0;
            while (tries < MAX_TRIES) {
                const keyword = await getRandomKeyword();
                const link = await getRandomYouTubeVideoEmbedLink(keyword);

                if (link) {
                    const newVideo = await addLinkToDatabase(link);
                    return { link: newVideo.link };
                }

                await delay(RETRY_DELAY);
                tries++;
            }

            // Ha nem sikerül linket szerezni, adjuk vissza a Rick Astley linket
            const fallbackLink = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
            await addLinkToDatabase(fallbackLink);
            return { link: fallbackLink };

        } catch (error) {
            logger.error('Error generating video URL:', error);
            // Ha hiba történik, adjuk vissza a Rick Astley linket
            const fallbackLink = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
            await addLinkToDatabase(fallbackLink);
            return { link: fallbackLink };
        } finally {
            isGeneratingVideo = false;
            pendingPromise = null; // Reseteljük a pending promise-t a folyamat végén
        }
    })();

    return pendingPromise;
}
```


4. **API Security**
   - JWT-based authentication
   - Rate limiting to prevent abuse


```1:17:backend/middlewares/rateLimiting.js
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
```


## Database Schema

The application uses two main tables:

1. **users**
   - Fields: id, username, password, email
   - Primary key: id (auto-increment)

2. **videos**
   - Fields: id, link, createdAt
   - Primary key: id (auto-increment)


```33:50:script/fkbpanik_randomrobi.sql
CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` text NOT NULL,
  `password` text NOT NULL,
  `email` text DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `videos`
--

CREATE TABLE `videos` (
  `id` int(11) NOT NULL,
  `link` text NOT NULL,
  `createdAt` datetime DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
```


## Deployment

The application is containerized using Docker:


```1:34:backend/Dockerfile
# Használjuk a Node.js Alpine verzióját, ami egy könnyű Linux disztribúció
FROM node:18-alpine

# Telepítsük a Puppeteer futtatásához szükséges függőségeket
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    yarn

# Állítsuk be a Puppeteer futtatásához szükséges környezeti változót
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Állítsuk be a munkakönyvtárat a konténerben
WORKDIR /app

# Másoljuk át a package.json és package-lock.json fájlokat a konténerbe
COPY package*.json ./

# Telepítsük a függőségeket a konténeren belül
RUN npm install

# Másoljuk át a teljes alkalmazás kódját a konténerbe
COPY . .

# Nyissuk meg a 3000-es portot a konténeren belül
EXPOSE 3000

# Állítsuk be az indítási parancsot a konténer számára
CMD ["npm", "start"]
```


Key points:
- Uses Node.js 18 Alpine as the base image
- Installs additional dependencies for Puppeteer
- Sets up the working directory and copies application files
- Exposes port 3000 for the application

## Environment Variables

The application relies on several environment variables:

- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`: Database connection details
- `PORT`: Application port
- `CORS_ORIGIN`: Allowed origins for CORS
- `CREATE_TABLES`: Controls database initialization behavior
- `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`: Default admin user credentials

## API Documentation

The API is documented using Swagger:


```46:50:backend/index.js
const swaggerOptions = {
	swaggerDefinition: {
		openapi: "3.0.0",
		info: {
			title: "Random Robi API",
```


Swagger UI is available at the `/api-docs` endpoint.

## Testing

The project uses Mocha for testing:


```8:8:backend/package.json
    "test": "mocha --exit"
```


## Error Handling

A global error handler is implemented to catch and log unhandled errors:


```132:138:backend/index.js
app.use((err, req, res, next) => {
	logger.error(`Error: ${err.message}`);
	res.status(500).json({
		hasError: true,
		message: err.message
	});
});
```


## Logging

The application uses a custom logger (likely Winston-based) for consistent logging across the application.

## Security Considerations

1. Password hashing using bcrypt
2. JWT for authentication
3. Rate limiting to prevent abuse
4. CORS configuration to restrict access

## Future Improvements

1. Implement user roles and permissions
2. Add more comprehensive error handling and validation
3. Implement caching for frequently accessed data
4. Set up continuous integration and deployment pipelines
5. Enhance logging and monitoring capabilities