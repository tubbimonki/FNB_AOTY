import dotenv from 'dotenv';
import { createApp } from './app.js';

// Load environment variables from .env (if present). See .env.example.
dotenv.config();

const PORT = process.env.PORT || 4000;

createApp().listen(PORT, () => {
  console.log(`🚀 API server listening on http://localhost:${PORT}`);
});
