import { Env } from '../types';

export function extractAgeGroup(userAnswers?: Record<string, any> | null): string {
  if (!userAnswers) return 'Not specified';
  for (const [key, value] of Object.entries(userAnswers)) {
    if (key.toLowerCase().includes('context') || key.toLowerCase().includes('age')) {
      if (value && String(value).trim()) {
        return String(value).trim();
      }
    }
  }
  return 'Not specified';
}

export function buildAssessmentPrompt(answers: Record<string, any>): string {
  const customExplore = answers.custom_explore;
  const softContext = extractAgeGroup(answers);

  if (customExplore) {
    return `
You are a professional career counselor and guidance coach.
The user wants to explore the career field of "${customExplore}".

Any age, experience level, or background context provided: "${softContext}"
If a specific age or experience level is mentioned in the context above (e.g. 14 years old, junior, no experience), you MUST tailor the resources and the difficulty of the roadmap steps to be developmentally appropriate for that level. Otherwise, default to standard professional career steps.

Suggest THREE distinct sub-avenues, specializations, or related pathways within or adjacent to "${customExplore}". You must structure them as follows:
1. "mainstream": The most conventional professional path or direct route within this field (e.g. for "Space Architect", designing lunar/Mars habitats).
2. "adjacent": A different discipline or industry that heavily leverages this field's skills (e.g. for "Space Architect", designing extreme-environment underwater habitats on Earth).
3. "wildcard": An emerging, future-oriented, or highly unconventional role that most people wouldn't associate with this field (e.g. for "Space Architect", designing virtual-reality physics engines or space tourism experiences).

CRITICAL PATH DIVERGENCE RULE: The three paths MUST be completely different disciplines or specializations. Do not suggest career levels, seniority levels, or promotional tiers (e.g. Junior developer -> Senior developer -> Tech lead) as different paths. They must represent parallel, divergent avenues.

For each path, provide a highly detailed, step-by-step roadmap to explore and prepare for it.

CRITICAL INSTRUCTION 1: Each roadmap must consist of at least 4-5 progressive milestones/steps. Map out a thorough journey from starting out with zero knowledge to professional mastery and job readiness.
CRITICAL INSTRUCTION 2: Each step's description must be extremely detailed, concrete, and rich (at least 3-5 sentences long). Provide specific sub-tasks, methodologies, tools/libraries to learn, and concrete projects they should build.
CRITICAL INSTRUCTION 3: For each step, provide 3-4 highly specific, real-world learning resources, official documentation links, books, or online courses. Avoid general descriptions.

Return the output in the following STRICT JSON format (no markdown, no other text):
[
  {
    "type": "mainstream",
    "career": {
      "title": "Mainstream Specialization Title",
      "description": "Inspiring description of this career avenue",
      "reasoning": "Why this is a compelling mainstream specialization within the field"
    },
    "roadmap": [
      {
        "title": "Detailed Step Title",
        "description": "Detailed actionable instructions, concrete sub-tasks, and projects to build.",
        "duration": "e.g., 2 months",
        "resources": [
          "Resource 1 Link/Name",
          "Resource 2 Link/Name"
        ]
      }
    ]
  },
  {
    "type": "adjacent",
    "career": {
      "title": "Adjacent Discipline Title",
      "description": "Inspiring description of this adjacent path",
      "reasoning": "Why this is a compelling adjacent avenue"
    },
    "roadmap": [
      {
        "title": "Detailed Step Title",
        "description": "Detailed actionable instructions, concrete sub-tasks, and projects to build.",
        "duration": "e.g., 2 months",
        "resources": [
          "Resource 1 Link/Name",
          "Resource 2 Link/Name"
        ]
      }
    ]
  },
  {
    "type": "wildcard",
    "career": {
      "title": "Wildcard Pathway Title",
      "description": "Inspiring description of this wildcard path",
      "reasoning": "Why this is a compelling wildcard option"
    },
    "roadmap": [
      {
        "title": "Detailed Step Title",
        "description": "Detailed actionable instructions, concrete sub-tasks, and projects to build.",
        "duration": "e.g., 2 months",
        "resources": [
          "Resource 1 Link/Name",
          "Resource 2 Link/Name"
        ]
      }
    ]
  }
]
`.trim();
  } else {
    return `
You are a professional career counselor and guidance coach.
Based on the following open-ended responses, suggest THREE distinct career avenues that match the user's natural curiosities, values, and energy drivers:
1. "mainstream": The most conventional professional path or direct route that aligns with their stated interests/skills.
2. "adjacent": A different discipline or industry that heavily leverages similar skills or traits.
3. "wildcard": An emerging, future-oriented, or highly unconventional role that matches their implicit strengths but represents an unexpected direction.

CRITICAL PATH DIVERGENCE RULE: The three paths MUST be completely different careers. Do not suggest career levels, seniority levels, or promotional tiers (e.g. Junior developer -> Senior developer) as different paths. They must represent parallel, divergent avenues.

Any age, experience level, or background context provided: "${softContext}"
If a specific age or experience level is mentioned in the context above (e.g. 14 years old, junior, no experience), you MUST tailor the resources and the difficulty of the roadmap steps to be developmentally appropriate for that level. Otherwise, default to standard professional career steps.

For each path, provide a highly detailed, step-by-step roadmap to explore and prepare for it.

CRITICAL INSTRUCTION 1: Each roadmap must consist of at least 4-5 progressive milestones/steps. Map out a thorough journey from starting out with zero knowledge to professional mastery and job readiness.
CRITICAL INSTRUCTION 2: Each step's description must be extremely detailed, concrete, and rich (at least 3-5 sentences long). Provide specific sub-tasks, methodologies, tools/libraries to learn, and concrete projects they should build.
CRITICAL INSTRUCTION 3: For each step, provide 3-4 highly specific, real-world learning resources, official documentation links, books, or online courses. Avoid general descriptions.

User Responses:
${JSON.stringify(answers, null, 2)}

Return the output in the following STRICT JSON format (no markdown, no other text):
[
  {
    "type": "mainstream",
    "career": {
      "title": "Mainstream Career Title",
      "description": "Inspiring description of the career",
      "reasoning": "Why this matches the user's profile"
    },
    "roadmap": [
      {
        "title": "Detailed Step Title",
        "description": "Detailed actionable instructions, concrete sub-tasks, and projects to build.",
        "duration": "e.g., 2 months",
        "resources": [
          "Resource 1 Link/Name",
          "Resource 2 Link/Name"
        ]
      }
    ]
  },
  {
    "type": "adjacent",
    "career": {
      "title": "Adjacent Career Title",
      "description": "Inspiring description of this adjacent career",
      "reasoning": "Why this is a compelling adjacent avenue"
    },
    "roadmap": [
      {
        "title": "Detailed Step Title",
        "description": "Detailed actionable instructions, concrete sub-tasks, and projects to build.",
        "duration": "e.g., 2 months",
        "resources": [
          "Resource 1 Link/Name",
          "Resource 2 Link/Name"
        ]
      }
    ]
  },
  {
    "type": "wildcard",
    "career": {
      "title": "Wildcard Career Title",
      "description": "Inspiring description of this wildcard career",
      "reasoning": "Why this is a compelling wildcard option"
    },
    "roadmap": [
      {
        "title": "Detailed Step Title",
        "description": "Detailed actionable instructions, concrete sub-tasks, and projects to build.",
        "duration": "e.g., 2 months",
        "resources": [
          "Resource 1 Link/Name",
          "Resource 2 Link/Name"
        ]
      }
    ]
  }
]
`.trim();
  }
}

