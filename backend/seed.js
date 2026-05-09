const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('./src/config/db');
const User = require('./src/models/User');
const Seller = require('./src/models/Seller');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');

/**
 * SEED SCRIPT - Populate database with dummy data
 * Run with: node seed.js
 * This creates admin, users, sellers, categories, and sample products
 */
(async function () {
  await connectDB();

  // Clear existing data and indexes
  await mongoose.connection.db.dropDatabase();
  console.log('Database dropped/cleared.');

  // Re-create indexes will happen on save if not auto (mongoose usually handles it)
  // But strictly speaking dropping DB is safest for dev.

  console.log('Creating users...');

  // Create Admin user
  const admin = new User({
    name: 'Admin',
    email: process.env.ADMIN_EMAIL || 'admin@homedify.local',
    password: 'admin123',
    role: 'admin',
    contactNumber: '03001234567',
    address: { street: 'Admin St', city: 'Lahore', province: 'Punjab', postalCode: '54000' }
  });
  await admin.save();

  // Create Customer user
  const user = new User({
    name: 'Ayesha Khan',
    email: 'ayesha@homedify.local',
    password: 'password123',
    role: 'customer',
    contactNumber: '03112223334',
    address: { street: 'User St', city: 'Karachi', province: 'Sindh', postalCode: '75000' }
  });
  await user.save();

  // Create Seller 1: Sara (Verified Seller)
  const sellerUser1 = new User({
    name: 'Sara Ali',
    email: 'sara@homedify.local',
    password: 'password123',
    role: 'seller',
    contactNumber: '03224445556',
    address: { street: 'Seller St 1', city: 'Islamabad', province: 'ICT', postalCode: '44000' }
  });
  await sellerUser1.save();
  const seller1 = new Seller({
    userId: sellerUser1._id,
    shopName: 'Sara Handmade Crafts',
    category: 'Handmade Crafts',
    storeName: 'Sara Handmade Crafts',
    storeDescription: 'Authentic handmade crafts from Sara.',
    cnicNumber: '3520212345671',
    cnicImages: { front: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400', back: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400' },
    selfieImage: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400',
    storeAddress: 'Sara crafts, main bazar, Islamabad',
    verificationStatus: 'approved',
    verification: {
      ocr: true,
      faceMatch: true,
      ocrDetails: { name: 'Sara Ali', gender: 'Female', cnic: '3520212345671' },
      faceMatchConfidence: 0.95
    }
  });
  await seller1.save();

  // Create Seller 2: Fatima (Verified Seller)
  const sellerUser2 = new User({
    name: 'Fatima Raza',
    email: 'fatima@homedify.local',
    password: 'password123',
    role: 'seller',
    contactNumber: '03337778889',
    address: { street: 'Seller St 2', city: 'Faisalabad', province: 'Punjab', postalCode: '38000' }
  });
  await sellerUser2.save();
  const seller2 = new Seller({
    userId: sellerUser2._id,
    shopName: 'Fatima Home Decor',
    category: 'Home Decor',
    storeName: 'Fatima Home Decor',
    storeDescription: 'Beautiful home decor items.',
    cnicNumber: '4220198765432',
    cnicImages: { front: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400', back: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400' },
    selfieImage: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400',
    storeAddress: 'Fatima decor, Kohinoor City, Faisalabad',
    verificationStatus: 'approved',
    verification: {
      ocr: true,
      faceMatch: true,
      ocrDetails: { name: 'Fatima Raza', gender: 'Female', cnic: '4220198765432' },
      faceMatchConfidence: 0.92
    }
  });
  await seller2.save();

  // Create Seller 3: Zainab (Pending approval)
  const sellerUser3 = new User({
    name: 'Zainab Hassan',
    email: 'zainab@homedify.local',
    password: 'password123',
    role: 'customer',
    contactNumber: '03445556667',
    address: { street: 'Seller St 3', city: 'Multan', province: 'Punjab', postalCode: '60000' }
  });
  await sellerUser3.save();
  const seller3 = new Seller({
    userId: sellerUser3._id,
    shopName: 'Zainab Sweets',
    category: 'Selected Food',
    storeName: 'Zainab Sweets',
    storeDescription: 'Homemade sweets and treats.',
    cnicNumber: '3740555555556',
    cnicImages: { front: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400', back: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400' },
    selfieImage: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400',
    storeAddress: 'Zainab sweets, Gulgasht, Multan',
    verificationStatus: 'pending_verification'
  });
  await seller3.save();

  // Create Seller 4: Maria (Fully Verified for Testing)
  const sellerUser4 = new User({
    name: 'Maria Ahmed',
    email: 'maria@homedify.local',
    password: 'password123',
    role: 'seller',
    contactNumber: '03556667778',
    address: { street: 'Seller St 4', city: 'Rawalpindi', province: 'Punjab', postalCode: '46000' }
  });
  await sellerUser4.save();
  const seller4 = new Seller({
    userId: sellerUser4._id,
    shopName: 'Maria Creations',
    category: 'Handmade Crafts',
    storeName: 'Maria Creations',
    storeDescription: 'Beautiful handcrafted jewelry and accessories.',
    cnicNumber: '3730345678901',
    cnicImages: { front: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400', back: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400' },
    selfieImage: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400',
    storeAddress: 'Maria creations, Saddar, Rawalpindi',
    verificationStatus: 'approved',
    verification: {
      ocr: true,
      faceMatch: true,
      ocrDetails: { name: 'Maria Ahmed', gender: 'Female', cnic: '3730345678901' },
      faceMatchConfidence: 0.97
    }
  });
  await seller4.save();

  console.log('Creating categories...');

  // Main categories
  const cat1 = new Category({ name: 'Handmade Crafts', marketplace: 'craft' });
  const cat2 = new Category({ name: 'Home Decor', marketplace: 'craft' });
  const cat3 = new Category({ name: 'Selected Food', marketplace: 'food' });
  await cat1.save();
  await cat2.save();
  await cat3.save();

  // Subcategories for Handmade Crafts
  const subcat1 = new Category({ name: 'Pottery', parentCategoryId: cat1._id, marketplace: 'craft' });
  const subcat2 = new Category({ name: 'Embroidery', parentCategoryId: cat1._id, marketplace: 'craft' });
  const subcat3 = new Category({ name: 'Jewelry', parentCategoryId: cat1._id, marketplace: 'craft' });
  await subcat1.save();
  await subcat2.save();
  await subcat3.save();

  // Subcategories for Home Decor
  const subcat4 = new Category({ name: 'Wall Art', parentCategoryId: cat2._id, marketplace: 'craft' });
  const subcat5 = new Category({ name: 'Cushions', parentCategoryId: cat2._id, marketplace: 'craft' });
  const subcat6 = new Category({ name: 'Show Pieces', parentCategoryId: cat2._id, marketplace: 'craft' });
  await subcat4.save();
  await subcat5.save();
  await subcat6.save();

  // Subcategories for Food
  const foodCats = [
    'Biryani & Pulao', 'Karahi & Curries', 'Home-made Sweets', 
    'Frozen Foods', 'Pickles & Spices', 'Baked Goods'
  ];
  for (const fcat of foodCats) {
    await new Category({ name: fcat, parentCategoryId: cat3._id, marketplace: 'food' }).save();
  }

  console.log('Creating products...');

  // Sara's Products (Handmade Crafts)
  const products = [
    {
      sellerId: seller1._id,
      name: 'Hand-Painted Ceramic Mug',
      description: 'Beautiful hand-painted ceramic mug with traditional Pakistani motifs. Microwave and dishwasher safe.',
      price: 1200,
      quantity: 10,
      images: ['https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400'],
      categoryId: subcat1._id,
      marketplace: 'craft'
    },
    {
      sellerId: seller1._id,
      name: 'Embroidered Cushion Cover',
      description: 'Handmade cushion cover with intricate embroidery. Size: 16x16 inches. Perfect for your living room.',
      price: 850,
      quantity: 15,
      images: ['https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400'],
      categoryId: subcat2._id,
      marketplace: 'craft'
    },
    {
      sellerId: seller1._id,
      name: 'Handmade Clay Tea Set',
      description: 'Traditional clay tea set includes 1 teapot and 4 cups. Handcrafted with love.',
      price: 2500,
      quantity: 5,
      images: ['https://images.unsplash.com/photo-1578922746892-14686f0e2e6a?w=400'],
      categoryId: subcat1._id,
      marketplace: 'craft'
    },
    {
      sellerId: seller1._id,
      name: 'Beaded Bracelet Set',
      description: 'Set of 3 colorful beaded bracelets. Perfect gift for any occasion.',
      price: 450,
      quantity: 20,
      images: ['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400'],
      categoryId: subcat3._id,
      marketplace: 'craft'
    },

    // Fatima's Products (Home Decor)
    {
      sellerId: seller2._id,
      name: 'Macrame Wall Hanging',
      description: 'Beautiful macrame wall hanging, handcrafted with cotton rope. Size: 24x36 inches.',
      price: 3200,
      quantity: 8,
      images: ['https://images.unsplash.com/photo-1602932347892-f3eb7e91f2c4?w=400'],
      categoryId: subcat4._id,
      marketplace: 'craft'
    },
    {
      sellerId: seller2._id,
      name: 'Decorative Throw Pillows (Set of 2)',
      description: 'Set of 2 decorative throw pillows with geometric patterns. Size: 18x18 inches each.',
      price: 1800,
      quantity: 12,
      images: ['https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=400'],
      categoryId: subcat5._id,
      marketplace: 'craft'
    },
    {
      sellerId: seller2._id,
      name: 'Wooden Photo Frame',
      description: 'Handcrafted wooden photo frame with carved details. Perfect for 8x10 photos.',
      price: 950,
      quantity: 25,
      images: ['https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=400'],
      categoryId: cat2._id,
      marketplace: 'craft'
    },
    {
      sellerId: seller2._id,
      name: 'Scented Candle Set',
      description: 'Set of 3 handmade scented candles. Fragrances: Lavender, Vanilla, and Jasmine.',
      price: 1500,
      quantity: 30,
      images: ['https://images.unsplash.com/photo-1602874801007-63c0f6c5f1a0?w=400'],
      categoryId: cat2._id,
      marketplace: 'craft'
    },
    {
      sellerId: seller2._id,
      name: 'Hand-woven Table Runner',
      description: 'Traditional hand-woven table runner. Size: 72x14 inches. Perfect for dining tables.',
      price: 2200,
      quantity: 5,
      images: ['https://images.unsplash.com/photo-1604694988955-1c172e3ef9e7?w=400'],
      categoryId: cat2._id,
      marketplace: 'craft'
    },
    {
      sellerId: seller2._id,
      name: 'Brass Vintage Telephone',
      description: 'Antique style brass telephone show piece. Perfect for retro decor.',
      price: 4500,
      quantity: 2,
      images: ['https://images.unsplash.com/photo-1520699697851-3cdc782522a2?w=400'],
      categoryId: subcat6._id,
      marketplace: 'craft'
    },
    {
      sellerId: seller2._id,
      name: 'Marble Elephant Figurine',
      description: 'Hand-carved marble elephant figurine with gold accents.',
      price: 2200,
      quantity: 4,
      images: ['https://images.unsplash.com/photo-1552391223-99933d74c8bc?w=400'],
      categoryId: subcat6._id,
      marketplace: 'craft'
    },
    {
      sellerId: seller2._id,
      name: 'Abstract Metal Sculpture',
      description: 'Modern abstract metal sculpture for contemporary homes.',
      price: 3800,
      quantity: 3,
      images: ['https://images.unsplash.com/photo-1554109726-2a7e7534c56e?w=400'],
      categoryId: subcat6._id,
      marketplace: 'craft'
    },

    // More products from Sara
    {
      sellerId: seller1._id,
      name: 'Handmade Soap Gift Set',
      description: 'Set of 5 natural handmade soaps with organic ingredients. Various scents.',
      price: 650,
      quantity: 50,
      images: ['https://images.unsplash.com/photo-1600428853876-a3c9b6c14f9b?w=400'],
      categoryId: cat1._id,
      marketplace: 'craft'
    },
    {
      sellerId: seller1._id,
      name: 'Crochet Baby Blanket',
      description: 'Soft and cozy crochet baby blanket. Size: 30x36 inches. Machine washable.',
      price: 1800,
      quantity: 6,
      images: ['https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=400'],
      categoryId: cat1._id,
      marketplace: 'craft'
    },
    {
      sellerId: seller1._id,
      name: 'Hand-painted Decorative Plates (Set of 3)',
      description: 'Set of 3 decorative plates with beautiful floral designs. Great for wall decor.',
      price: 2800,
      quantity: 4,
      images: ['https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=400'],
      categoryId: subcat1._id,
      marketplace: 'craft'
    },
  ];

  for (const productData of products) {
    const product = new Product({
      ...productData,
      status: 'active'
    });
    await product.save();
  }

  console.log('✓ Seed complete!');
  console.log('\n=== LOGIN CREDENTIALS ===');
  console.log('Admin: admin@homedify.local / admin123');
  console.log('User: ayesha@homedify.local / password123');
  console.log('Seller 1 (Verified): sara@homedify.local / password123');
  console.log('Seller 2 (Verified): fatima@homedify.local / password123');
  console.log('Seller 3 (Pending): zainab@homedify.local / password123');
  console.log('Seller 4 (Verified): maria@homedify.local / password123');
  console.log('========================\n');

  process.exit(0);
})();
