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
3. Create a MySQL database named `pawbook` By running the command
    ```bash
   npm run init
   ```
4. Start the server:
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