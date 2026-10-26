import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

// The IP the server thinks you have. After deploying, it should match your
// real IP (search "what is my ip"); if not, TRUST_PROXY is wrong.
router.get('/ip', (req, res) => {
  res.json({ ip: req.ip });
});

export default router;
