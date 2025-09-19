import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import authRoute from './routes/auth.route.js';
import productRoute from './routes/product.route.js';
import cartRoute from './routes/cart.route.js';
import couponRoute from './routes/coupon.route.js';
import paymentRoute from './routes/payment.route.js';


import { connectDB } from './lib/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoute);
app.use('/api/products', productRoute);
app.use('/api/cart', cartRoute);
app.use('/api/coupons', couponRoute);
app.use('/api/payments', paymentRoute);


app.get("/", (req, res) => {
  res.send("Server is working fine");
});


connectDB().then(() => {
    app.listen(PORT, () => {
      console.log('Server is running on http://localhost:' + PORT);
    });
})