

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  
  amount: {
    type: Number,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
  },

  status: {
    type: String,
    required: true
  }

});


const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
