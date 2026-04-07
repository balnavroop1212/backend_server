const mongoose = require('mongoose');

const SuggestionSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    feedback: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Suggestion', SuggestionSchema);