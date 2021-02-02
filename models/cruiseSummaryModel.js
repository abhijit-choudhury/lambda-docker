const config = require('../config/config.js');

const mongoose = require('mongoose');
mongoose.connect(config.mongodb_url, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

const { Schema } = mongoose;
const cruiseSummaryModel = new Schema({
    _id: String,
    originalRequest: String,
    savedResponse: String
});

module.exports = mongoose.model('CruiseSummary', cruiseSummaryModel);