const express = require('express')
const router = express.Router()

const Route = require('../models/Route.js');


// Define isAuthenticated function
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login'); // Redirect to login page if user is not authenticated
};



router.get('/', (req, res) => {
    res.render('home.ejs');
  });
  
  
  
  // Inside the /buses route handler
  router.get('/buses', isAuthenticated, async (req, res) => {
    try {
      const routes = await Route.find();
      res.render('buses.ejs', { routes });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });
  
  //rendering about page 
  router.get('/about', (req, res)=>{
    res.render('about.ejs')
  })

  module.exports = router
  

