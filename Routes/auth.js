const express = require('express')
const router = express.Router()

const bcrypt  = require('bcrypt')
const { User } = require('../models/User.js');
const passport = require('passport');
const session = require('express-session');




//registering new use
router.post('/register', async (req, res) => {
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
  router.post('/login',
passport.authenticate('local', {
  successRedirect: '/buses',
  failureRedirect: '/register',
  failureFlash: true
})
);

router.get('/login', (req, res) => {
    // Render login.ejs with adminLogin set to true for admin login
    res.render('login.ejs', );
  });

  router.get('/register', (req, res) => {
    res.render('register.ejs');
  });


  module.exports = router