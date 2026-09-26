import { Hono } from 'hono';
import { Env } from '../types';
import { getSupabase } from '../services/db';
import { timingSafeEqual } from '../services/auth';
import { rateLimit } from '../services/rateLimit';

const seed = new Hono<{ Bindings: Env }>();

seed.use('*', rateLimit(3, 60_000));

const defaultQuestions = [
  {
    text: 'What is a topic, hobby, or project that you could talk about or work on for hours without getting bored?',
    order: 1,
    choices: [],
  },
  {
    text: 'If you could solve one big challenge in your community or the world, what would it be?',
    order: 2,
    choices: [],
  },
  {
    text: 'What kinds of activities make you feel most energized (e.g., building/creating things, writing/drawing, teaching/helping others, organizing/planning, researching/analyzing)?',
    order: 3,
    choices: [],
  },
  {
    text: "Any age, experience level, or background context you want us to keep in mind? (Optional, e.g., '14 years old', 'mid-career switcher', 'no coding experience')",
    order: 4,
    choices: [],
  },
];

/**
 * POST /api/seed/
 * Seeds initial assessment questions if not already present
 */
seed.post('/', async (c) => {
  const configuredSecret = c.env.SEED_SECRET;
  const providedSecret = c.req.header('X-Seed-Secret');
  if (!configuredSecret || !providedSecret || !timingSafeEqual(configuredSecret, providedSecret)) {
    return c.json({ error: 'Not found.' }, 404);
  }

  const supabase = getSupabase(c.env);

  const { data: existing } = await supabase
    .from('api_question')
    .select('id, text');

  if (existing && existing.length > 0) {
    return c.json({ message: 'Questions already seeded.', count: existing.length }, 200);
  }

  const { data: inserted, error } = await supabase
    .from('api_question')
    .insert(defaultQuestions)
    .select();

  if (error) {
    console.error('Error seeding questions:', error);
    return c.json({ error: 'Failed to seed questions.' }, 500);
  }

  return c.json({ message: 'Successfully seeded questions.', questions: inserted }, 201);
});

export default seed;
