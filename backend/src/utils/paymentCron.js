const cron = require('node-cron');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Seller = require('../models/Seller');

/**
 * Auto-release payments after 3 days of delivery
 * Runs daily at midnight
 */
const autoReleasePayments = cron.schedule('0 0 * * *', async () => {
    try {
        console.log('Running auto-release payment job...');

        const now = new Date();

        // Find payments eligible for release
        const eligiblePayments = await Payment.find({
            paymentStatus: 'held',
            releaseEligibleAt: { $lte: now }
        }).populate('orderId');

        let releasedCount = 0;

        for (const payment of eligiblePayments) {
            const order = await Order.findById(payment.orderId);

            // Only release if order is delivered and no dispute
            if (order && order.status === 'delivered' && order.disputeStatus === 'none') {
                // Release payment
                payment.paymentStatus = 'released';
                payment.releasedAt = now;
                payment.releasedBy = null; // System auto-release
                await payment.save();

                // Update seller balance
                const seller = await Seller.findById(payment.sellerId);
                if (seller) {
                    seller.pendingBalance = Math.max(0, seller.pendingBalance - payment.sellerAmount);
                    seller.availableBalance += payment.sellerAmount;
                    seller.totalEarnings += payment.sellerAmount;
                    await seller.save();
                }

                // Update order status to completed
                order.status = 'completed';
                order.completedAt = now;
                order.statusHistory.push({
                    status: 'completed',
                    note: 'Payment auto-released after 3-day period'
                });
                await order.save();

                releasedCount++;
            }
        }

        console.log(`Auto-released ${releasedCount} payments`);
    } catch (error) {
        console.error('Error in auto-release payment job:', error);
    }
}, {
    scheduled: false // Don't start automatically, will be started in server.js
});

/**
 * Update payment holding status when order is delivered
 */
const initiatePaymentHold = async (orderId) => {
    try {
        const order = await Order.findById(orderId);
        if (!order) return;

        const payment = await Payment.findOne({ orderId: order._id });
        if (!payment) return;

        // Set payment to held status with 3-day release eligibility
        payment.paymentStatus = 'held';
        payment.heldAt = new Date();
        payment.releaseEligibleAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
        await payment.save();

        // Update seller pending balance
        const seller = await Seller.findById(payment.sellerId);
        if (seller) {
            seller.pendingBalance += payment.sellerAmount;
            await seller.save();
        }

        console.log(`Payment ${payment._id} set to held status. Release eligible at: ${payment.releaseEligibleAt}`);
    } catch (error) {
        console.error('Error initiating payment hold:', error);
    }
};

module.exports = {
    autoReleasePayments,
    initiatePaymentHold
};
