//import serverless from 'serverless-http';
import app from '../../index.js';
import { Handler } from '@netlify/functions'; // native Netlify handler (preferred)



export const handler = Handler(app);
