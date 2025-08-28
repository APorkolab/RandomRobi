# Random Robi - Full-Stack YouTube Video Generator

Random Robi is a full-stack web application designed to generate and display random YouTube video links. It features a modern Angular frontend, a robust Node.js/Express backend, and is fully containerized with Docker for easy setup and deployment.

## Key Features

- **Random Video Generation**: Fetches random YouTube videos using a Puppeteer-based web scraping service.
- **Modern UI**: A clean, responsive user interface built with the latest version of Angular and Angular Material.
- **Authenticated Routes**: Secure admin sections for managing users and videos, protected by JWT-based authentication.
- **API Documentation**: Integrated Swagger UI for clear, interactive API documentation.
- **Containerized Environment**: Docker-compose setup for one-command startup of both frontend and backend services.
- **Robust Backend**: Built with Express and Sequelize, featuring rate limiting, error handling, and automated admin user creation.

---

## Tech Stack

### Frontend
- **Framework**: Angular
- **UI Components**: Angular Material
- **Testing**: Karma, Jasmine

### Backend
- **Framework**: Node.js, Express
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JSON Web Tokens (JWT), bcrypt
- **Web Scraping**: Puppeteer
- **API Documentation**: Swagger / OpenAPI
- **Testing**: Mocha

### DevOps
- **Containerization**: Docker, Docker Compose

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Docker](https://www.docker.com/products/docker-desktop/) and [Docker Compose](https://docs.docker.com/compose/)

---

## Installation & Setup

You can run the project using Docker Compose, which is the recommended method for a consistent development environment.

### 1. Clone the Repository
```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Set Up Environment Variables
The backend requires a `.env` file for configuration. Create a file named `.env` in the `backend/` directory by copying the example:

```bash
cp backend/.env.example backend/.env
```

Review the `backend/.env` file and adjust the variables if necessary. The default values are configured to work with the `docker-compose.yml` setup.

**Important**: The `CREATE_TABLES` environment variable controls database initialization.
- Set `CREATE_TABLES=true` for the very first time you run the application to create the database schema.
- For all subsequent runs, set `CREATE_TABLES=false` or remove the variable to prevent data loss.

### 3. Build and Run with Docker Compose
From the project root, run the following command:

```bash
docker-compose up --build
```

This command will:
- Build the Docker images for both the `frontend` and `backend` services.
- Start the containers for the frontend, backend, and the MySQL database.
- Install all npm dependencies within the containers.

The application will be available at the following URLs:
- **Frontend Application**: [http://localhost:4200](http://localhost:4200)
- **Backend API**: [http://localhost:3000](http://localhost:3000)
- **Swagger API Docs**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

---

## Development

### Frontend

The frontend development server runs inside the Docker container but is configured for hot-reloading. Any changes you make to the files in the `frontend/src/` directory will automatically trigger a rebuild and reload the application in your browser.

- **Running Tests**: To run the frontend unit tests, execute the following command in the project root:
  ```bash
  docker-compose exec frontend npm test
  ```

### Backend

- **API Documentation**: With the application running, navigate to [http://localhost:3000/api-docs](http://localhost:3000/api-docs) to view and interact with the API using Swagger UI.
- **Running Tests**: To run the backend unit tests, execute the following command in the project root:
  ```bash
  docker-compose exec backend npm test
  ```

---

## Architectural Notes

### Backend
The backend is built with a standard service-oriented architecture.
- **Controllers**: Handle incoming HTTP requests, validate input, and call the appropriate services.
- **Services**: Contain the core business logic (e.g., `videoService`, `authService`).
- **Models**: Sequelize models define the database schema (`User`, `Video`).
- **Middleware**: Used for cross-cutting concerns like authentication (`authenticate.js`) and rate limiting (`rateLimiting.js`).

### Frontend
The frontend was recently refactored to a modern, senior-level architecture.
- **UI**: All components are built with Angular Material for a consistent and professional look and feel. Bootstrap and jQuery have been completely removed.
- **Forms**: All forms have been migrated to use Angular's **Reactive Forms** for better scalability and testability.
- **Data Tables**: List pages (`/admin`, `/users`) use **`MatTableDataSource`** for efficient, client-side sorting, filtering, and pagination.
- **Core Layout**: A consistent application shell in `app.component` provides a toolbar and content area for all pages.
- **Testing**: The unit test suite has been stabilized and updated to mock dependencies correctly, ensuring the application is robust and maintainable.