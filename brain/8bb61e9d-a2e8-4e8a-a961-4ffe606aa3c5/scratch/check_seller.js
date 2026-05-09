const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const Seller = require('../backend/src/models/Seller');

async function checkSellerData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const seller = await Seller.findOne({ verificationStatus: 'ai_verified' }).populate('userId');
        if (!seller) {
            console.log('No pending sellers found');
            return;
        }

        console.log('Seller ID:', seller._id);
        console.log('CNIC Front Path:', seller.cnicImages?.front);
        console.log('Selfie Path:', seller.selfieImage);
        
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkSellerData();