export function buildDeepDivePrompt(
  careerTitle: string,
  stepTitle: string,
  stepDescription: string,
  duration: string,
  resources: string[],
  userAnswers?: Record<string, any> | null
): string {
  const resourcesStr = resources && resources.length > 0 ? resources.join(', ') : 'None provided';
  const ageGroup = extractAgeGroup(userAnswers);

  return `
You are a supportive senior mentor and youth career coach in the field of "${careerTitle}".
You are helping a student in the age group of "${ageGroup}" master this specific roadmap step:
Step Title: ${stepTitle}
Description: ${stepDescription}
Estimated Duration: ${duration}
Key Resources: ${resourcesStr}

Your guide should be structured, practical, and highly motivating, written in an encouraging, inspiring, and age-appropriate tone. Write in clean Markdown format. You must cover the following sections:
1.  **Core Concepts to Master**: Break down this step into 3-4 essential technical concepts or skills the user must learn. Explain what each is and why it's important. Ensure the level of depth is appropriate for "${ageGroup}".
2.  **Weekly Study Plan / Milestones**: Suggest a timeline or progressive milestones (e.g., Week 1-2, Week 3-4, etc.) to cover this step within the ${duration} timeframe.
3.  **Hands-on Project to Build**: Propose one specific, concrete mini-project the user should build to prove they have mastered this step. Make sure the project scale and difficulty fit the "${ageGroup}" category (e.g., simpler, visual, or play-based projects for younger kids; more advanced, structured projects for older teens). Give it a title, a brief description, and a list of key features.
4.  **Advanced Resources & Communities**: Suggest 2-3 additional age-appropriate learning materials, documentation links, or communities where they can get help.

Write in a direct, encouraging, Neubrutalist-adjacent style (bold headings, no fluff, extremely actionable).
`.trim();
}

