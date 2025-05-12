# Web Identity Management System

A web application that demonstrates identity management using Google OAuth2 authentication. This application allows users to authenticate with their Google accounts, manage their profiles, and create/manage personal items.

## Features

- Google OAuth2 authentication for secure user login
- User profile management showing Google account details
- Create, view, and delete personal items
- Session management for persistent user sessions
- Protected routes requiring authentication
- Resource ownership validation to prevent unauthorized access

## Tech Stack

- **Backend**: Node.js with Express.js
- **Frontend**: EJS templates with vanilla JavaScript
- **Database**: MongoDB
- **Authentication**: Passport.js with Google OAuth2 strategy
- **Deployment**: Vercel

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Google OAuth2 credentials

## MongoDB Atlas Setup

To set up a free MongoDB database using MongoDB Atlas:

1. Create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a new project
3. Build a new cluster (the free tier is sufficient)
4. Once the cluster is created, click on "Connect"
5. Choose "Connect your application"
6. Select Node.js as the driver and copy the connection string
7. Replace `<password>` in the connection string with your database user password
8. Use this connection string as your `MONGODB_URI` in the `.env` file

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=your_callback_url (default: http://localhost:3000/auth/google/callback)
   SESSION_SECRET=your_session_secret
   PORT=3000 (optional)
   ```

4. To get Google OAuth2 credentials:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Navigate to "APIs & Services" > "Credentials"
   - Create OAuth2 credentials
   - Add your callback URL (e.g., `http://localhost:3000/auth/google/callback`) as an authorized redirect URI

## Running the Application

1. Start MongoDB (if using local MongoDB)
2. Run the application:
   ```bash
   npm start
   ```
   For development with auto-reload:
   ```bash
   npm run dev
   ```
3. Visit `http://localhost:3000` in your browser

## Project Structure

- `app.js` - Main application file containing server setup, routes, and MongoDB connection
- `views/` - EJS templates for the frontend
  - `index.ejs` - Home/login page
  - `dashboard.ejs` - User dashboard for managing items
  - `profile.ejs` - User profile page showing account details
  - `item.ejs` - Individual item view page
- `package.json` - Project dependencies and scripts
- `vercel.json` - Vercel deployment configuration
- `.env` - Environment variables (create this file)

## Security Features

- OAuth2 authentication with Google for secure login
- Session management with express-session
- Protected routes requiring authentication
- Resource ownership validation to prevent unauthorized access to items
- MongoDB connection with secure ServerAPI configuration

## Deployment

The application is configured for deployment on Vercel using the provided `vercel.json` configuration file.

## License

This project is for educational purposes. 