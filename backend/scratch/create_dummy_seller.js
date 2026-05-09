const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Seller = require('../src/models/Seller');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const createDummySeller = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const email = 'dummy_seller@example.com';
        const password = 'password123';
        
        // 1. Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            console.log('Dummy seller user already exists');
        } else {
            // 2. Create User
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            
            user = await User.create({
                name: 'Dummy Seller',
                email: email,
                password: password, // The model has a pre-save hook for hashing, but I'll pass raw just in case
                role: 'seller'
            });
            console.log('User created:', user.email);
        }

        // 3. Create Seller Profile
        let seller = await Seller.findOne({ userId: user._id });
        if (seller) {
            console.log('Seller profile already exists');
        } else {
            seller = await Seller.create({
                userId: user._id,
                storeName: 'Dummy Artisan Store',
                storeDescription: 'This is a premium artisan store for testing purposes.',
                storeAddress: '123 Artisan Street, Lahore, Pakistan',
                verificationStatus: 'approved',
                isVerified: true,
                cnicNumber: '4210112345678',
                cnicImages: {
                    front: 'uploads/dummy/cnic_front.png',
                    back: 'uploads/dummy/cnic_back.png'
                },
                selfieImage: 'uploads/dummy/selfie.png',
                availableBalance: 15000,
                pendingBalance: 5000,
                totalEarnings: 20000
            });
            console.log('Seller profile created:', seller.storeName);
        }

        console.log('\n--- Dummy Seller Credentials ---');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log('---------------------------------');

        await mongoose.connection.close();
    } catch (err) {
        console.error('Error creating dummy seller:', err);
        process.exit(1);
    }
};

createDummySeller();
