const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');
const Seller = require('../models/Seller');

// @desc    Get all products with advanced filtering, search, sorting, pagination
// @route   GET /api/v1/products
// @access  Public
const getProducts = async (req, res) => {
    try {
        const {
            category,
            subcategory,
            minPrice,
            maxPrice,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            inStock,
            page = 1,
            limit = 20,
            marketplace
        } = req.query;

        // Build query - Only show active products from approved sellers
        const approvedSellers = await Seller.find({ verificationStatus: 'approved' }).select('_id');
        const approvedSellerIds = approvedSellers.map(s => s._id);
        
        const query = { 
            status: 'active',
            sellerId: { $in: approvedSellerIds }
        };

        // Category filter
        if (category) {
            const categoryDoc = await Category.findOne({ name: new RegExp(`^${category}$`, 'i') });
            if (categoryDoc) {
                const categoryIds = [categoryDoc._id];

                // Include all subcategories
                const subcategories = await Category.find({ parentId: categoryDoc._id });
                categoryIds.push(...subcategories.map(sc => sc._id));

                query.categoryId = { $in: categoryIds };
            }
        }

        // Subcategory filter
        if (subcategory) {
            const subcategoryDoc = await Category.findOne({ name: new RegExp(`^${subcategory}$`, 'i') });
            if (subcategoryDoc) {
                query.categoryId = subcategoryDoc._id;
            }
        }

        // Price range filter
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        // Search filter
        if (search && search.trim()) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // In stock filter
        if (inStock === 'true') {
            query.quantity = { $gt: 0 };
        }

        // Marketplace filter
        if (marketplace) {
            query.marketplace = marketplace;
        }

        // Build sort object
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Execute query
        const products = await Product.find(query)
            .populate('categoryId', 'name')
            .populate('sellerId', 'shopName storeName')
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Get total count for pagination
        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limitNum);

        // Build response
        const response = {
            success: true,
            data: {
                products,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalProducts,
                    limit: limitNum,
                    hasNext: pageNum < totalPages,
                    hasPrev: pageNum > 1
                },
                appliedFilters: {
                    category: category || null,
                    subcategory: subcategory || null,
                    priceRange: (minPrice || maxPrice) ? `${minPrice || 0}-${maxPrice || '∞'}` : null,
                    search: search || null,
                    sortBy,
                    sortOrder,
                    inStock: inStock === 'true'
                }
            }
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products',
            error: error.message
        });
    }
};

// @desc    Get single product by ID
// @route   GET /api/v1/products/:id
// @access  Public
const getSingleProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('categoryId', 'name')
            .populate('sellerId', 'shopName storeName userId')
            .lean();

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Increment view count
        await Product.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product',
            error: error.message
        });
    }
};

// @desc    Get similar products
// @route   GET /api/v1/products/:id/similar
// @access  Public
const getSimilarProducts = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const similarProducts = await Product.find({
            categoryId: product.categoryId,
            _id: { $ne: product._id },
            status: 'active',
            price: {
                $gte: product.price * 0.7,
                $lte: product.price * 1.3
            }
        })
            .populate('categoryId', 'name')
            .populate('sellerId', 'shopName')
            .limit(8)
            .lean();

        res.status(200).json({
            success: true,
            data: similarProducts
        });
    } catch (error) {
        console.error('Error fetching similar products:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch similar products',
            error: error.message
        });
    }
};

// @desc    Get product reviews
// @route   GET /api/v1/products/:id/reviews
// @access  Public
const getProductReviews = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const reviews = await Review.find({ productId: req.params.id, isApproved: true })
            .populate('userId', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean();

        const totalReviews = await Review.countDocuments({ productId: req.params.id, isApproved: true });

        res.status(200).json({
            success: true,
            data: {
                reviews,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(totalReviews / limitNum),
                    totalReviews
                }
            }
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews',
            error: error.message
        });
    }
};

// @desc    Create new product (Seller only)
// @route   POST /api/v1/products
// @access  Private/Seller
const createProduct = async (req, res) => {
    try {
        const { name, price, description, categoryId, quantity, marketplace } = req.body;

        // Get seller from authenticated user
        const seller = await Seller.findOne({ userId: req.user._id });
        if (!seller) {
            return res.status(403).json({
                success: false,
                message: 'You must be a verified seller to add products'
            });
        }

        // Handle image uploads (multer middleware should handle this)
        const images = req.files ? req.files.map(file => file.path) : [];

        const product = await Product.create({
            name,
            price,
            description,
            categoryId,
            sellerId: seller._id,
            quantity: quantity || 1,
            marketplace: marketplace || 'craft',
            images,
            status: 'pending' // Needs admin approval
        });

        res.status(201).json({
            success: true,
            data: product,
            message: 'Product created successfully. Awaiting admin approval.'
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create product',
            error: error.message
        });
    }
};

module.exports = {
    getProducts,
    getSingleProduct,
    getSimilarProducts,
    getProductReviews,
    createProduct
};
