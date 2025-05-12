// Import required modules
import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// MongoDB connection variables
let client;
let db;

// Connect to MongoDB function
async function connectToMongo() {
  try {
    // Create MongoDB client with ServerApi configuration
    client = new MongoClient(process.env.MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });
    // Connect to the MongoDB server
    await client.connect();
    // Get database instance
    db = client.db();
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

// Establish MongoDB connection
await connectToMongo();

// Configure Express view engine to use EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Set up middleware
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.json()); // Parse JSON bodies
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false
})); // Configure session middleware

// Initialize Passport for authentication
app.use(passport.initialize());
app.use(passport.session());

// Reference MongoDB collections
const users = db.collection('users');
const items = db.collection('items');

// Configure Google OAuth2.0 authentication strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists in database
      let user = await users.findOne({ googleId: profile.id });
      if (!user) {
        // Create new user if not found
        const newUser = {
          googleId: profile.id,
          username: profile.displayName,
          email: profile.emails[0].value
        };
        const result = await users.insertOne(newUser);
        user = { ...newUser, _id: result.insertedId };
      }
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// Serialize user object to store in session
passport.serializeUser((user, done) => done(null, user._id));

// Deserialize user from session to request
passport.deserializeUser(async (id, done) => {
  try {
    const user = await users.findOne({ _id: new ObjectId(id) });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Define routes
// Home page route
app.get('/', (req, res) => {
  res.render('index', { user: req.user });
});

// Google authentication route
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google authentication callback route
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

// Dashboard route (protected)
app.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    // Fetch items belonging to the logged-in user
    const userItems = await items.find({ userId: new ObjectId(req.user._id) }).toArray();
    res.render('dashboard', { user: req.user, items: userItems });
  } catch (error) {
    res.status(500).send('Error loading dashboard');
  }
});

// Create new item route
app.post('/items', isAuthenticated, async (req, res) => {
  try {
    // Create new item with user ID reference
    const item = {
      title: req.body.title,
      description: req.body.description,
      creationDate: new Date(),
      userId: new ObjectId(req.user._id)
    };
    await items.insertOne(item);
    res.redirect('/dashboard');
  } catch (error) {
    res.status(500).send('Error creating item');
  }
});

// Delete item route
app.delete('/items/:id', isAuthenticated, async (req, res) => {
  try {
    // Delete item only if it belongs to the logged-in user
    const result = await items.deleteOne({ 
      _id: new ObjectId(req.params.id), 
      userId: new ObjectId(req.user._id) 
    });
    if (result.deletedCount === 0) return res.status(404).send('Item not found');
    res.sendStatus(200);
  } catch (error) {
    res.status(500).send('Error deleting item');
  }
});

// View single item route
app.get('/items/:id', isAuthenticated, async (req, res) => {
  try {
    // Find item by ID and verify ownership
    const item = await items.findOne({ 
      _id: new ObjectId(req.params.id),
      userId: new ObjectId(req.user._id)
    });
    if (!item) return res.status(404).send('Item not found');
    res.render('item', { user: req.user, item });
  } catch (error) {
    res.status(500).send('Error loading item');
  }
});

// User profile route
app.get('/profile', isAuthenticated, (req, res) => {
  res.render('profile', { user: req.user });
});

// Logout route
app.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

// Authentication middleware
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/');
}

// Export the Express app
export default app;

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle cleanup on app termination
process.on('SIGINT', async () => {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
  }
  process.exit(0);
}); 