import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import githubRoutes from './routes/github.js';
import geminiRoutes from './routes/gemini.js';

//import workflowsRoutes from './routes/workflows.js';

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 👇 Point dotenv *explicitly* at server/.env
dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log('GITHUB_CLIENT_ID from env:', process.env.GITHUB_CLIENT_ID);
console.log('GITHUB_REDIRECT_URI from env:', process.env.GITHUB_REDIRECT_URI);

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aiatl';

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/', authRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/gemini', geminiRoutes);

//app.use('/api/workflows', workflowsRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Frontend URL: ${FRONTEND_URL}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

export default app;

