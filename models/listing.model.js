const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const listingSchema = new Schema({
    Name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    ListingType: {
        type: String,
        enum: ['gallery', 'projects', 'both'],
        required: true
    },
    images: [
        {
            url: {
                type: String,
                required: true
            },
            filename: {
                type: String,
                required: true
            }
        }
    ]
});

module.exports = mongoose.model('Listing', listingSchema);