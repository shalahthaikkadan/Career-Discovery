import { Hono } from 'hono';
import { Env, Question } from '../types';
import { getSupabase } from '../services/db';

const questions = new Hono<{ Bindings: Env }>();

/**
 * GET /api/questions/
 * Returns all diagnostic assessment questions
 */
questions.get('/', async (c) => {
  const supabase = getSupabase(c.env);

  const { data, error } = await supabase
    .from('api_question')
    .select('id, text, order, choices')
    .order('order', { ascending: true });

  if (error) {
    console.error('Error fetching questions:', error);
    return c.json({ error: 'Failed to fetch questions.' }, 500);
  }

  return c.json(data || [], 200);
});

export default questions;
