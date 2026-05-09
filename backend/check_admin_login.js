const mongoose = require('mongoose');
const User = require('./src/models/User');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

const checkAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/homedify');
        console.log('Connected to MongoDB');

        const admins = await User.find({ role: 'admin' });
        if (admins.length === 0) {
            console.log('No admin users found in the database.');
        } else {
            console.log('Admin Users Found:');
            admins.forEach(admin => {
                console.log(`- Name: ${admin.name}, Email: ${admin.email}, Role: ${admin.role}, isBlocked: ${admin.isBlocked}`);
            });
        }

        const allUsers = await User.find({}).limit(10);
        console.log('\nTop 10 Users:');
        allUsers.forEach(u => {
             console.log(`- Email: ${u.email}, Role: ${u.role}`);
        });

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

checkAdmin();
