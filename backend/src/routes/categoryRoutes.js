const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all categories
// @route   GET /api/v1/categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, count: categories.length, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get categories as tree
// @route   GET /api/v1/categories/tree
// @access  Public
router.get('/tree', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1 });

    const buildTree = (parentId = null) => {
      return categories
        .filter(cat => String(cat.parentCategoryId) === String(parentId))
        .map(cat => ({
          ...cat._doc,
          children: buildTree(cat._id)
        }));
    };

    const tree = buildTree();
    res.json({ success: true, data: tree });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Create category
// @route   POST /api/v1/categories
// @access  Private (Admin)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Delete category
// @route   DELETE /api/v1/categories/:id
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    await category.deleteOne();
    res.json({ success: true, message: 'Category removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