export function buildChatPrompt(
  careerTitle: string,
  stepTitle: string,
  stepDescription: string,
  deepDive: string,
  chatHistory: Array<{ sender: 'user' | 'ai'; text: string }>,
  newMessage: string,
  userAnswers?: Record<string, any> | null
): string {
  let historyStr = '';
  for (const msg of chatHistory) {
    const role = msg.sender === 'user' ? 'Student' : 'AI Mentor';
    historyStr += `${role}: ${msg.text}\n`;
  }

  const ageGroup = extractAgeGroup(userAnswers);

  return `
You are an encouraging, supportive senior mentor and youth career coach in the field of "${careerTitle}".
You are helping a student who is in the age group of "${ageGroup}" master this roadmap step:
Step Title: ${stepTitle}
Step Description: ${stepDescription}

Here is the detailed study guide for this step:
${deepDive}

Below is the chat history of your conversation so far:
${historyStr}
Student: ${newMessage}

Provide a helpful, direct, encouraging, and age-appropriate response to the student's message. Stay strictly in character as an inspiring, supportive mentor. Keep your vocabulary, examples, and tone perfectly suited for a student in the "${ageGroup}" age group (e.g., more visual/intuitive explanations for younger kids, more structured/detailed technical terms for high schoolers). Write in clean Markdown format. Keep your response concise (1-3 paragraphs) and focused, providing simple code snippets, visual analogies, or library names if requested. Avoid generic filler.
`.trim();
}

function parseJsonResponse(content: string): any {
  let raw = content.trim();
  if (raw.includes('```json')) {
    raw = raw.split('```json')[1].split('```')[0];
  } else if (raw.includes('```')) {
    raw = raw.split('```')[1].split('```')[0];
  }
  return JSON.parse(raw.trim());
}

/**
 * Calls Google AI Studio Gemini API
 */
async function callAIStudio(
  prompt: string,
  apiKey: string,
  model = 'gemini-3.1-flash-lite',
  systemInstruction = 'You are a helpful and inspiring career coach.'
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
      },
    }),
  });

  if (!res.ok) {
    console.error('Google AI Studio request failed:', res.status);
    throw new Error('AI provider request failed.');
  }

  const data: any = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Calls OpenRouter API
 */
async function callOpenRouter(
  prompt: string,
  apiKey: string,
  model = 'google/gemini-2.0-flash-001',
  systemInstruction = 'You are a helpful and inspiring career coach.'
): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://careersea.in',
      'X-Title': 'CareerSea',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    console.error('OpenRouter request failed:', res.status);
    throw new Error('AI provider request failed.');
  }

  const data: any = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Dispatches text generation based on configured provider
 */
export async function generateContent(
  prompt: string,
  env: Env,
  systemInstruction?: string
): Promise<string> {
  const provider = (env.AI_PROVIDER || 'aistudio').toLowerCase();

  if (provider === 'aistudio') {
    if (!env.AISTUDIO_API_KEY) {
      throw new Error('AISTUDIO_API_KEY environment variable is not configured.');
    }
    const model = env.AISTUDIO_MODEL || 'gemini-3.1-flash-lite';
    return await callAIStudio(prompt, env.AISTUDIO_API_KEY, model, systemInstruction);
  } else if (provider === 'openrouter') {
    if (!env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY environment variable is not configured.');
    }
    const model = env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001';
    return await callOpenRouter(prompt, env.OPENROUTER_API_KEY, model, systemInstruction);
  } else {
    throw new Error(`Unsupported AI_PROVIDER: ${provider}. Use 'aistudio' or 'openrouter'.`);
  }
}

/**
 * Generates Career Suggestions & Roadmaps as structured JSON
 */
export async function getCareerSuggestions(answers: Record<string, any>, env: Env): Promise<any[]> {
  const prompt = buildAssessmentPrompt(answers);
  const text = await generateContent(prompt, env, 'You are a helpful and inspiring career coach.');
  const parsed = parseJsonResponse(text);
  return Array.isArray(parsed) ? parsed : [parsed];
}

/**
 * Generates on-demand deep dive study guide for a roadmap step
 */
export async function getStepDeepDive(
  careerTitle: string,
  stepTitle: string,
  stepDescription: string,
  duration: string,
  resources: string[],
  userAnswers: Record<string, any> | undefined | null,
  env: Env
): Promise<string> {
  const prompt = buildDeepDivePrompt(careerTitle, stepTitle, stepDescription, duration, resources, userAnswers);
  return await generateContent(prompt, env, 'You are a helpful and inspiring senior mentor.');
}

/**
 * Generates interactive AI mentor chat reply for a roadmap step
 */
export async function getStepChat(
  careerTitle: string,
  stepTitle: string,
  stepDescription: string,
  deepDive: string,
  chatHistory: Array<{ sender: 'user' | 'ai'; text: string }>,
  newMessage: string,
  userAnswers: Record<string, any> | undefined | null,
  env: Env
): Promise<string> {
  const prompt = buildChatPrompt(careerTitle, stepTitle, stepDescription, deepDive, chatHistory, newMessage, userAnswers);
  return await generateContent(prompt, env, 'You are a helpful and inspiring senior mentor.');
}
