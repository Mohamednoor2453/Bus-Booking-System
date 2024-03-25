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



//admin post route
router.post('/admin/add-route', isAuthenticated, async (req, res) => {
  
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

  //displaying routes in the admin page
  router.get('/admin',  isAuthenticated, async (req, res) => {

    try {
      const routes = await Route.find()//fetching route from db
      res.render('admin.ejs', {routes})
   
    } catch (error) {
     console.log(error)
     res.status(500).send('Internal server error')
     
    }
   });

// Define route for deleting a route
router.delete('/admin/delete-route/:id', isAuthenticated, async (req, res) => {
    const routeId = req.params.id;
  
    try {
      // Delete the route from the db based on the routeId
      await Route.findByIdAndDelete(routeId);
      res.json({ success: true, message: 'Route deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Error deleting route' });
    }
  });

  module.exports = router