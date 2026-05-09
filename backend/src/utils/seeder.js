const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const connectDB = require('../config/db');

dotenv.config();

connectDB();

const categories = [
    { name: 'Embroidery', marketplace: 'craft', description: 'Hand-stitched patterns' },
    { name: 'Pottery', marketplace: 'craft', description: 'Handmade clay items' },
    { name: 'Traditional Spices', marketplace: 'food', description: 'Homemade spice blends' },
    { name: 'Pickles', marketplace: 'food', description: 'Authentic homemade pickles' }
];

const importData = async () => {
    try {
        await User.deleteMany();
        await Category.deleteMany();
        await Product.deleteMany();
        await Seller.deleteMany();

        // Create Admin
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@homedify.com',
            password: 'adminpassword123',
            role: 'admin',
            contactNumber: '03001234567'
        });

        // Create a regular user (potential seller)
        const user = await User.create({
            name: 'Amna Bibi',
            email: 'amna@example.com',
            password: 'password123',
            role: 'customer',
            contactNumber: '03112223334'
        });

        // Create Categories
        const createdCategories = await Category.insertMany(categories);

        // Create Seller Profile
        const seller = await Seller.create({
            userId: user._id,
            storeName: 'Amna Tradings',
            storeDescription: 'Authentic handmade crafts and spices',
            cnicNumber: '1234567890123',
            cnicImages: { front: '/uploads/cnic/front.jpg', back: '/uploads/cnic/back.jpg' },
            selfieImage: '/uploads/cnic/selfie.jpg',
            verificationStatus: 'verified'
        });

        // Update user role to seller (post-save hook should handle this, but let's be sure)
        user.role = 'seller';
        await user.save();

        // Create Products
        await Product.create({
            sellerId: seller._id,
            name: 'Hand Embroidery Suit 3pc',
            description: 'Exquisite hand-embroidered lawn suit with intricate patterns.',
            price: 4500,
            quantity: 5,
            images: ['/uploads/products/emb-suit.jpg'],
            categoryId: createdCategories[0]._id,
            marketplace: 'craft',
            status: 'approved'
        });

        await Product.create({
            sellerId: seller._id,
            name: 'Mixed Mango Pickle 500g',
            description: 'Traditional homemade mango pickle using organic spices.',
            price: 450,
            quantity: 20,
            images: ['/uploads/products/pickle.jpg'],
            categoryId: createdCategories[3]._id,
            marketplace: 'food',
            status: 'approved'
        });

        console.log('Data Imported Successfully!');
        process.exit();
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await User.deleteMany();
        await Category.deleteMany();
        await Product.deleteMany();
        await Seller.deleteMany();

        console.log('Data Destroyed!');
        process.exit();
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}
