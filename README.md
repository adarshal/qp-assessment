# Grocery Booking API
!!!!(For writing readme file chatGPT o3-mini was used by providing routes files)
A RESTful API for a grocery booking system built with Node.js, Express, TypeScript, and SQLite. This application enables users to browse available grocery items and place orders, while administrators can manage inventory, grocery items, and order statuses.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [API Routes](#api-routes)
  - [Authentication Routes](#authentication-routes)
  - [User Routes](#user-routes)
  - [Admin Routes](#admin-routes)
- [Postman Collection](#postman-collection)
- [Environment Variables](#environment-variables)

## Features

### User Features
- Browse available grocery items
- Filter and search grocery items
- Place orders with multiple items
- View order history and details
- Cancel pending orders

### Admin Features
- Manage grocery items (create, read, update, delete)
- Update inventory levels
- View and manage all orders
- Update order statuses

## Tech Stack

- **Node.js & Express**: Server and API framework
- **TypeScript**: Type safety and better developer experience
- **Sequelize ORM**: Database operations and modeling
- **SQLite**: Lightweight database
- **JWT**: Authentication and authorization
- **bcrypt**: Password hashing

## Installation

1. Clone the repository:
   ```
   then goto that folder
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create .env file based on the .env.example and configure your environment variables.

4. Run the database migrations:
   ```
   npm run migrate
   ```

5. Start the development server:
   ```
   npm run dev
   ```

## Database Setup

The application uses SQLite as the database. You can initialize the database with sample data using:

```
npm run migrate
```

This script creates:
- Default admin user (admin@example.com / admin123)
- Default regular user (user@example.com / user123)
- Sample grocery items
- Sample order

## API Routes

### Authentication Routes

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /v1/user/signup | Register a new user | Public |
| POST | /v1/user/signin | Login and get tokens | Public |
| POST | /v1/user/logout | Logout user | User |
| GET | /v1/user/refresh-token | Refresh access token | User |
| GET | /v1/user/profile | Get user profile | User |
| PUT | /v1/user/update | Update user information | User |
| PUT | /v1/user/password | Update user password | User |

### User Routes

#### Grocery Items

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /v1/grocery/items | Get available grocery items | Public |

#### Orders

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /v1/grocery/orders | Create a new order | User |
| GET | /v1/grocery/orders | Get user's orders | User |
| GET | /v1/grocery/orders/:id | Get details of specific order | User |
| POST | /v1/grocery/orders/:id/cancel | Cancel a pending order | User |

### Admin Routes

#### Grocery Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /v1/grocery/admin/items | Add new grocery item | Admin |
| GET | /v1/grocery/admin/items | Get all grocery items with filters | Admin |
| GET | /v1/grocery/admin/items/:id | Get a specific grocery item | Admin |
| PUT | /v1/grocery/admin/items/:id | Update a grocery item | Admin |
| PUT | /v1/grocery/admin/items/:id/inventory | Update inventory levels | Admin |
| DELETE | /v1/grocery/admin/items/:id | Delete a grocery item | Admin |

#### Order Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /v1/grocery/admin/orders | Get all orders (with optional status filter) | Admin |
| PUT | /v1/grocery/admin/orders/:id/status | Update order status | Admin |

## Postman Collection

A Postman collection is included in the repository to help test the API endpoints. The collection can be found in the `postman` directory.

### Importing the Collection

1. Open Postman
2. Click on "Import" button
3. Select the file `REST API basics- CRUD, test & variable.postman_collection.json` from the `postman` directory
4. The collection will be imported with all the API requests

### Using the Collection

The collection is organized into folders:

- **Auth**: Authentication-related requests
- **User - Grocery**: Grocery item browsing for regular users
- **User - Orders**: Order management for regular users
- **Admin - Grocery Items**: Grocery item management for admins
- **Admin - Orders**: Order management for admins

### Environment Variables

The collection uses the following environment variables which you should set up in your Postman environment:

- `baseUrl`: The base URL of your API (e.g., http://localhost:5000)
- `accessToken`: Will be automatically set after login
- `refreshToken`: Will be automatically set after login

## Environment Variables

Create a `.env` file if not present (in demo git i have included with values) in the root directory with the following variables:

```
# Server configuration
PORT=5000
NODE_ENV=development

# SQLite configuration
SQLITE_PATH=./database.sqlite

# JWT configuration
ACCESS_TOKEN=your_access_token_secret_key
REFRESH_TOKEN=your_refresh_token_secret_key
EXPIRESIN=15m
EXPIRESIN_REFRESH=3d
JWT_SECRET=your_jwt_secret_key
```

## License

This project is licensed under the MIT License. 