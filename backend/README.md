# MySQL Login API

A simple login API built with Node.js and MySQL.

## Features

- User registration
- User login with JWT authentication
- Password hashing with bcrypt
- MySQL database integration
- CORS enabled

## Prerequisites

- Node.js (v14 or higher)
- MySQL Server
- npm or yarn

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a MySQL database named `login_api`
4. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=login_api
   JWT_SECRET=your-secret-key
   ```
5. Start the server:
   ```bash
   npm start
   ```
   For development with auto-reload:
   ```bash
   npm run dev
   ```

## API Endpoints

### Register a new user
```
POST /register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Login
```
POST /login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response will include a JWT token and user information.

## Security Notes

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Make sure to use a strong JWT_SECRET in production
- Always use HTTPS in production
- Use environment variables for sensitive information 