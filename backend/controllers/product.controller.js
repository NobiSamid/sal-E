import { client } from '../lib/redis.js';
import cloudinary from '../lib/cloudinary.js';
import Product from '../models/product.model.js';


export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}); //find all products
    res.status(200).json({products});
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
    featuredProducts = await Product.find({ isFeatured: true }).lean();

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

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, image, category } = req.body;
    
    let cloudinaryResponse = null;

    if(image){
      cloudinaryResponse = await cloudinary.uploader.upload(image, {folder: 'products'})
    }

    const product = await Product.create({
      name,
      description,
      price,
      image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url:"",
      category
    })
    res.status(201).json({ message: 'Product created successfully', product });
  }catch (error) {
    console.log("Error in createProduct:", error.message);
    res.status(500).json({ message: 'Server error hoise product create korte giye', error: error.message });
  }
  console.log("Incoming product data:", req.body);
};

// export const deleteProduct = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);
//     if (!product) {
//       return res.status(404).json({ message: 'Product delete korar jonno pai nai' });
//     }

//     if (product.image) {
//       const publicId = product.image.split('/').pop().split('.')[0]; // Extract public ID from URL
//       try{
//         await cloudinary.uploader.destroy(`products/${publicId}`);
//         console.log("Image deleted from Cloudinary");
//       }catch(error){
//         console.log("Error deleting image from Cloudinary:", error.message);
//       }
//     }

//     await Product.findByIdAndDelete(req.params.id);
//     res.status(200).json({ message: 'Product deleted successfully'})
    
//   } catch (error) {
//     console.log("Error in deleteProduct:", error.message);
//     res.status(500).json({ message: 'Server error hoise', error: error.message });
//   }  

// }

export const deleteProduct = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);

		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		if (product.image) {
			const publicId = product.image.split("/").pop().split(".")[0];
			try {
				await cloudinary.uploader.destroy(`products/${publicId}`);
				console.log("deleted image from cloduinary");
			} catch (error) {
				console.log("error deleting image from cloduinary", error);
			}
		}

		await Product.findByIdAndDelete(req.params.id);

		res.json({ message: "Product deleted successfully" });
	} catch (error) {
		console.log("Error in deleteProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};


export const getRecommendedProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $sample: {size:3}
      },
      {
        $project:{
          _id:1,
          name:1,
          description:1,
          price:1,
          image:1
        }
      }
    ])
    res.status(200).json(products);
  } catch (error) {
    console.log("Error in getRecommendedProducts:", error.message);
    res.status(500).json({ message: 'Server error hoise', error: error.message });
  }
};

export const getProductsBYCategory = async (req, res) => {
  const {category} = req.params;
  try {
    const products = await Product.find({category});
    res.status(200).json({products});
  } catch (error) {
    console.log("Error in getProductsBYCategory:", error.message);
    res.status(500).json({ message: 'Server error hoise', error: error.message });
  }
};

export const toggleFeaturedProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if(product){
    product.isFeatured = !product.isFeatured;
    const updatedProduct = await product.save();
    await updateFeaturedProductsCache();
    res.status(200).json({message: 'Product updated successfully', product: updatedProduct});
  } else{
    res.status(404).json({message: 'Product not found'});
  }
}

async function updateFeaturedProductsCache(){
  try{
    // the len() method is used to return plain js objects instead of full mongoose docs. this can significantly improve performance when we only need to read the data

    const featuredProducts = await Product.find({isFeatured: true}).lean();
    await client.set("featured_products", JSON.stringify(featuredProducts));
  } catch (error){
    console.log("Error updating featured products cache:", error.message);
  }
}  