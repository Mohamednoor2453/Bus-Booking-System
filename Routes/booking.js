const express = require('express')
const router = express.Router()
const axios = require('axios');
const Transaction = require('../models/Transactions.js')

// Route for the booking page
router.get('/booking',  (req, res) => {
    console.log('reached the booking page');
    res.render('booking.ejs');
  })

// Route for the booking page
router.post('/booking', (req, res) => {
  
    const { fare } = req.body;
    res.render('booking.ejs', { fare });
  });
  

  // Middleware to generate access token
  const generateToken = async (req, res, next) => {
    const secret = process.env.SAFARICOM_CONSUMER_SECRET;
    const consumer = process.env.SAFARICOM_CONSUMER_KEY;
    const auth = Buffer.from(`${consumer}:${secret}`).toString('base64');
  
    try {
      const response = await axios.get("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
        headers: {
          Authorization: `Basic ${auth}`, // Corrected here
        }
      });
  
      req.token = response.data.access_token;
      next();
    } catch (err) {
      console.log(err);
      res.status(400).json(err.message);
    }
  };
  


// Route to send stk push to Safaricom
router.post('/stk', generateToken, async (req, res) => {
  const phone = req.body.phone.substring(1);
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
    const passwordd = Buffer.from(`${shortcode}${passKey}${timestamp}`).toString('base64');


    const stkRequestData = {
      BusinessShortCode: shortcode,
      Password: passwordd,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: `254${phone}`, // Corrected here
      PartyB: shortcode,
      PhoneNumber: `254${phone}`, // Corrected here
      CallBackURL: "https://d589-102-213-241-93.ngrok-free.app/callback",
      AccountReference: `254${phone}`, // Corrected here
      TransactionDesc: "Test"
    };
    

    const stkResponse = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      stkRequestData,
      {
        headers: {
          Authorization: `Bearer ${req.token}` // Corrected here
        }
      }
    );
    

    console.log(stkResponse.data);

    // Checking if the user canceled the transaction
    if (stkResponse.data.ResponseCode === "0") {
      // Store the transaction in the database only if the response code is '0'
      var newTransaction = new Transaction({
        amount: amount,
        phone: phone,
        status: 'Incomplete'
      });

      await newTransaction.save();
    }

//sending sms

    const credentials = {
      apiKey: 'b4e42ffe9cb0ba29fd5c85187a897ebb43bf59be68bd9ee55a87c8e5678ef896',
      username: 'savvyTech',
    }
    
    // Initialize the SDK
    const AfricasTalking = require('africastalking')(credentials);
    
    // Get the SMS service
    const sms = AfricasTalking.SMS;
    
    function sendMessage() {
      const phoneNo = req.body.phone.toString();
    
      const options = {
        to: `+254${phoneNo}`, // Use a specific phone number for testing
        message: "Thank You for booking with UrbanExpress, Your booking was successfully",
      };
    
      const sendSMS = () => {
        sms.send(options)
          .then(() => {
            console.log('Message successfully sent');
          })
          .catch((error) => {
            console.error('Error sending message:', error);
            // Retry logic here (e.g., exponential backoff)
            setTimeout(sendMessage, 20000); // Retry after 20 seconds
          });
      };
    
      sendSMS();
    }
    
    setTimeout(sendMessage, 20000);




    

    res.status(200).json(stkResponse.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error sending STK push' });
  }
});



router.post('/callback', express.json(), (req, res) => {
  console.log('Received callback request:', req.body);
  const callbackData = req.body;
  console.log('Parsed callback data:', callbackData);
  res.status(200).send('Callback received'); // Sending a response to acknowledge receipt
});


module.exports = router