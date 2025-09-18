import { client } from '../lib/redis.js';
import product from '../models/product.model.js';


export const getAllProducts = async (req, res) => {
  try {
    const products = await product.find();
    res.status(200).json(products);
  } catch (error) {
    console.log("Error in getAllProducts:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    let featuredProducts = await client.get("featured_products")
    if(featuredProducts){
      return res.status(200).json(JSON.parse(featuredProducts));
    }
    
    // If not in cache, fetch from mongodb
    // .lean() is gonna return a plain javascript object instead of mongodb document
    // which is more lightweight and faster to work with
    featuredProducts = await product.find({ isFeatured: true }).lean();

    if(!featuredProducts){
      return res.status(404).json({ message: 'No featured products found' });
    }

    // Store in redis for future quick access
    await redis.set("featured_products", JSON.stringify(featuredProducts));
    res.status(200).json(featuredProducts);
  }catch (error) {
    console.log("Error in getFeaturedProducts:", error.message);
    res.status(500).json({ message: 'Server error hoise', error: error.message });
  }
}