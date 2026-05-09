const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./src/models/User');
const connectDB = require('./src/config/db');

/**
 * Script to re-create the Admin user without dropping the database.
 */
(async function () {
  try {
    await connectDB();
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@homedify.local';
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin user already exists with email:', adminEmail);
      process.exit(0);
    }

    const admin = new User({
      name: 'Admin',
      email: adminEmail,
      password: 'admin123', // Default password
      role: 'admin',
      contactNumber: '03001234567',
      address: { street: 'Admin St', city: 'Lahore', province: 'Punjab', postalCode: '54000' }
    });

    await admin.save();
    console.log('✓ Admin user created successfully!');
    console.log('Email:', adminEmail);
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  }
})();
