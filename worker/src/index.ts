import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { Env } from './types';
import auth from './routes/auth';
import questions from './routes/questions';
import assessment from './routes/assessment';
import steps from './routes/steps';
import history from './routes/history';
import seed from './routes/seed';

const app = new Hono<{ Bindings: Env }>();

// Logger
app.use('*', logger());

// Only exact, controlled origins are allowed to make browser requests.
const allowedOrigins = new Set([
  'https://careersea.in',
  'https://www.careersea.in',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

// CORS configuration
app.use(
  '*',
  cors({
    origin: (origin) => {
      return allowedOrigins.has(origin) ? origin : 'https://careersea.in';
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposeHeaders: ['Content-Length'],
    maxAge: 86400,
    credentials: true,
  })
);

app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'no-referrer');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
});

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    service: 'CareerSea Cloudflare Edge API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health/', (c) => {
  return c.json({ status: 'healthy', edge: true });
});

// Mount modular sub-routers (both with and without trailing slash)
app.route('/api', auth);
app.route('/api/', auth);

app.route('/api/questions', questions);
app.route('/api/questions/', questions);

app.route('/api/submit', assessment);
app.route('/api/submit/', assessment);

app.route('/api/steps', steps);
app.route('/api/steps/', steps);

app.route('/api/history', history);
app.route('/api/history/', history);

app.route('/api/seed', seed);
app.route('/api/seed/', seed);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Endpoint not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled Worker Exception:', err);
  return c.json(
    {
      error: 'Internal Server Error',
    },
    500
  );
});

export default app;
