import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';import express from 'express';
import cors from 'cors';
import {connectDB} from './config/db.js';
import auth from './routes/auth.js';
import communities from './routes/communities.js';
import events from './routes/events.js';
import registrations from './routes/registrations.js';
import exportsRoute from './routes/exports.js';
import notifications from './routes/notification.js';
import elections from './routes/elections.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app=express();
const uploadDir = path.join(__dirname, '../uploads');
app.use(
  '/uploads',
  express.static(
    path.join(__dirname, '../uploads')
  )
);
app.use(cors({origin:true}));app.use(express.json());
app.get('/',(q,s)=>s.json({message:'CSE Community Hub API is running'}));
app.use('/api/auth',auth);app.use('/api/communities',communities);
app.use('/api/events',events);
app.use('/api/elections', elections);
app.use('/api',registrations);
app.use('/api',exportsRoute);connectDB().then(()=>app.listen(process.env.PORT||5000,()=>console.log(`API running on http://localhost:${process.env.PORT||5000}`))).catch(e=>{console.error(e);process.exit(1)});
app.use('/api/notifications', notifications);
