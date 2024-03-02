const express = require('express')
const { route } = require('./admin')
const router = express.Router()

//contact page route
router.get('/contact', (req, res)=>{
    res.render('contacts.ejs')
  
  })
  
  //handling the submitted messag logics
 router.post('/submit-message', (req, res)=>{
  
  const {name, email, message} = req.body
  
  console.log("Received contact form submission:")
  console.log('Name: ', name);
  console.log('Name: ', email)
  console.log('Name: ', message)
  
  res.send("Your message has been received will get back to you within no time. Thank Your")
  
  })

  module.exports = router