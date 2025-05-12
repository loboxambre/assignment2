# Web Identity Management System

A simple web application that demonstrates identity management using Google OAuth2 authentication.

## Features

- Google OAuth2 authentication
- User profile management
- Create and manage personal items
- Session management
- Protected resources

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Google OAuth2 credentials

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
   SESSION_SECRET=your_session_secret
   ```

4. To get Google OAuth2 credentials:
   - Go to the Google Cloud Console
   - Create a new project
   - Enable the Google+ API
   - Create OAuth2 credentials
   - Add `http://localhost:3000/auth/google/callback` as an authorized redirect URI

## Running the Application

1. Start MongoDB (if using local MongoDB)
2. Run the application:
   ```bash
   npm start
   ```
3. Visit `http://localhost:3000` in your browser

## Project Structure

- `app.js` - Main application file
- `views/` - EJS templates
  - `index.ejs` - Home page
  - `dashboard.ejs` - User dashboard
- `.env` - Environment variables (create this file)
- `package.json` - Project dependencies

## Security Features

- OAuth2 authentication with Google
- Session management
- Protected routes
- Resource ownership validation 