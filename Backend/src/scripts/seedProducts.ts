import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { UserModel } from '../models/User.js';
import { ProductCategoryModel } from '../models/ProductCategory.js';
import { ProductModel } from '../models/Product.js';
import { InventoryMovementModel } from '../models/InventoryMovement.js';
import { ProductActivityModel } from '../models/ProductActivity.js';
import { NotificationModel } from '../models/Notification.js';

async function seedProductsAndInventory() {
  try {
    console.log('[Seed] Connecting to MongoDB:', config.mongodbUri);
    await mongoose.connect(config.mongodbUri);
    console.log('[Seed] Connected to database');

    const founder = await UserModel.findOne({ role: 'FOUNDER' });
    const manager = await UserModel.findOne({ role: 'MANAGER' });

    if (!founder) {
      throw new Error('Founder user not found. Run main seed script first.');
    }

    const performerId = founder._id;
    const managerId = manager ? manager._id : founder._id;

    // 1. Seed Product Categories
    console.log('[Seed] Creating product categories...');
    const categoryDefs = [
      {
        name: 'Skincare',
        description: 'Natural facial care, serums, moisturizers, and organic formulations',
        status: 'ACTIVE'
      },
      {
        name: 'Haircare',
        description: 'Herbal hair oils, strengthening tonics, and sulphate-free cleansers',
        status: 'ACTIVE'
      },
      {
        name: 'Body Care',
        description: 'Ayurvedic body polishers, ubtans, butters, and gentle washes',
        status: 'ACTIVE'
      },
      {
        name: 'Gift Sets',
        description: 'Curated organic gift boxes and celebratory wellness collections',
        status: 'ACTIVE'
      },
      {
        name: 'Accessories',
        description: 'Eco-friendly wooden applicators, gua shas, and packaging tools',
        status: 'ACTIVE'
      }
    ];

    const categoryMap = new Map<string, any>();
    for (const cat of categoryDefs) {
      let doc = await ProductCategoryModel.findOne({ name: cat.name });
      if (!doc) {
        doc = await ProductCategoryModel.create(cat);
      }
      categoryMap.set(cat.name, doc);
    }
    console.log(`[Seed] Seeded ${categoryMap.size} product categories`);

    // 2. Define Real Products
    const productDefs = [
      {
        name: 'Lavanta Face Serum - Advanced Botanical Glow',
        slug: 'lavanta-face-serum-advanced-botanical-glow',
        sku: 'LAV-FS-001',
        description: 'Pure cold-pressed botanical facial elixir enriched with squalane, bakuchiol, and organic lavender oil for radiant, deeply hydrated skin.',
        categoryName: 'Skincare',
        brand: 'Lavanta Naturals',
        unit: 'BOTTLE',
        sellingPrice: 799,
        costPrice: 320,
        stockQuantity: 42,
        lowStockThreshold: 15,
        tags: ['Best Seller', 'Featured', 'Facial Care', 'Glow'],
        images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80'],
        status: 'ACTIVE'
      },
      {
        name: 'Pure Kashmiri Rose Water Toner - Steam Distilled',
        slug: 'pure-kashmiri-rose-water-toner-steam-distilled',
        sku: 'LAV-RW-002',
        description: 'Hydro-distilled from freshly handpicked Kashmiri Damask roses. Alcohol-free hydrating mist for pore refinement and instant revitalisation.',
        categoryName: 'Skincare',
        brand: 'Lavanta Naturals',
        unit: 'BOTTLE',
        sellingPrice: 449,
        costPrice: 160,
        stockQuantity: 8, // LOW STOCK (<= 10)
        lowStockThreshold: 10,
        tags: ['Organic', 'Toner', 'Hydration', 'New'],
        images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80'],
        status: 'ACTIVE'
      },
      {
        name: 'Rosemary & Bhringraj Hair Growth Oil',
        slug: 'rosemary-bhringraj-hair-growth-oil',
        sku: 'LAV-HO-003',
        description: 'Ancient Ayurvedic scalp revitalizer infused with organic rosemary, bhringraj, amla, and cold-pressed sesame oil.',
        categoryName: 'Haircare',
        brand: 'Lavanta Naturals',
        unit: 'BOTTLE',
        sellingPrice: 599,
        costPrice: 210,
        stockQuantity: 0, // OUT OF STOCK (= 0)
        lowStockThreshold: 12,
        tags: ['Hair Health', 'Ayurvedic', 'Best Seller'],
        images: ['https://images.unsplash.com/photo-1608248597359-bb5eb4399e57?w=600&auto=format&fit=crop&q=80'],
        status: 'ACTIVE'
      },
      {
        name: 'Sandalwood & Saffron Radiance Ubtan Body Polisher',
        slug: 'sandalwood-saffron-radiance-ubtan-body-polisher',
        sku: 'LAV-BP-004',
        description: 'Handcrafted exfoliating body polish with pure Mysore sandalwood, Kashmiri saffron threads, turmeric, and walnut shell granules.',
        categoryName: 'Body Care',
        brand: 'Lavanta Naturals',
        unit: 'GRAM',
        sellingPrice: 649,
        costPrice: 250,
        stockQuantity: 35,
        lowStockThreshold: 10,
        tags: ['Body Care', 'Exfoliator', 'Ayurvedic'],
        images: ['https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&auto=format&fit=crop&q=80'],
        status: 'ACTIVE'
      },
      {
        name: 'Kumkumadi Miraculous Beauty Ayurvedic Night Cream',
        slug: 'kumkumadi-miraculous-beauty-ayurvedic-night-cream',
        sku: 'LAV-NC-005',
        description: 'Rich restorative night therapy with authentic 16-herb Kumkumadi Tailam, shea butter, and licorice root for overnight cell renewal.',
        categoryName: 'Skincare',
        brand: 'Lavanta Naturals',
        unit: 'PIECE',
        sellingPrice: 899,
        costPrice: 380,
        stockQuantity: 28,
        lowStockThreshold: 8,
        tags: ['Night Therapy', 'Anti-Aging', 'Luxury'],
        images: ['https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80'],
        status: 'ACTIVE'
      },
      {
        name: 'Wild Lavender & Chamomile Calming Mist',
        slug: 'wild-lavender-chamomile-calming-mist',
        sku: 'LAV-CM-006',
        description: 'Soothing aromatherapy facial mist with Himalayan wild lavender and organic German chamomile water to calm stressed, reactive skin.',
        categoryName: 'Skincare',
        brand: 'Lavanta Naturals',
        unit: 'BOTTLE',
        sellingPrice: 499,
        costPrice: 190,
        stockQuantity: 5, // LOW STOCK (<= 10)
        lowStockThreshold: 10,
        tags: ['Calming', 'Aromatherapy', 'Sensitive Skin'],
        images: ['https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600&auto=format&fit=crop&q=80'],
        status: 'ACTIVE'
      },
      {
        name: 'Festive Glow Luxury Gift Box - 4 Piece Set',
        slug: 'festive-glow-luxury-gift-box-4-piece-set',
        sku: 'LAV-GB-007',
        description: 'Exquisite festive gift set packaged in eco-friendly handcrafted box containing Face Serum, Rose Water, Night Cream, and Rose Quartz Gua Sha.',
        categoryName: 'Gift Sets',
        brand: 'Lavanta Naturals',
        unit: 'BOX',
        sellingPrice: 1899,
        costPrice: 850,
        stockQuantity: 18,
        lowStockThreshold: 5,
        tags: ['Gift', 'Festive', 'Featured', 'Luxury'],
        images: ['https://images.unsplash.com/photo-1549049950-48d5887197a0?w=600&auto=format&fit=crop&q=80'],
        status: 'ACTIVE'
      }
    ];

    console.log('[Seed] Seeding products & historical movements...');
    for (const p of productDefs) {
      let product = await ProductModel.findOne({ sku: p.sku });
      const cat = categoryMap.get(p.categoryName);

      if (!product) {
        product = await ProductModel.create({
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          description: p.description,
          categoryId: cat._id,
          brand: p.brand,
          unit: p.unit,
          sellingPrice: p.sellingPrice,
          costPrice: p.costPrice,
          stockQuantity: p.stockQuantity,
          lowStockThreshold: p.lowStockThreshold,
          tags: p.tags,
          images: p.images,
          status: p.status,
          createdBy: performerId
        });

        // Create initial opening stock movement
        await InventoryMovementModel.create({
          productId: product._id,
          type: 'OPENING_STOCK',
          quantity: p.stockQuantity + 10, // Started with slightly higher stock
          previousQuantity: 0,
          newQuantity: p.stockQuantity + 10,
          reason: 'Initial batch opening inventory',
          reference: `BATCH-${p.sku}-01`,
          notes: 'Warehoused at Lavanta Central Facility',
          performedBy: performerId,
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        });

        // Add a secondary movement (e.g. stock adjustment or restocking) to create realistic history
        if (p.stockQuantity === 0) {
          // It was depleted
          await InventoryMovementModel.create({
            productId: product._id,
            type: 'STOCK_OUT',
            quantity: p.stockQuantity + 10,
            previousQuantity: p.stockQuantity + 10,
            newQuantity: 0,
            reason: 'Store fulfillment and batch expiry clearance',
            reference: `OUT-${p.sku}-88`,
            notes: 'All units dispatched to retail partner',
            performedBy: managerId,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          });
        } else {
          // Adjust 10 units out
          await InventoryMovementModel.create({
            productId: product._id,
            type: 'STOCK_OUT',
            quantity: 10,
            previousQuantity: p.stockQuantity + 10,
            newQuantity: p.stockQuantity,
            reason: 'Store dispatch for flagship retail outlet display',
            reference: `DISP-${p.sku}-12`,
            notes: 'Verified against packing manifest',
            performedBy: managerId,
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
          });
        }

        // Activity log
        await ProductActivityModel.create({
          productId: product._id,
          userId: performerId,
          action: 'PRODUCT_CREATED',
          metadata: { sku: p.sku, initialStock: p.stockQuantity },
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        });
      }
    }

    // Seed low-stock notifications for the low stock products
    const lowStockProduct = await ProductModel.findOne({ sku: 'LAV-RW-002' });
    if (lowStockProduct) {
      await NotificationModel.create({
        recipientId: performerId,
        senderId: null,
        type: 'LOW_STOCK_ALERT',
        title: `Low Stock Alert: ${lowStockProduct.name}`,
        message: `${lowStockProduct.name} is running low (${lowStockProduct.stockQuantity} remaining, threshold: ${lowStockProduct.lowStockThreshold}).`,
        relatedEntityType: 'PRODUCT',
        relatedEntityId: lowStockProduct._id,
        createdAt: new Date()
      });
    }

    const outOfStockProduct = await ProductModel.findOne({ sku: 'LAV-HO-003' });
    if (outOfStockProduct) {
      await NotificationModel.create({
        recipientId: performerId,
        senderId: null,
        type: 'OUT_OF_STOCK_ALERT',
        title: `Out of Stock: ${outOfStockProduct.name}`,
        message: `${outOfStockProduct.name} is now OUT OF STOCK (0 units left). Restocking order recommended.`,
        relatedEntityType: 'PRODUCT',
        relatedEntityId: outOfStockProduct._id,
        createdAt: new Date()
      });
    }

    console.log('[Seed] Phase 11 Products & Inventory seeded successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedProductsAndInventory();
