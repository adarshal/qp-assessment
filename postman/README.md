# Postman Collection for Grocery Booking API

This directory contains Postman collections for testing the Grocery Booking API endpoints.

## Collection Contents

The `Grocery_Booking_API.postman_collection.json` file contains a comprehensive set of API requests organized by functionality:

1. **Auth** - Authentication endpoints (signup, signin, logout, refresh token)
2. **User - Grocery** - Endpoints for regular users to browse grocery items
3. **User - Orders** - Endpoints for regular users to manage their orders
4. **Admin - Grocery Items** - Admin-only endpoints for managing grocery items
5. **Admin - Orders** - Admin-only endpoints for managing orders

## How to Use

1. **Import the Collection**
   - Open Postman
   - Click "Import" in the top left
   - Select the `Grocery_Booking_API.postman_collection.json` file
   - The collection will be imported with all requests

2. **Set Up Environment Variables**
   - Create a new environment in Postman
   - Add the following variables:
     - `baseUrl`: The base URL of your API (e.g., http://localhost:5000)
     - `accessToken`: (Leave empty, will be set automatically after login)
     - `refreshToken`: (Leave empty, will be set automatically after login)

3. **Authorization**
   - Some endpoints require authentication
   - Use the "Signin" or "Signin (Regular User)" request first
   - The script in these requests will automatically set your access token

4. **Testing Workflows**
   - **User Workflow**: 
     1. Signin as a regular user
     2. Browse grocery items
     3. Create an order
     4. View orders and details
     5. Cancel an order
   
   - **Admin Workflow**:
     1. Signin as an admin
     2. Manage grocery items (add, view, update, delete)
     3. View all orders
     4. Update order statuses

## Default Test Users

- **Admin User**:
  - Email: admin@example.com
  - Password: admin123

- **Regular User**:
  - Email: user@example.com
  - Password: user123 