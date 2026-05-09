const mongoose = require('mongoose');
const Order = require('./src/models/Order');
require('dotenv').config();

const checkOrderImages = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const order = await Order.findOne({ orderId: 'HMD-20260429-0002' });
        if (order) {
            console.log('Order ID:', order.orderId);
            console.log('Product Image Path:', order.orderItems[0].productImage);
        } else {
            console.log('Order not found');
        }
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkOrderImages();
