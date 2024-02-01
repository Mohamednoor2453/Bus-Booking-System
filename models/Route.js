const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const routeSchema = new Schema({
    origin: String,
    destination: String,
    fare: Number,
});

const Route = mongoose.model('Route', routeSchema);

module.exports = Route;
