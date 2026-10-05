import dotenv from 'dotenv';

dotenv.config();

export const AI_PROVIDER = 'featherless' as const;

export interface FeatherlessModelSlot {
  family: 'DeepSeek' | 'Kimi' | 'GLM' | 'Default';
  modelId: string;
  configured: boolean;
}

// Runtime-adjustable active model ID (initializes from FEATHERLESS_MODEL env var)
let runtimeSelectedModel: string | null = null;

export function getFeatherlessConfig() {
  const apiKey = (process.env.FEATHERLESS_API_KEY || '').trim();
  const baseUrl = (
    process.env.FEATHERLESS_BASE_URL || 'https://api.featherless.ai/v1'
  )
    .trim()
    .replace(/\/+$/, '');

  const envDefaultModel = (
    process.env.FEATHERLESS_MODEL ||
    process.env.DEFAULT_MODEL ||
    ''
  ).trim();
  const deepseekModel = (process.env.FEATHERLESS_MODEL_DEEPSEEK || '').trim();
  const kimiModel = (process.env.FEATHERLESS_MODEL_KIMI || '').trim();
  const glmModel = (process.env.FEATHERLESS_MODEL_GLM || '').trim();

  const availableModels: FeatherlessModelSlot[] = [
    {
      family: 'Default',
      modelId: envDefaultModel,
      configured: Boolean(envDefaultModel),
    },
    {
      family: 'DeepSeek',
      modelId: deepseekModel,
      configured: Boolean(deepseekModel),
    },
    {
      family: 'Kimi',
      modelId: kimiModel,
      configured: Boolean(kimiModel),
    },
    {
      family: 'GLM',
      modelId: glmModel,
      configured: Boolean(glmModel),
    },
  ];

  const activeModel =
    runtimeSelectedModel ||
    envDefaultModel ||
    deepseekModel ||
    kimiModel ||
    glmModel ||
    null;

  const missingVariables: string[] = [];
  if (!apiKey) {
    missingVariables.push('FEATHERLESS_API_KEY');
  }
  if (!activeModel) {
    missingVariables.push('FEATHERLESS_MODEL');
  }

  let activeModelFamily: 'DeepSeek' | 'Kimi' | 'GLM' | 'Custom' | null = null;
  if (activeModel) {
    const lower = activeModel.toLowerCase();
    if (lower.includes('deepseek') || activeModel === deepseekModel) {
      activeModelFamily = 'DeepSeek';
    } else if (
      lower.includes('kimi') ||
      lower.includes('moonshot') ||
      activeModel === kimiModel
    ) {
      activeModelFamily = 'Kimi';
    } else if (
      lower.includes('glm') ||
      lower.includes('THUDM'.toLowerCase()) ||
      lower.includes('zai') ||
      activeModel === glmModel
    ) {
      activeModelFamily = 'GLM';
    } else {
      activeModelFamily = 'Custom';
    }
  }

  const connected = Boolean(apiKey && activeModel);

  return {
    provider: AI_PROVIDER,
    apiKey,
    baseUrl,
    activeModel,
    activeModelFamily,
    availableModels,
    missingVariables,
    connected,
  };
}

export function setRuntimeFeatherlessModel(modelId: string) {
  const cleaned = modelId.trim();
  if (cleaned) {
    runtimeSelectedModel = cleaned;
  }
}

/**
 * Core system identity establishing Lyner's facilitator role
 */
export const LYNER_SYSTEM_CONSTITUTION = `You are LYNER, a collaborative project-thinking partner, facilitator, and teammate.
You are NOT a generic chatbot.

Your role:
- Help teams turn unclear ideas into clear direction, readable Project DNA, meaningful tasks, and verified progress.
- Understand the current project context, Project DNA, team roles, tasks, recent Pulse, and conversation history.
- Ask sharp, useful questions when key information is missing.
- Detect contradictions between new statements and existing Project DNA or verified research.
- Challenge weak assumptions constructively.
- Help clarify decisions and compare tradeoffs clearly.
- Summarize understanding and suggest concrete next steps.

Strict rules:
- Do NOT agree with everything blindly.
- Do NOT pretend uncertain or undecided information is confirmed fact.
- Do NOT invent project facts, survey numbers, or fake evidence.
- Do NOT claim a task was completed when it was not.
- Do NOT silently overwrite major Project DNA decisions without proposing the change clearly.
- Always respond in valid JSON matching the requested schema.`;

/**
 * Strips <think>...</think> reasoning blocks (used by DeepSeek/Kimi/GLM reasoning models)
 * and extracts the clean JSON object from a model response.
 */
export function extractAndValidateJSON<T>(rawContent: string): T {
  if (!rawContent || typeof rawContent !== 'string') {
    throw new Error('Empty response received from Featherless AI model.');
  }

  // Remove <think>...</think> blocks if present
  const withoutThink = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Remove markdown ```json ... ``` fences if present
  const fenceMatch = withoutThink.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : withoutThink;

  // Attempt direct parse first
  try {
    return JSON.parse(candidate) as T;
  } catch {
    // Fallback: locate first '{' and last '}'
    const firstBrace = candidate.indexOf('{');
    const lastBrace = candidate.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const sliced = candidate.slice(firstBrace, lastBrace + 1);
      return JSON.parse(sliced) as T;
    }
    throw new Error('Model response did not contain valid structured JSON.');
  }
}

/**
 * Executes a structured JSON completion against Featherless AI.
 * Never exposes API keys or authorization headers in error messages.
 */
export async function callFeatherlessJSON<T>(params: {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<T> {
  const config = getFeatherlessConfig();

  if (!config.apiKey) {
    throw new Error(
      'FEATHERLESS_API_KEY is not configured on the server. Please set FEATHERLESS_API_KEY in environment secrets.'
    );
  }

  if (!config.activeModel) {
    throw new Error(
      'FEATHERLESS_MODEL is not configured. Please set FEATHERLESS_MODEL (DeepSeek, Kimi, or GLM model ID) in environment secrets or Settings.'
    );
  }

  const endpoint = `${config.baseUrl}/chat/completions`;

  const requestBody: Record<string, any> = {
    model: config.activeModel,
    messages: [
      {
        role: 'system',
        content: `${LYNER_SYSTEM_CONSTITUTION}\n\n${params.systemPrompt}\n\nIMPORTANT: Return ONLY a valid JSON object. Do not wrap in extra commentary.`,
      },
      {
        role: 'user',
        content: params.userPrompt,
      },
    ],
    temperature: params.temperature ?? 0.35,
    max_tokens: params.maxTokens ?? 2048,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const status = response.status;
    let errorDetail = '';
    try {
      const errJson: any = await response.json();
      errorDetail =
        errJson?.error?.message || errJson?.message || response.statusText;
    } catch {
      errorDetail = response.statusText;
    }
    console.error(
      `[Featherless AI Error] status=${status} model=${config.activeModel} detail=${errorDetail}`
    );
    throw new Error(
      `Featherless AI request failed (${status}): ${
        errorDetail || 'Unable to reach model'
      }`
    );
  }

  const data: any = await response.json();
  const rawText = data?.choices?.[0]?.message?.content || '';

  return extractAndValidateJSON<T>(rawText);
}
