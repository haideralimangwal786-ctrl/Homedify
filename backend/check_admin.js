const mongoose = require('mongoose');
const User = require('./src/models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const checkAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const admin = await User.findOne({ role: 'admin' });
        console.log('Admin Name:', admin.name);
        console.log('Admin Picture:', admin.picture);
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkAdmin();
