import express from 'express';
import dotenv from 'dotenv';

import authRoute from './routes/auth.route.js';
import { connectDB } from './lib/db.js';

dotenv.config();
const app = express();

console.log(process.env.PORT);
const PORT = process.env.PORT || 5000;

app.use('/api/auth', authRoute);

app.get("/", (req, res) => {
  res.send("Server is working fine");
});

app.listen(PORT, () => {
  console.log('Server is running on http://localhost:' + PORT);

  connectDB();
});