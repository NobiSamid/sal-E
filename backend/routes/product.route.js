import express from 'express';
import { getAllProducts } from '../controllers/product.controller.js';
import { adminRoute, protectRoute } from '../middleware/auth.middleware.js';
import { getFeaturedProducts } from '../controllers/product.controller.js';


const router = express.Router();

router.get('/', protectRoute, adminRoute, getAllProducts);
router.get('/featured', getFeaturedProducts);

export default router;