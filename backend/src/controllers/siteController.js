const Content = require('../models/Content');
const Category = require('../models/Category');
const Product = require('../models/Product');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const path = require('path');
const fs = require('fs');

// @desc    Get site settings (logo & banners)
// @route   GET /api/v1/site/settings
// @access  Public
exports.getSiteSettings = asyncHandler(async (req, res, next) => {
    let logo = await Content.findOne({ type: 'homepage' }); // Assuming logo is stored in homepage content for now
    let banners = await Content.findOne({ type: 'banner' });

    res.status(200).json({
        success: true,
        data: {
            logo: logo ? logo.content.logo : null,
            banners: banners ? banners.content : [],
            sections: logo ? logo.content.sections : []
        }
    });
});

// @desc    Update site logo
// @route   PUT /api/v1/site/logo
// @access  Private/Admin
exports.updateLogo = asyncHandler(async (req, res, next) => {
    if (!req.file) {
        return next(new ErrorResponse('Please upload an image', 400));
    }

    let homepage = await Content.findOne({ type: 'homepage' });
    const logoPath = req.file.path;

    if (!homepage) {
        homepage = await Content.create({
            type: 'homepage',
            content: { logo: logoPath, sections: [] },
            updatedBy: req.user.id
        });
    } else {
        homepage.content.logo = logoPath;
        homepage.updatedBy = req.user.id;
        homepage.markModified('content');
        await homepage.save();
    }

    res.status(200).json({
        success: true,
        data: logoPath
    });
});

// @desc    Manage banners
// @route   POST /api/v1/site/banners
// @access  Private/Admin
exports.addBanner = asyncHandler(async (req, res, next) => {
    if (!req.file) {
        return next(new ErrorResponse('Please upload a banner image', 400));
    }

    let banners = await Content.findOne({ type: 'banner' });
    const bannerData = {
        id: Date.now().toString(),
        image: req.file.path,
        title: req.body.title || '',
        link: req.body.link || '',
        active: true
    };

    if (!banners) {
        banners = await Content.create({
            type: 'banner',
            content: [bannerData],
            updatedBy: req.user.id
        });
    } else {
        banners.content.push(bannerData);
        banners.markModified('content');
        await banners.save();
    }

    res.status(201).json({
        success: true,
        data: banners.content
    });
});

// @desc    Delete banner
// @route   DELETE /api/v1/site/banners/:id
// @access  Private/Admin
exports.deleteBanner = asyncHandler(async (req, res, next) => {
    let banners = await Content.findOne({ type: 'banner' });
    if (!banners) {
        return next(new ErrorResponse('No banners found', 404));
    }

    banners.content = banners.content.filter(b => b.id !== req.params.id);
    banners.markModified('content');
    await banners.save();

    res.status(200).json({
        success: true,
        data: banners.content
    });
});

// @desc    Update banner
// @route   PUT /api/v1/site/banners/:id
// @access  Private/Admin
exports.updateBanner = asyncHandler(async (req, res, next) => {
    let banners = await Content.findOne({ type: 'banner' });
    if (!banners) {
        return next(new ErrorResponse('No banners found', 404));
    }

    const index = banners.content.findIndex(b => b.id === req.params.id);
    if (index === -1) {
        return next(new ErrorResponse('Banner not found', 404));
    }

    banners.content[index] = {
        ...banners.content[index],
        ...req.body
    };

    banners.markModified('content');
    await banners.save();

    res.status(200).json({
        success: true,
        data: banners.content[index]
    });
});

// @desc    Toggle banner status
// @route   PUT /api/v1/site/banners/:id/status
// @access  Private/Admin
exports.toggleBannerStatus = asyncHandler(async (req, res, next) => {
    let banners = await Content.findOne({ type: 'banner' });
    if (!banners) {
        return next(new ErrorResponse('No banners found', 404));
    }

    const index = banners.content.findIndex(b => b.id === req.params.id);
    if (index === -1) {
        return next(new ErrorResponse('Banner not found', 404));
    }

    banners.content[index].active = req.body.active;
    banners.markModified('content');
    await banners.save();

    res.status(200).json({
        success: true,
        data: banners.content[index]
    });
});

// @desc    Get all categories with product counts
// @route   GET /api/v1/site/categories
// @access  Private/Admin
exports.getCategories = asyncHandler(async (req, res, next) => {
    const categories = await Category.find().lean();
    
    // Get product counts for each category
    const categoriesWithCount = await Promise.all(categories.map(async (cat) => {
        const count = await Product.countDocuments({ categoryId: cat._id });
        return { ...cat, productCount: count };
    }));

    res.status(200).json({
        success: true,
        data: categoriesWithCount
    });
});

// @desc    Create category
// @route   POST /api/v1/site/categories
// @access  Private/Admin
exports.createCategory = asyncHandler(async (req, res, next) => {
    const { name, marketplace, description, icon } = req.body;

    const category = await Category.create({
        name,
        marketplace,
        description,
        icon,
        updatedBy: req.user.id
    });

    res.status(201).json({
        success: true,
        data: category
    });
});

// @desc    Update category
// @route   PUT /api/v1/site/categories/:id
// @access  Private/Admin
exports.updateCategory = asyncHandler(async (req, res, next) => {
    let category = await Category.findById(req.params.id);

    if (!category) {
        return next(new ErrorResponse('Category not found', 404));
    }

    category = await Category.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: category
    });
});

// @desc    Delete category
// @route   DELETE /api/v1/site/categories/:id
// @access  Private/Admin
exports.deleteCategory = asyncHandler(async (req, res, next) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        return next(new ErrorResponse('Category not found', 404));
    }

    // Check for products
    const productCount = await Product.countDocuments({ categoryId: category._id });
    if (productCount > 0) {
        return next(new ErrorResponse(`Cannot delete category with ${productCount} products`, 400));
    }

    await category.deleteOne();

    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Update homepage sections
// @route   PUT /api/v1/site/sections
// @access  Private/Admin
exports.updateSections = asyncHandler(async (req, res, next) => {
    let homepage = await Content.findOne({ type: 'homepage' });
    
    if (!homepage) {
        homepage = await Content.create({
            type: 'homepage',
            content: { logo: '', sections: req.body.sections },
            updatedBy: req.user.id
        });
    } else {
        homepage.content.sections = req.body.sections;
        homepage.markModified('content');
        await homepage.save();
    }

    res.status(200).json({
        success: true,
        data: homepage.content.sections
    });
});
