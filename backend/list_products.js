const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Seller = require('./src/models/Seller');
require('dotenv').config();

const listActiveProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const products = await Product.find({ status: 'active' }).populate('sellerId', 'storeName shopName');
        console.log('Total Active Products:', products.length);
        products.forEach(p => {
            console.log(`Product: ${p.name} | Seller: ${p.sellerId?.storeName || p.sellerId?.shopName || 'MISSING SELLER'}`);
        });
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

listActiveProducts();
