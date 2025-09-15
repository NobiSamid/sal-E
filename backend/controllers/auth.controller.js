import { client } from '../lib/redis.js';
import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';

const generateTokens = (userId) => {
  const accessToken = jwt.sign({userId}, process.env.ACCESS_TOKEN_SECRET, {expiresIn:'15m'});
  const refreshToken = jwt.sign({userId}, process.env.REFRESH_SECRET_SECRET, {expiresIn:'7d'});
  return {accessToken, refreshToken};
}

const storeRefreshToken = async (userId, refreshToken) => {
  // Store the refresh token in Redis with the user ID as the key
  await client.set(`refreshToken:${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60); // Set expiration to 7 days 
}

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true, // prevent XSS attacks, cross site scripting
    secure: process.env.NODE_ENV === 'production', // only send cookie over HTTPS
    sameSite: 'Strict', // CSRF protection
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true, // prevent XSS attacks, cross site scripting
    secure: process.env.NODE_ENV === 'production', // only send cookie over HTTPS
    sameSite: 'Strict', // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

export const signup = async (req, res) => {
  const { email, password, name } = req.body;

  try {
    console.log("Incoming body:", req.body);

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ name, email, password });
    console.log("User created:", user);

    const { accessToken, refreshToken } = generateTokens(user._id);
    console.log("Tokens generated");

    await storeRefreshToken(user._id, refreshToken);
    console.log("Refresh token stored");

    setCookies(res, accessToken, refreshToken);

    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      message: 'User created successfully'
    });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: `Internal server error: ${error.message}` });
  }
};

// export const signup = async (req, res) => {
//   const {email, password, name} = req.body;
//   try{
//     const userExists = await User.findOne({email});

//     if(userExists){
//     return res.status(400).json({message:'User already exists'});
//   }
//   const user = await User.create({name, email, password});

//   // authentication 
//   const { accessToken, refreshToken } = generateTokens(user._id)
//   await storeRefreshToken(user._id, refreshToken);
  
//   setCookies(res, accessToken, refreshToken);


//   res.status(201).json({user:{
//     _id: user._id,
//     name: user.name,
//     email: user.email,
//     role: user.role
//   }, message:'User created successfully'});
//   } catch (error){
//     res.status(500).json(`ekhane jhamela ${error.message}`);
//   }
// };

export const login = async (req, res) => {
  res.send('login controller');
}

export const logout = async (req, res) => {
  res.send('logout controller');
}