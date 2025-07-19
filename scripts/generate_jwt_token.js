import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const userId = '6835ae7f596270f6b43a642d'; // Replace with a valid user ID from your database
const secret = process.env.JWT_SECRET;
const expiresIn = '1d';

const token = jwt.sign({ id: userId }, secret, { expiresIn });

console.log('Generated JWT Token:', token);
