// routes/productRoutes.js
const express = require('express');
const Product = require('../models/product'); // Assuming Product.js is under /models folder
const puppeteer = require('puppeteer'); // Assuming Puppeteer is used for fetching

const router = express.Router();



// Your search route
router.get('/search', async (req, res) => {
  const { title, minPrice, maxPrice } = req.query;

  const query = {};

  // Filter by title (if provided)
  if (title) {
    query.title = { $regex: title, $options: 'i' };  // Case-insensitive search
  }

  // Filter by latest price in priceHistory (if provided)
  if (minPrice && maxPrice) {
    query['priceHistory.0.price'] = { $gte: minPrice, $lte: maxPrice };
  }

  try {
    const products = await Product.find(query);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch search results' });
  }
});



// Route to fetch product details and update price history
router.post('/fetch-product', async (req, res) => {
  const { productUrl } = req.body;
  
  try {
    // Fetch product details using Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(productUrl);

    // Extract product data (you can customize based on what you scrape)
    const productData = await page.evaluate(() => {
      const title = document.querySelector('span.VU-ZEz')?.innerText || 'Title not found';
      const price = document.querySelector('div.Nx9bqj')?.innerText || 'Price not found';
      const description = document.querySelector('div.yN+eNk p')?.innerText || 'Description not found';
      const highlights = document.querySelector('div.xFVion ul')?.innerText || 'Highlights not found';
      const reviews = document.querySelector('span.Wphh3N span')?.innerText || 'Reviews not found';
      const totalPurchases = document.querySelector('span.Wphh3N span')?.innerText || 'Total purchases not found';
      const rating = document.querySelector('div.XQDdHH')?.innerText || 'Rating not found';
      const imageUrl = document.querySelector('img._53J4C-')?.src || 'Image URL not found';
      
      return {
        title,
        price,
        description,
        highlights,
        reviews,
        totalPurchases,
        rating,
        imageUrl,
      };
    });

    await browser.close();

    // Find existing product by URL or create a new one
    let product = await Product.findOne({ url: productUrl });

    if (!product) {
      product = new Product({
        title: productData.title,
        url: productUrl,
        description: productData.description,
        highlights: productData.highlights,
        rating: productData.rating,
        reviews: productData.reviews,
        totalPurchases: productData.totalPurchases,
        imageUrl: productData.imageUrl,
        priceHistory: [{ price: productData.price }],
      });
    } else {
      // If the product already exists, just update the price history
      product.priceHistory.push({ price: productData.price });
    }

    await product.save();

    res.status(200).json({ message: 'Product details fetched and saved successfully', product });
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
});

module.exports = router;
