const mongoose = require('mongoose');
const User = require('./src/models/User');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

const resetAdminPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/homedify');
        console.log('Connected to MongoDB');

        const adminEmail = 'haiderkhan122602@gmail.com';
        const user = await User.findOne({ email: adminEmail });

        if (!user) {
            console.log(`User ${adminEmail} not found. Creating new admin...`);
            await User.create({
                name: 'Admin',
                email: adminEmail,
                password: 'admin12345678', // Min 8 chars
                role: 'admin',
                isEmailVerified: true
            });
            console.log('Admin user created successfully with password: admin12345678');
        } else {
            user.password = 'admin12345678';
            user.role = 'admin'; // Ensure role is correct
            user.isBlocked = false; // Ensure not blocked
            await user.save();
            console.log(`Password reset for ${adminEmail} to: admin12345678`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

resetAdminPassword();
