require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { User } = require('./models/User.js');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const initializePassport = require('./passport-config');
const Route = require('./models/Route.js');
const axios = require('axios');
const transactions = require('./models/Transactions.js')

const app = express();

// Express session middleware
app.use(session({
  secret: process.env.SESSION_SECRET, // Use environment variable for session secret
  resave: false,
  saveUninitialized: false
}));

app.use(flash()); // connect-flash middleware

initializePassport(passport); // calling the function initialize 

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.json());

const dbURI = process.env.DB_URI; // Use environment variable for MongoDB connection string

mongoose.connect(dbURI)
  .then((result) => app.listen(3000))
  .catch((err) => console.log(err));

app.use(express.urlencoded({ extended: false }));

// Middleware for serving static files from the 'public' directory
app.use(express.static('public'));

app.set('view engine', 'ejs');

app.post('/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const newUser = new User({
      email: req.body.email,
      password: hashedPassword,
    });

    await newUser.save();
    res.redirect('/login'); // Redirecting user to the login page
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Confirmation of user login
app.post('/login',
  passport.authenticate('local', {
    successRedirect: '/buses',
    failureRedirect: '/register',
    failureFlash: true
  })
);

// Admin post route
app.post('/admin/add-route', async (req, res) => {
  try {
    const { origin, destination, fare } = req.body;

    const newRoute = new Route({
      origin,
      destination,
      fare,
    });

    await newRoute.save();

    res.json({ success: true, message: 'Route added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error adding route' });
  }
});

// Admin verification
app.get('/login', (req, res) => {
  // Render login.ejs with adminLogin set to true for admin login
  res.render('login.ejs', { adminLogin: true });
});

app.get('/', (req, res) => {
  res.render('home.ejs');
});

app.get('/register', (req, res) => {
  res.render('register.ejs');
});

// Inside the /buses route handler
app.get('/buses', async (req, res) => {
  try {
    const routes = await Route.find();
    res.render('buses.ejs', { routes });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Inside the /admin route handler
app.get('/admin', (req, res) => {
  res.render('admin.ejs')
});

// Route for the booking page
app.get('/booking', (req, res) => {
  console.log('reached the booking page');
  res.render('booking.ejs');
});

// Middleware to generate access token
const generateToken = async (req, _, next) => {
  const secret = process.env.SAFARICOM_CONSUMER_SECRET;
  const consumer = process.env.SAFARICOM_CONSUMER_KEY;
  const auth = Buffer.from(`${consumer}:${secret}`).toString('base64');

  try {
    const response = await axios.get("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
      headers: {
        Authorization: `Basic ${auth}`, // Add a space after 'Basic'
      }
    });

    req.token = response.data.access_token; // Save the token in the request object
    next();
  } catch (err) {
    console.log(err);
    res.status(400).json(err.message);
  }
};

// Route to send stk push to Safaricom
app.post('/stk', generateToken, async (req, res) => {
  const phone = req.body.phone.substring(1);;
  const amount = req.body.amount;

  try {
    // Function to generate timestamp
    function generateTimestamp() {
      const date = new Date();
      const year = date.getFullYear();
      const month = ('0' + (date.getMonth() + 1)).slice(-2);
      const day = ('0' + date.getDate()).slice(-2);
      const hours = ('0' + date.getHours()).slice(-2);
      const minutes = ('0' + date.getMinutes()).slice(-2);
      const seconds = ('0' + date.getSeconds()).slice(-2);

      return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }

    const timestamp = generateTimestamp();
    const shortcode = process.env.SAFARICOM_BUSINESS_SHORTCODE;
    const passKey = process.env.SAFARICOM_PASSKEY;
    const passwordd = Buffer.from(shortcode + passKey + timestamp).toString('base64');

    const stkRequestData = {
      BusinessShortCode: shortcode,
      Password: passwordd,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: `254${phone}`,
      PartyB: shortcode,
      PhoneNumber: `254${phone}`,
      CallBackURL: "https://mydomain.com/pat",
      AccountReference: `254${phone}`,
      TransactionDesc: "Test"
    };

    const stkResponse = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      stkRequestData,
      {
        headers: {
          Authorization: `Bearer ${req.token}`
        }
      }
    );

    console.log(stkResponse.data);
    res.status(200).json(stkResponse.data);
  } catch (error) {
   
    console.error(error);
    res.status(500).json({ success: false, message: 'Error sending STK push' });
  }
});

// Rendering 404 page for mispath
app.use((req, res) => {
  console.log('404 handler triggered');
  res.status(404).render('404');
});









//passport-config.js

const localStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const { User, getUserByEmail, getUserById } = require('./models/User.js');
const flash = require('connect-flash');

function initialize(passport) {
  const authenticateUser = async (email, password, done) => {
    try {
      // Authenticate by email
      const user = await getUserByEmail(email);

      if (!user) {
        return done(null, false, { message: 'No user with that email found' });
      }

      // Check if the password is correct
      const isPasswordMatch = await bcrypt.compare(password, user.password);

      if (isPasswordMatch) {
        
        return done(null, user, { message: 'Login successful', redirectUrl: '/buses' });
      } else {
        
        return done(null, false, { message: 'Incorrect password' });
      }
    } catch (error) {
      return done(error);
    }
  };

  // Use the Local Strategy with Passport
  passport.use(new localStrategy({ usernameField: 'email' }, authenticateUser));

  // Serialize user to store in the session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from the session
  passport.deserializeUser(async (id, done) => {
    const user = await getUserById(id);
    done(null, user);
  });
}

module.exports = initialize;








//admin.ejs 


<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="/admin.css">
  <title>Admin Dashboard</title>
</head>
<body>

  <div class="container">
    <h1>Admin Dashboard</h1>
    <!-- Update the form action to /admin/add-route and set the method to post -->
    <form id="routeForm" action="/admin/add-route" method="post">
      <label for="origin">Origin:</label>
      <input type="text" id="origin" name="origin" required>

      <label for="destination">Destination:</label>
      <input type="text" id="destination" name="destination" required>

      <label for="fare">Fare:</label>
      <input type="number" id="fare" name="fare" required>

      <!-- Update the button type to submit -->
      <button type="submit">Add Route</button>
    </form>
  </div>

  <script> 
    // admin.js

    async function addRoute() {
        const origin = document.getElementById('origin').value;
        const destination = document.getElementById('destination').value;
        const fare = document.getElementById('fare').value;

        try {
            const response = await fetch('/admin/add-route', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ origin, destination, fare }),
            });

            const data = await response.json();

            if (data.success) {
                alert('Route added successfully');
                // Redirect to the buses page
                window.location.href = '/buses';
            } else {
                alert('Error adding route');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Internal Server Error');
        }
    }

  </script>
</body>
</html>
