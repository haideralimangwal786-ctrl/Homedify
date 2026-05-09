const express = require('express');
const {
    getSiteSettings,
    updateLogo,
    addBanner,
    deleteBanner,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    updateSections,
    updateBanner,
    toggleBannerStatus
} = require('../controllers/siteController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.resolve('uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

const { submitInquiry } = require('../controllers/inquiryController');

router.get('/settings', getSiteSettings);
router.get('/categories', getCategories);
router.post('/contact', submitInquiry);

router.use(protect);
router.use(authorize('admin'));

router.put('/logo', upload.single('logo'), updateLogo);
router.post('/banners', upload.single('banner'), addBanner);
router.delete('/banners/:id', deleteBanner);
router.put('/banners/:id', updateBanner);
router.put('/banners/:id/status', toggleBannerStatus);

router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

router.put('/sections', updateSections);

module.exports = router;
