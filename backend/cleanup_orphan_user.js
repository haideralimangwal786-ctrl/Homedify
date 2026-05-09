/**
 * CLEANUP SCRIPT - Run once to delete the orphaned seller user
 * This user was left behind due to the hook conflict bug (now fixed).
 * 
 * Usage: node cleanup_orphan_user.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const ORPHAN_USER_ID = '69ecd64803929093f7aa898e';
const ORPHAN_USER_EMAIL = 'haideralimangwal786@gmail.com';

async function cleanup() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const User = require('./src/models/User');
        const Seller = require('./src/models/Seller');
        const Product = require('./src/models/Product');
        const Order = require('./src/models/Order');
        const Payment = require('./src/models/Payment');
        const Review = require('./src/models/Review');
        const Notification = require('./src/models/Notification');
        const Withdrawal = require('./src/models/Withdrawal');
        const Cart = require('./src/models/Cart');

        // ── Step 1: Confirm user exists ──────────────────────────────────
        const user = await User.findById(ORPHAN_USER_ID);
        if (!user) {
            console.log('ℹ️  User not found in users collection. Already deleted or wrong ID.');
            process.exit(0);
        }
        console.log(`📋 Found orphaned user:`);
        console.log(`   Name:  ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role:  ${user.role}`);
        console.log('');

        // ── Step 2: Check for linked Seller document ─────────────────────
        const seller = await Seller.findOne({ userId: ORPHAN_USER_ID });
        if (seller) {
            console.log(`🏪 Found linked Seller: ${seller.storeName} (${seller._id})`);
            const sellerId = seller._id;

            // Delete products
            const prodResult = await Product.deleteMany({ sellerId });
            console.log(`   🗑️  Deleted ${prodResult.deletedCount} products`);

            // Delete reviews on those products
            const prodIds = (await Product.find({ sellerId }, '_id').lean()).map(p => p._id);
            if (prodIds.length > 0) {
                const revResult = await Review.deleteMany({ productId: { $in: prodIds } });
                console.log(`   🗑️  Deleted ${revResult.deletedCount} reviews`);
            }

            // Delete orders
            const orderResult = await Order.deleteMany({ sellerId });
            console.log(`   🗑️  Deleted ${orderResult.deletedCount} orders`);

            // Delete payments
            const payResult = await Payment.deleteMany({ sellerId });
            console.log(`   🗑️  Deleted ${payResult.deletedCount} payments`);

            // Delete withdrawals
            const wdResult = await Withdrawal.deleteMany({ sellerId });
            console.log(`   🗑️  Deleted ${wdResult.deletedCount} withdrawals`);

            // Delete seller
            await Seller.deleteOne({ _id: sellerId });
            console.log(`   🗑️  Deleted Seller document`);
        } else {
            console.log('ℹ️  No linked Seller document found (already deleted). Proceeding to delete User only.');
        }

        // ── Step 3: Delete notifications ────────────────────────────────
        const notifResult = await Notification.deleteMany({ userId: ORPHAN_USER_ID });
        console.log(`   🗑️  Deleted ${notifResult.deletedCount} notifications`);

        // ── Step 4: Remove from carts ────────────────────────────────────
        // (seller's products already removed, but clean user's own cart too)
        await Cart.deleteMany({ userId: ORPHAN_USER_ID });

        // ── Step 5: Delete the User document ─────────────────────────────
        // Use query-level deleteOne to bypass document hooks
        const userResult = await User.deleteOne({ _id: ORPHAN_USER_ID });
        if (userResult.deletedCount === 1) {
            console.log(`\n✅ SUCCESS: User "${ORPHAN_USER_EMAIL}" permanently deleted from users collection.`);
            console.log('   They can now register again with the same email.');
        } else {
            console.log('\n❌ FAILED: User was not deleted. Check the ID again.');
        }

        // ── Step 6: Verify cleanup ───────────────────────────────────────
        console.log('\n🔍 Verifying cleanup...');
        const verifyUser = await User.findById(ORPHAN_USER_ID);
        const verifySeller = await Seller.findOne({ userId: ORPHAN_USER_ID });
        console.log(`   User in DB:   ${verifyUser ? '❌ STILL EXISTS' : '✅ Deleted'}`);
        console.log(`   Seller in DB: ${verifySeller ? '❌ STILL EXISTS' : '✅ Deleted'}`);

    } catch (err) {
        console.error('❌ Error during cleanup:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

cleanup();
