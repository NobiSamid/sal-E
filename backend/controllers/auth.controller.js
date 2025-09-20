import { client } from '../lib/redis.js';
import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';

const generateTokens = (userId) => {
  const accessToken = jwt.sign({userId}, process.env.ACCESS_TOKEN_SECRET, {expiresIn:'15m'});
  const refreshToken = jwt.sign({userId}, process.env.REFRESH_TOKEN_SECRET, {expiresIn:'7d'});
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
  const {email, password, name} = req.body;
  try{
    const userExists = await User.findOne({email});

    if(userExists){
    return res.status(400).json({message:'User already exists'});
  }
  const user = await User.create({name, email, password});

  // authentication 
  const { accessToken, refreshToken } = generateTokens(user._id)
  await storeRefreshToken(user._id, refreshToken);
  
  setCookies(res, accessToken, refreshToken);


  res.status(201).json({user:{
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  }, message:'User created successfully'});
  } catch (error){
    res.status(500).json(`ekhane jhamela ${error.message}`);
  }
};

export const login = async (req, res) => {
  try{
    const {email, password} = req.body;
    const user = await User.findOne({email});

    if(user && (await user.comparePassword(password))){
      // authentication successful
      const { accessToken, refreshToken } = generateTokens(user._id)
      await storeRefreshToken(user._id, refreshToken);
      setCookies(res, accessToken, refreshToken);

      res.json({user:{
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }, message:'logged in successfully'});
    } else{
      res.status(401).json({message: 'Invalid email or password'});
    }
  } catch (error){
    console.log("error in login controller", error);
    res.status(500).json({message: "Server error hoise", error: error.message});
  }
}

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken){
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      await client.del(`refreshToken:${decoded.userId}`);
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.status(200).json({message: 'Logged out successfully'});
  } catch (error) {
    res.status(500).json({message: "Server error hoise", error: error.message});
  }

}

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const storedToken = await client.get(`refreshToken:${decoded.userId}`);

    if (storedToken !== refreshToken) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    const accessToken = jwt.sign({ userId: decoded.userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.json({message: "Token refreshed successfully"});
  } catch (error) {
    console.log("Error in refresh token:", error);
    res.status(500).json({ message: 'Server e jhamela hoise', error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error){
    res.status(500).json({message: 'Server error hoise', error: error.message});
  }
}