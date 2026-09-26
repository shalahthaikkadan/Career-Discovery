import { Hono, Handler } from 'hono';
import { Env } from '../types';
import { getSupabase } from '../services/db';
import { hashPassword, verifyPassword, generateTokens, verifyToken, getJwtSecret, getCookie, setRefreshCookie } from '../services/auth';
import { rateLimit } from '../services/rateLimit';

const auth = new Hono<{ Bindings: Env }>();

const MAX_AUTH_BODY_BYTES = 8192;
const MAX_USERNAME_LENGTH = 150;
const MAX_PASSWORD_LENGTH = 1024;

async function readAuthBody(c: Parameters<Handler<{ Bindings: Env }>>[0]) {
  const contentLength = Number(c.req.header('content-length') || 0);
  if (contentLength > MAX_AUTH_BODY_BYTES) return null;

  const raw = await c.req.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_AUTH_BODY_BYTES) return null;

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

const registerHandler: Handler<{ Bindings: Env }> = async (c) => {
  const body = await readAuthBody(c);
  if (!body) return c.json({ error: 'Invalid or oversized request body.' }, 400);

  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!username || !password || username.length > MAX_USERNAME_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return c.json({ error: 'Username and password are required.' }, 400);
  }

  if (password.length < 12) {
    return c.json({ password: ['Password must be at least 12 characters long.'] }, 400);
  }

  if (email.length > 254 || (email && !/^\S+@\S+\.\S+$/.test(email))) {
    return c.json({ email: ['Enter a valid email address.'] }, 400);
  }

  const supabase = getSupabase(c.env);

  // Check if username already exists
  const { data: existingUser } = await supabase
    .from('auth_user')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (existingUser) {
    return c.json({ username: ['A user with that username already exists.'] }, 400);
  }

  // Hash password with Django-compatible PBKDF2-SHA256
  const hashedPassword = await hashPassword(password);
  const now = new Date().toISOString();

  const { data: newUser, error: insertError } = await supabase
    .from('auth_user')
    .insert([
      {
        username,
        email,
        password: hashedPassword,
        is_superuser: false,
        is_staff: false,
        is_active: true,
        date_joined: now,
        first_name: '',
        last_name: '',
      },
    ])
    .select('id, username, email')
    .single();

  if (insertError) {
    console.error('Registration insert error:', insertError);
    return c.json({ error: 'Failed to create user account.' }, 500);
  }

  return c.json({ username: newUser.username, email: newUser.email }, 201);
};

const tokenHandler: Handler<{ Bindings: Env }> = async (c) => {
  const body = await readAuthBody(c);
  if (!body) return c.json({ detail: 'Invalid or oversized request body.' }, 400);

  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!username || !password || username.length > MAX_USERNAME_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return c.json({ detail: 'No active account found with the given credentials' }, 401);
  }

  const supabase = getSupabase(c.env);

  const { data: user, error: fetchError } = await supabase
    .from('auth_user')
    .select('id, username, password, is_active')
    .eq('username', username)
    .eq('is_active', true)
    .maybeSingle();

  if (fetchError || !user) {
    return c.json({ detail: 'No active account found with the given credentials' }, 401);
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return c.json({ detail: 'No active account found with the given credentials' }, 401);
  }

  // Update last_login
  await supabase
    .from('auth_user')
    .update({ last_login: new Date().toISOString() })
    .eq('id', user.id);

  const jwtSecret = getJwtSecret(c.env.JWT_SECRET);
  const tokens = await generateTokens(user.id, user.username, jwtSecret);
  setRefreshCookie(c, tokens.refresh);

  return c.json({ access: tokens.access }, 200);
};

const refreshHandler: Handler<{ Bindings: Env }> = async (c) => {
  const refreshToken = getCookie(c.req.header('Cookie'), 'refresh_token');

  if (!refreshToken) {
    return c.json({ detail: 'Refresh token required' }, 400);
  }

  const jwtSecret = getJwtSecret(c.env.JWT_SECRET);
  const payload = await verifyToken(refreshToken, jwtSecret);

  if (!payload || payload.token_type !== 'refresh') {
    return c.json({ detail: 'Token is invalid or expired', code: 'token_not_valid' }, 401);
  }

  const supabase = getSupabase(c.env);
  const { data: user, error } = await supabase
    .from('auth_user')
    .select('id, username, is_active')
    .eq('id', payload.user_id)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !user || user.username !== payload.username) {
    return c.json({ detail: 'Token is invalid or expired', code: 'token_not_valid' }, 401);
  }

  // Generate new token pair
  const tokens = await generateTokens(payload.user_id, payload.username, jwtSecret);
  setRefreshCookie(c, tokens.refresh);

  return c.json({ access: tokens.access }, 200);
};

const logoutHandler: Handler<{ Bindings: Env }> = async (c) => {
  setRefreshCookie(c, null);
  return c.json({ detail: 'Logged out.' }, 200);
};

auth.use('/register', rateLimit(5, 60_000));
auth.use('/register/', rateLimit(5, 60_000));
auth.use('/token', rateLimit(10, 60_000));
auth.use('/token/', rateLimit(10, 60_000));
auth.use('/token/refresh', rateLimit(10, 60_000));
auth.use('/token/refresh/', rateLimit(10, 60_000));
auth.use('/token/logout', rateLimit(10, 60_000));
auth.use('/token/logout/', rateLimit(10, 60_000));

auth.post('/register', registerHandler);
auth.post('/register/', registerHandler);

auth.post('/token', tokenHandler);
auth.post('/token/', tokenHandler);

auth.post('/token/refresh', refreshHandler);
auth.post('/token/refresh/', refreshHandler);
auth.post('/token/logout', logoutHandler);
auth.post('/token/logout/', logoutHandler);

export default auth;
