const express = require('express')
const router = express.Router()
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const Transaction = require('../models/Transactions.js')
const { User } = require('../models/User.js');

async function generateGraph(width, height, labels, data, title) {
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });
    const configuration = {
      type: 'line', // Change to 'bar', 'pie', etc. based on your preference
      data: {
        labels,
        datasets: [{
          label: title,
          data: data,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };
  
    return await chartJSNodeCanvas.renderToBuffer(configuration);
  }

//transaction history graph data
async function getTransactionHistory() {
    const transactions = await Transaction.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
          },
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } } // Sort by date ascending
    ]);
  
    return transactions.map(t => ({
      date: t._id,
      totalAmount: t.totalAmount,
      count: t.count
    }));
  }

  //user registration graph data

  async function getUserRegistrations() {
    const users = await User.aggregate([
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id": 1 } }
      ]);
      
  
    return users.map(u => ({
      date: u._id,
      count: u.count
    }));
  }
  
  
  //route for transaction history

 router.get('/transaction-graph', async (req, res) => {
    const transactions = await getTransactionHistory();
    const labels = transactions.map(t => t.date);
    const data = transactions.map(t => t.totalAmount); // or t.count, depending on what you want to display
  
    const image = await generateGraph(800, 600, labels, data, "Transaction History");
    res.type('image/png');
    res.send(image);
  });

  
  //route for user registration graph
  router.get('/registration-graph', async (req, res) => {
    const registrations = await getUserRegistrations();
    const labels = registrations.map(r => r.date);
    const data = registrations.map(r => r.count);
  
    const image = await generateGraph(800, 600, labels, data, "User Registrations");
    res.type('image/png');
    res.send(image);
  });

  router.get('/datagraphs', (req, res)=>{
    res.render('datagraphs.ejs')
})

  module.exports = router;

  