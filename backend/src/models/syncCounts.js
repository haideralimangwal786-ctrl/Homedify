const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const Seller = require('./Seller');
const Product = require('./Product');
const User = require('./User');

const syncProductCounts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        const sellers = await Seller.find();
        console.log(`Found ${sellers.length} sellers. Syncing...`);

        for (const seller of sellers) {
            const count = await Product.countDocuments({ sellerId: seller._id });
            seller.totalProducts = count;
            await seller.save();
            console.log(`Synced ${seller.storeName}: ${count} products`);
        }

        console.log('Sync complete!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

syncProductCounts();
