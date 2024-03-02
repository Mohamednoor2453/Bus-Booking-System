require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan')
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const initializePassport = require('./passport-config');


const adminRouter = require('./Routes/admin.js');
const userRouter = require('./Routes/auth.js')
const bookingRouter = require('./Routes/booking.js')
const routsRouter = require('./Routes/routes.js')
const contactRouter = require('./Routes/contacts.js')

const app = express();

 //middleware

 app.use(express.static('public'));
 app.use(express.urlencoded({ extended: false }));
 app.use(bodyParser.json());
 app.use(session({
   secret: process.env.SESSION_SECRET,
   resave: false,
   saveUninitialized: false
 }));
 app.use(flash());
 app.use(passport.initialize());
 app.use(passport.session());
 app.use(morgan('dev'));

 //setting view engine
 app.set('view engine', 'ejs')

// Database connection
const dbURI = process.env.DB_URI;
mongoose.connect(dbURI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error(err));

//initializing passport
initializePassport(passport);

//routes
app.use('/', adminRouter);
app.use('/', userRouter);
app.use('/', bookingRouter)
app.use('/', routsRouter)
app.use('/', contactRouter)

// Rendering 404 page for mispath
app.use((req, res) => {
  console.log('404 handler triggered');
  res.status(404).render('404');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const port = process.env.PORT

app.listen(port, ()=>{
  console.log('Server running and listening to incoming requests')
})
