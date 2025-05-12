import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// MongoDB connection
let client;
let db;

async function connectToMongo() {
  try {
    client = new MongoClient(process.env.MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });
    await client.connect();
    db = client.db();
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

await connectToMongo();

// Set up EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Collections
const users = db.collection('users');
const items = db.collection('items');

// Passport configuration
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await users.findOne({ googleId: profile.id });
      if (!user) {
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

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await users.findOne({ _id: new ObjectId(id) });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Routes
app.get('/', (req, res) => {
  res.render('index', { user: req.user });
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

app.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    const userItems = await items.find({ userId: new ObjectId(req.user._id) }).toArray();
    res.render('dashboard', { user: req.user, items: userItems });
  } catch (error) {
    res.status(500).send('Error loading dashboard');
  }
});

app.post('/items', isAuthenticated, async (req, res) => {
  try {
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

app.delete('/items/:id', isAuthenticated, async (req, res) => {
  try {
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

app.get('/items/:id', isAuthenticated, async (req, res) => {
  try {
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

app.get('/profile', isAuthenticated, (req, res) => {
  res.render('profile', { user: req.user });
});

app.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

// Middleware to check if user is authenticated
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