import express from 'express';
import dotenv from 'dotenv';

// Load environment variables from .env (if present)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Simple health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 API server listening on http://localhost:${PORT}`);
});
