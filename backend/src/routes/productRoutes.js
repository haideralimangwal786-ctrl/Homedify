const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const Notification = require('../models/Notification');
const User = require('../models/User');
const multer = require('multer');
const fs = require('fs');
const { getProducts, getSingleProduct, getSimilarProducts, getProductReviews } = require('../controllers/productController');

// multer storage for product images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/products';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = file.originalname.split('.').pop();
    cb(null, `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`);
  }
});
const upload = multer({ storage });

// Public: Advanced product listing with filters
router.get('/', getProducts);

// Seller: list own products
router.get('/seller', protect, authorize('seller', 'admin'), async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.user.id });
    if (!seller) return res.status(400).json({ msg: 'Seller profile not found' });
    const products = await Product.find({ sellerId: seller._id }).populate('categoryId');
    res.json(products);
  } catch (err) { res.status(500).send('Server error'); }
});

// Seller: add product (supports image upload)
router.post('/', protect, authorize('seller', 'admin'), upload.array('images', 6), async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.user.id });
    if (!seller) return res.status(400).json({ msg: 'Seller profile not found' });

    const data = req.body;

    // Rule Enforcement: Only Craft & Non-Fresh Food allowed
    if (data.isFreshFood === 'true' || (data.name && data.name.toLowerCase().includes('fresh'))) {
      return res.status(400).json({ msg: 'Fresh food items are strictly prohibited on Homedify.' });
    }

    if (data.isFood && !data.selfDeliveryOnly) data.selfDeliveryOnly = true;

    const images = (req.files || []).map(f => `/uploads/products/${f.filename}`);
    const product = new Product({ ...data, sellerId: seller._id, images, status: 'pending_approval' });
    await product.save();
    
    // Notify Admins for Approval
    try {
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await Notification.create({
          userId: admin._id,
          message: `✨ New Product Approval Request! ${seller.storeName} has added "${product.name}".`,
          type: 'product',
          link: '/admin/products/pending'
        });
      }
    } catch (notifErr) {
      console.error('Notification creation failed during product addition:', notifErr);
    }

    res.json({ product, msg: 'Product added successfully and is pending Admin approval.' });
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

// Public: Similar products
router.get('/:id/similar', getSimilarProducts);

// Public: Product reviews
router.get('/:id/reviews', getProductReviews);

// Public: Single product details
router.get('/:id', getSingleProduct);

// Seller: edit product (only own)
router.put('/:id', protect, authorize('seller', 'admin'), upload.array('images', 6), async (req, res) => {
  try {
    const prod = await Product.findById(req.params.id);
    if (!prod) return res.status(404).json({ msg: 'Not found' });
    const seller = await Seller.findOne({ userId: req.user.id });
    if (req.user.role !== 'admin' && String(prod.sellerId) !== String(seller._id)) return res.status(403).json({ msg: 'Forbidden' });
    // merge body fields
    Object.assign(prod, req.body);
    // append any uploaded images
    if (req.files && req.files.length) {
      const imgs = req.files.map(f => `/uploads/products/${f.filename}`);
      prod.images = (prod.images || []).concat(imgs);
    }
    await prod.save();
    res.json(prod);
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

// Seller: delete product
router.delete('/:id', protect, authorize('seller', 'admin'), async (req, res) => {
  try {
    const prod = await Product.findById(req.params.id);
    if (!prod) return res.status(404).json({ msg: 'Not found' });
    const seller = await Seller.findOne({ userId: req.user.id });
    if (req.user.role !== 'admin' && String(prod.sellerId) !== String(seller._id)) return res.status(403).json({ msg: 'Forbidden' });
    // remove image files from disk if present
    try {
      const imgs = prod.images || [];
      imgs.forEach(path => {
        const rel = path.startsWith('/') ? path.substring(1) : path;
        if (require('fs').existsSync(rel)) {
          require('fs').unlinkSync(rel);
        }
      })
    } catch (e) { console.warn('Failed to remove images', e) }
    await prod.deleteOne();
    res.json({ msg: 'Deleted' });
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

// remove single image from product
router.delete('/:id/images', protect, authorize('seller', 'admin'), async (req, res) => {
  try {
    const { imagePath } = req.body;
    if (!imagePath) return res.status(400).json({ msg: 'imagePath is required' });
    const prod = await Product.findById(req.params.id);
    if (!prod) return res.status(404).json({ msg: 'Not found' });
    const seller = await Seller.findOne({ userId: req.user.id });
    if (req.user.role !== 'admin' && String(prod.sellerId) !== String(seller._id)) return res.status(403).json({ msg: 'Forbidden' });
    // remove from images array
    prod.images = (prod.images || []).filter(p => p !== imagePath);
    // delete file from disk
    try {
      const rel = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
      if (require('fs').existsSync(rel)) require('fs').unlinkSync(rel);
    } catch (e) { console.warn('Failed to delete image file', e) }
    await prod.save();
    res.json(prod);
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

module.exports = router;
