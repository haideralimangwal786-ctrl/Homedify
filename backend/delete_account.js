const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');
const Seller = require('./src/models/Seller');
const connectDB = require('./src/config/db');

dotenv.config();

const deleteAccount = async (email) => {
    if (!email) {
        console.log('Please provide an email address.');
        process.exit(1);
    }

    try {
        await connectDB();
        
        // Find the user first
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log(`User with email ${email} not found.`);
            process.exit(0);
        }

        // Remove linked Seller record if it exists
        await Seller.deleteMany({ userId: user._id });
        
        // Remove the User record
        await User.deleteOne({ _id: user._id });

        console.log(`Successfully removed account and linked data for: ${email}`);
        process.exit(0);
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
};

// Get email from command line argument
const emailArg = process.argv[2];
deleteAccount(emailArg);
