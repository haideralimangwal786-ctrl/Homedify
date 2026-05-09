const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Seller = require('./src/models/Seller');
require('dotenv').config();

const cleanupProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const products = await Product.find().lean();
        let deletedCount = 0;
        
        for (const p of products) {
            if (!p.sellerId) {
                await Product.deleteOne({ _id: p._id });
                deletedCount++;
                continue;
            }
            
            const seller = await Seller.findById(p.sellerId);
            if (!seller) {
                await Product.deleteOne({ _id: p._id });
                deletedCount++;
            }
        }
        
        console.log(`Deleted ${deletedCount} products with invalid seller references.`);
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

cleanupProducts();
