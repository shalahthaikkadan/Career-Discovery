import { Hono } from 'hono';
import { Env, CareerSuggestion, RoadmapStep } from '../types';
import { getSupabase } from '../services/db';
import { authenticateAccessToken, getJwtSecret } from '../services/auth';
import { getCareerSuggestions } from '../services/ai';
import { rateLimit } from '../services/rateLimit';

const assessment = new Hono<{ Bindings: Env }>();
const MAX_BODY_BYTES = 16 * 1024;
const MAX_ANSWERS = 20;
const MAX_ANSWER_LENGTH = 2000;

assessment.use('*', rateLimit(5, 60_000));

/**
 * POST /api/submit/
 * Processes user assessment answers, invokes AI engine, and saves roadmaps
 */
assessment.post('/', async (c) => {
  const contentLength = Number(c.req.header('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return c.json({ error: 'Request body is too large.' }, 413);
  }

  let body: { answers?: Record<string, unknown> };
  try {
    const raw = await c.req.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
      return c.json({ error: 'Request body is too large.' }, 413);
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return c.json({ error: 'Request body must be a JSON object.' }, 400);
    }
    body = parsed as { answers?: Record<string, unknown> };
  } catch {
    return c.json({ error: 'Invalid JSON request body.' }, 400);
  }

  const answers = body.answers;

  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return c.json({ answers: ['This field is required.'] }, 400);
  }

  const answerEntries = Object.entries(answers);
  if (answerEntries.length > MAX_ANSWERS || answerEntries.some(([key, value]) =>
    key.length > 255 || (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') ||
    (typeof value === 'string' && value.length > MAX_ANSWER_LENGTH)
  )) {
    return c.json({ answers: ['Answers are invalid or too large.'] }, 400);
  }

  const supabase = getSupabase(c.env);

  // Optional authentication check
  let userId: number | null = null;
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const jwtSecret = getJwtSecret(c.env.JWT_SECRET);
    userId = await authenticateAccessToken(authHeader, jwtSecret, supabase);
    if (!userId) {
      return c.json({ detail: 'Token is invalid or expired.' }, 401);
    }
  }

  const now = new Date().toISOString();

  try {
    // 1. Save UserResponse
    const { data: userResponse, error: respError } = await supabase
      .from('api_userresponse')
      .insert([
        {
          answers,
          user_id: userId,
          created_at: now,
        },
      ])
      .select('id, answers, created_at')
      .single();

    if (respError || !userResponse) {
      console.error('Error saving user response:', respError);
      return c.json({ error: 'Failed to initialize assessment response.' }, 500);
    }

    // 2. Call AI Service
    const suggestionDataList = await getCareerSuggestions(answers, c.env);

    const savedSuggestions: CareerSuggestion[] = [];

    // 3. Save CareerSuggestions and RoadmapSteps
    for (const suggestionData of suggestionDataList) {
      const careerData = suggestionData.career || {};
      const roadmapData = suggestionData.roadmap || [];
      const pathType = suggestionData.type || 'mainstream';

      const { data: suggestionRecord, error: suggError } = await supabase
        .from('api_careersuggestion')
        .insert([
          {
            user_response_id: userResponse.id,
            title: careerData.title || 'Unknown Career',
            type: pathType,
            description: careerData.description || '',
            reasoning: careerData.reasoning || '',
          },
        ])
        .select('id, title, type, description, reasoning')
        .single();

      if (suggError || !suggestionRecord) {
        console.error('Error saving career suggestion:', suggError);
        continue;
      }

      const stepsToInsert = roadmapData.map((step: any, index: number) => ({
        career_id: suggestionRecord.id,
        title: step.title || '',
        description: step.description || '',
        duration: step.duration || '',
        resources: Array.isArray(step.resources) ? step.resources : [],
        order: index + 1,
        deep_dive: null,
      }));

      let savedSteps: RoadmapStep[] = [];
      if (stepsToInsert.length > 0) {
        const { data: insertedSteps, error: stepError } = await supabase
          .from('api_roadmapstep')
          .insert(stepsToInsert)
          .select('id, order, title, description, duration, resources, deep_dive');

        if (!stepError && insertedSteps) {
          savedSteps = insertedSteps.map((s) => ({
            ...s,
            chat_messages: [],
          }));
        } else {
          console.error('Error saving roadmap steps:', stepError);
        }
      }

      savedSuggestions.push({
        id: suggestionRecord.id,
        title: suggestionRecord.title,
        type: suggestionRecord.type,
        description: suggestionRecord.description,
        reasoning: suggestionRecord.reasoning,
        roadmap_steps: savedSteps,
      });
    }

    return c.json(
      {
        id: userResponse.id,
        answers: userResponse.answers,
        created_at: userResponse.created_at,
        suggestions: savedSuggestions,
      },
      201
    );
  } catch (err: any) {
    console.error('Assessment submission error:', err);
    return c.json(
      { error: 'Assessment processing failed.' },
      500
    );
  }
});

export default assessment;
