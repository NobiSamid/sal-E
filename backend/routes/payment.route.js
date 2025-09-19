import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { checkoutSuccess, createCheckoutSession } from "../controllers/payment.controller.js";

const router = express.Router();

router.post('/create-checkout-session', protectRoute, createCheckoutSession)

/// uporer obj ta nicher moto emon o hote pare
// router.post('/create-checkout-session', protectRoute, async (req, res) => {
//     try {
//       const {products, couponCode} = req.body;

//       if(!Array.isArray(products) || products.length === 0){
//         return res.status(400).json({error: ' invalid or empty products array '});
//       }

//       let totalAmount = 0;

//       const lineItems = products.map( product => {
//         const amount = Math.round(product.price * 100); // in cents
//         totalAmount += amount * product.quantity;

//         return {
//           price_data: {
//             currency: 'usd',
//             product_data: {
//               name: product.name,
//               images: [product.image]
//             },
//             unit_amount: amount
//           },
//         }
//       });

//       let coupon = null;
//       if(couponCode){
//         coupon = await Coupon.findOne({code: couponCode, userId: req.user._id, isActive: true});
//         if(coupon){
//           totalAmount -= Math.round((totalAmount * coupon.discountPercentage) / 100);
//         }
//       }
      
//       const session = await stripe.checkout.sessions.create({
//         payment_method_types: ['card'],
//         line_items: lineItems,
//         mode: 'payment',
//         success_url:`${process.env.CLIENT_URL}/success? session_id={CHECKOUT_SESSION_ID}`,
//         cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
//         discounts: coupon ? [{coupon: await createStripeCoupon(coupon.discountPercentage)}] : [],
//         metadata:{
//           userId: req.user._id.toString(),
//           couponCode: couponCode || ''
//         }
//       });

//       if(totalAmount >= 20000){
//         await createNewCoupon(req.user._id)
//       }
//       res.status(200).json({id:session.id, totalAmount: totalAmount/ 100})

//     } catch (error) {
//       console.log("Error in createCheckoutSession:", error.message);
//       res.status(500).json({message: 'Server error hoise', error: error.message});
//     }  
// }
// )

router.post('/checkout-success', protectRoute, checkoutSuccess)


export default router;