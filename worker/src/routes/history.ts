import { Hono } from 'hono';
import { Env, UserResponse, CareerSuggestion, RoadmapStep } from '../types';
import { getSupabase } from '../services/db';
import { authenticateAccessToken, getJwtSecret } from '../services/auth';

const history = new Hono<{ Bindings: Env }>();

/**
 * GET /api/history/
 * Returns all past assessments and roadmaps for the authenticated user
 */
history.get('/', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ detail: 'Authentication credentials were not provided.' }, 401);
  }

  const supabase = getSupabase(c.env);
  const userId = await authenticateAccessToken(authHeader, getJwtSecret(c.env.JWT_SECRET), supabase);

  if (!userId) {
    return c.json({ detail: 'Given token not valid for any token type', code: 'token_not_valid' }, 401);
  }

  // Fetch all user responses for this user
  const { data: responses, error: respErr } = await supabase
    .from('api_userresponse')
    .select('id, answers, created_at')
    .eq('user_id', userId)
    .range(0, 49)
    .order('created_at', { ascending: false });

  if (respErr) {
    console.error('Error fetching history:', respErr);
    return c.json({ error: 'Failed to fetch history' }, 500);
  }

  if (!responses || responses.length === 0) {
    return c.json([], 200);
  }

  const responseIds = responses.map((r) => r.id);

  // Fetch suggestions for these responses
  const { data: suggestionsData } = await supabase
    .from('api_careersuggestion')
    .select('id, user_response_id, title, type, description, reasoning')
    .in('user_response_id', responseIds);

  const suggestions = suggestionsData || [];
  const suggestionIds = suggestions.map((s) => s.id);

  // Fetch roadmap steps for these suggestions
  let steps: any[] = [];
  if (suggestionIds.length > 0) {
    const { data: stepsData } = await supabase
      .from('api_roadmapstep')
      .select('id, career_id, order, title, description, duration, resources, deep_dive')
      .in('career_id', suggestionIds)
      .order('order', { ascending: true });
    steps = stepsData || [];
  }

  // Assemble nested response structure
  const result: UserResponse[] = responses.map((resp) => {
    const matchingSuggestions = suggestions
      .filter((s) => s.user_response_id === resp.id)
      .map((s) => {
        const matchingSteps: RoadmapStep[] = steps
          .filter((st) => st.career_id === s.id)
          .map((st) => ({
            id: st.id,
            order: st.order,
            title: st.title,
            description: st.description,
            duration: st.duration,
            resources: st.resources || [],
            deep_dive: st.deep_dive,
            chat_messages: [],
          }));

        return {
          id: s.id,
          title: s.title,
          type: s.type,
          description: s.description,
          reasoning: s.reasoning,
          roadmap_steps: matchingSteps,
        };
      });

    return {
      id: resp.id,
      answers: resp.answers,
      created_at: resp.created_at,
      suggestions: matchingSuggestions,
    };
  });

  return c.json(result, 200);
});

export default history;
