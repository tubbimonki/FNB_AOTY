import { Router } from 'express';
import { newsSnapshot } from '../../shared/newsSnapshot.js';

// GET /api/news -> { items, source, feeds, fetchedAt }
// Public, like weather. Never fails: with no news service (tests, NEWS_FEEDS=off)
// or no reachable feed, it answers with the bundled snapshot of real stories.
export function newsRouter({ news }) {
  const router = Router();

  router.get('/', async (req, res) => {
    if (!news) return res.json({ items: newsSnapshot, source: 'snapshot', feeds: {}, fetchedAt: null });
    res.json(await news.getNews());
  });

  return router;
}
