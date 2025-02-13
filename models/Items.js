const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    itemId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        contentType: String
    },
    category: {
        type: String,
        required: true
    },
    stock: {
        type: Number,
        required: true
    }
}, { timestamps: true });

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
