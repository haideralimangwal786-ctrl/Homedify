const mongoose = require('mongoose');
const User = require('../src/models/User');
const Seller = require('../src/models/Seller');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const removeDummySeller = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const email = 'dummy_seller@example.com';
        
        // 1. Find User
        const user = await User.findOne({ email });
        if (!user) {
            console.log('Dummy seller user not found');
        } else {
            // 2. Delete Seller Profile
            const sellerDelete = await Seller.deleteOne({ userId: user._id });
            console.log(`Deleted ${sellerDelete.deletedCount} seller profile(s)`);

            // 3. Delete User
            const userDelete = await User.deleteOne({ _id: user._id });
            console.log(`Deleted ${userDelete.deletedCount} user(s)`);
        }

        await mongoose.connection.close();
        console.log('Disconnected from MongoDB');
    } catch (err) {
        console.error('Error removing dummy seller:', err);
        process.exit(1);
    }
};

removeDummySeller();
