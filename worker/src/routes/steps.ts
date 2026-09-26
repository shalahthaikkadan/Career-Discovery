import { Hono, Handler } from 'hono';
import { Env, RoadmapStep, ChatMessage } from '../types';
import { getSupabase } from '../services/db';
import { getStepDeepDive, getStepChat } from '../services/ai';
import { authenticateAccessToken, getJwtSecret } from '../services/auth';
import { rateLimit } from '../services/rateLimit';

const steps = new Hono<{ Bindings: Env }>();
const MAX_CHAT_BODY_BYTES = 8192;
const MAX_CHAT_TEXT_LENGTH = 4000;

async function getOwner(c: Parameters<Handler<{ Bindings: Env }>>[0], supabase: ReturnType<typeof getSupabase>) {
  return authenticateAccessToken(c.req.header('Authorization'), getJwtSecret(c.env.JWT_SECRET), supabase);
}

const stepDetailHandler: Handler<{ Bindings: Env }> = async (c) => {
  const stepId = parseInt(c.req.param('id') || '', 10);
  if (isNaN(stepId)) {
    return c.json({ error: 'Invalid step ID' }, 400);
  }

  const supabase = getSupabase(c.env);
  const userId = await getOwner(c, supabase);
  if (!userId) return c.json({ detail: 'Authentication credentials were not provided.' }, 401);

  // Fetch step with its parent career and user response answers
  const { data: step, error: stepErr } = await supabase
    .from('api_roadmapstep')
    .select(`
      id, order, title, description, duration, resources, deep_dive, career_id,
      career:api_careersuggestion (
        id, title,
        user_response:api_userresponse (
           id, user_id, answers
        )
      )
    `)
    .eq('id', stepId)
    .maybeSingle();

  if (stepErr || !step) {
    return c.json({ error: 'RoadmapStep not found' }, 404);
  }

  const ownerId = (step.career as any)?.user_response?.user_id;
  if (ownerId !== userId) return c.json({ error: 'RoadmapStep not found' }, 404);

  let deepDive = step.deep_dive;

  // Generate deep dive on demand if it doesn't exist yet
  if (!deepDive) {
    try {
      const careerTitle = (step.career as any)?.title || 'Career Path';
      const userAnswers = (step.career as any)?.user_response?.answers || null;

      deepDive = await getStepDeepDive(
        careerTitle,
        step.title,
        step.description,
        step.duration,
        step.resources || [],
        userAnswers,
        c.env
      );

      // Save deep dive to DB
      await supabase
        .from('api_roadmapstep')
        .update({ deep_dive: deepDive })
        .eq('id', stepId);
    } catch (aiErr: any) {
      console.error('Error generating deep dive:', aiErr);
      return c.json({ error: 'Failed to generate deep dive.' }, 500);
    }
  }

  // Fetch chat messages
  const { data: chatMessages } = await supabase
    .from('api_chatmessage')
    .select('id, sender, text, created_at')
    .eq('step_id', stepId)
    .order('created_at', { ascending: true })
    .limit(100);

  return c.json(
    {
      id: step.id,
      order: step.order,
      title: step.title,
      description: step.description,
      duration: step.duration,
      resources: step.resources || [],
      deep_dive: deepDive,
      chat_messages: chatMessages || [],
    },
    200
  );
};

const stepChatHandler: Handler<{ Bindings: Env }> = async (c) => {
  const stepId = parseInt(c.req.param('id') || '', 10);
  if (isNaN(stepId)) {
    return c.json({ error: 'Invalid step ID' }, 400);
  }

  const supabase = getSupabase(c.env);
  const userId = await getOwner(c, supabase);
  if (!userId) return c.json({ detail: 'Authentication credentials were not provided.' }, 401);

  const contentLength = Number(c.req.header('content-length') || 0);
  if (contentLength > MAX_CHAT_BODY_BYTES) return c.json({ error: 'Request body is too large.' }, 413);

  let body: { text?: unknown };
  try {
    const raw = await c.req.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_CHAT_BODY_BYTES) {
      return c.json({ error: 'Request body is too large.' }, 413);
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return c.json({ error: 'Request body must be a JSON object.' }, 400);
    }
    body = parsed as { text?: unknown };
  } catch {
    return c.json({ error: 'Invalid JSON request body.' }, 400);
  }

  const userText = typeof body.text === 'string' ? body.text.trim() : '';
  if (!userText || userText.length > MAX_CHAT_TEXT_LENGTH) {
    return c.json({ error: 'Message text is required' }, 400);
  }

  // Fetch step with career and user response
  const { data: step, error: stepErr } = await supabase
    .from('api_roadmapstep')
    .select(`
      id, title, description, deep_dive,
      career:api_careersuggestion (
        title,
        user_response:api_userresponse (
         user_id, answers
        )
      )
    `)
    .eq('id', stepId)
    .maybeSingle();

  if (stepErr || !step) {
    return c.json({ error: 'RoadmapStep not found' }, 404);
  }

  const ownerId = (step.career as any)?.user_response?.user_id;
  if (ownerId !== userId) return c.json({ error: 'RoadmapStep not found' }, 404);

  // 1. Fetch chat history (before saving new message)
  const { data: historyData } = await supabase
    .from('api_chatmessage')
    .select('sender, text')
    .eq('step_id', stepId)
    .order('created_at', { ascending: false })
    .limit(50);

  const chatHistory = [...(historyData || [])].reverse() as Array<{ sender: 'user' | 'ai'; text: string }>;

  // 2. Call AI mentor
  try {
    const careerTitle = (step.career as any)?.title || 'Career Path';
    const userAnswers = (step.career as any)?.user_response?.answers || null;

    const aiResponse = await getStepChat(
      careerTitle,
      step.title,
      step.description,
      step.deep_dive || 'No study guide available.',
      chatHistory,
      userText,
      userAnswers,
      c.env
    );

    const now = new Date().toISOString();

    // 3. Save both user message and AI response
    const { error: insertError } = await supabase.from('api_chatmessage').insert([
      {
        step_id: stepId,
        sender: 'user',
        text: userText,
        created_at: now,
      },
      {
        step_id: stepId,
        sender: 'ai',
        text: aiResponse,
        created_at: new Date(Date.now() + 50).toISOString(),
      },
    ]);
    if (insertError) throw new Error('Unable to save chat message.');

    // 4. Return updated chat history
    const { data: updatedHistory } = await supabase
      .from('api_chatmessage')
      .select('id, sender, text, created_at')
      .eq('step_id', stepId)
      .order('created_at', { ascending: true })
      .limit(100);

    return c.json(updatedHistory || [], 200);
  } catch (err: any) {
    console.error('Mentor chat error:', err);
    return c.json({ error: 'Failed to get mentor response.' }, 500);
  }
};

steps.use('*', rateLimit(10, 60_000));

steps.get('/:id', stepDetailHandler);
steps.get('/:id/', stepDetailHandler);

steps.post('/:id/chat', stepChatHandler);
steps.post('/:id/chat/', stepChatHandler);

export default steps;
