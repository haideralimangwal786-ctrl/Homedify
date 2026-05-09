const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Initialize cron jobs
const { autoReleasePayments } = require('./utils/paymentCron');
autoReleasePayments.start();
console.log('Payment auto-release cron job started');

const app = express();

// Safepay webhook needs raw body - register BEFORE express.json()
app.use('/api/v1/safepay/webhook', express.raw({ type: 'application/json' }));

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Set security headers
app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false, // Disable CSP for dev to allow all images
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
}));

// Prevent NoSQL injection
app.use(mongoSanitize());

// Prevent XSS attacks
app.use(xss());

// Enable CORS
app.use(cors({
    origin: '*', // Allow all origins for dev
    credentials: true
}));

// Set static folder
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// Route files
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/products', require('./routes/productRoutes'));
app.use('/api/v1/categories', require('./routes/categoryRoutes'));
app.use('/api/v1/orders', require('./routes/orderRoutes'));
app.use('/api/v1/payments', require('./routes/paymentRoutes'));
app.use('/api/v1/admin', require('./routes/adminRoutes'));
app.use('/api/v1/reviews', require('./routes/reviewRoutes'));
app.use('/api/v1/users', require('./routes/userRoutes'));
app.use('/api/v1/notifications', require('./routes/notificationRoutes'));
app.use('/api/v1/sellers', require('./routes/sellerRoutes'));
app.use('/api/v1/safepay', require('./routes/safepayRoutes'));
app.use('/api/v1/site', require('./routes/siteRoutes'));
app.use('/api/v1/settings', require('./routes/settingsRoutes'));

// Error handler middleware
app.use(errorHandler);

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to Homedify API v1',
        version: '1.0.0'
    });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`Static files served from: ${uploadsPath}`);
});

process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
});
