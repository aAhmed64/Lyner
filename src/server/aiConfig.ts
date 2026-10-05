import dotenv from 'dotenv';

dotenv.config();

export const AI_PROVIDER = 'featherless' as const;
export const DEFAULT_FEATHERLESS_FALLBACK_MODEL = 'deepseek-ai/DeepSeek-V3-0324';

export interface FeatherlessModelSlot {
  family: 'DeepSeek' | 'Kimi' | 'GLM' | 'Default';
  modelId: string;
  configured: boolean;
}

// Runtime-adjustable active model ID (also supported per-request for stateless Vercel functions)
let runtimeSelectedModel: string | null = null;

// Sequential request queue so single-instance servers never exceed Featherless concurrency limits
let requestQueue: Promise<any> = Promise.resolve();
let lastRequestFinishedAt = 0;
const MIN_REQUEST_GAP_MS = 300;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function enqueueFeatherlessTask<T>(task: () => Promise<T>): Promise<T> {
  const queued = requestQueue.then(async () => {
    const elapsed = Date.now() - lastRequestFinishedAt;
    if (elapsed < MIN_REQUEST_GAP_MS) {
      await sleep(MIN_REQUEST_GAP_MS - elapsed);
    }
    try {
      return await task();
    } finally {
      lastRequestFinishedAt = Date.now();
    }
  });

  requestQueue = queued.catch(() => undefined);
  return queued;
}

export function getFeatherlessConfig(preferredModelOverride?: string | null) {
  const apiKey = (
    process.env.FEATHERLESS_API_KEY ||
    process.env.VITE_FEATHERLESS_API_KEY ||
    ''
  ).trim();

  const baseUrl = (
    process.env.FEATHERLESS_BASE_URL ||
    process.env.VITE_FEATHERLESS_BASE_URL ||
    'https://api.featherless.ai/v1'
  )
    .trim()
    .replace(/\/+$/, '');

  const envDefaultModel = (
    process.env.FEATHERLESS_MODEL ||
    process.env.DEFAULT_MODEL ||
    process.env.VITE_FEATHERLESS_MODEL ||
    ''
  ).trim();
  const deepseekModel = (
    process.env.FEATHERLESS_MODEL_DEEPSEEK ||
    'deepseek-ai/DeepSeek-V3-0324'
  ).trim();
  const kimiModel = (
    process.env.FEATHERLESS_MODEL_KIMI ||
    'moonshotai/Kimi-K2-Instruct'
  ).trim();
  const glmModel = (
    process.env.FEATHERLESS_MODEL_GLM ||
    'THUDM/GLM-4-32B-0414'
  ).trim();

  const availableModels: FeatherlessModelSlot[] = [
    {
      family: 'Default',
      modelId: envDefaultModel || deepseekModel,
      configured: true,
    },
    {
      family: 'DeepSeek',
      modelId: deepseekModel,
      configured: true,
    },
    {
      family: 'Kimi',
      modelId: kimiModel,
      configured: true,
    },
    {
      family: 'GLM',
      modelId: glmModel,
      configured: true,
    },
  ];

  const activeModel =
    (preferredModelOverride && preferredModelOverride.trim()) ||
    runtimeSelectedModel ||
    envDefaultModel ||
    deepseekModel ||
    kimiModel ||
    glmModel ||
    DEFAULT_FEATHERLESS_FALLBACK_MODEL;

  const missingVariables: string[] = [];
  if (!apiKey) {
    missingVariables.push('FEATHERLESS_API_KEY');
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
      lower.includes('thudm') ||
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
- Always respond in valid JSON matching the requested schema. Do NOT output long <think> chains; output the JSON object directly.`;

/**
 * Strips <think>...</think> reasoning blocks (used by DeepSeek/Kimi/GLM reasoning models)
 * and extracts the clean JSON object from a model response.
 */
export function extractAndValidateJSON<T>(rawContent: string): T {
  if (!rawContent || typeof rawContent !== 'string') {
    throw new Error('Empty response received from Featherless AI model.');
  }

  // Remove closed <think>...</think> blocks if present
  let withoutThink = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // If an unclosed <think> tag exists before JSON starts, strip up to the last '</think>' or '<think>'
  if (withoutThink.includes('<think>')) {
    const afterThink = withoutThink.split('</think>').pop() || withoutThink;
    withoutThink = afterThink.replace(/<think>/gi, '').trim();
  }

  // Remove markdown ```json ... ``` fences if present
  const fenceMatch = withoutThink.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : withoutThink;

  // Attempt direct parse first
  try {
    return JSON.parse(candidate) as T;
  } catch {
    // Fallback: locate outermost '{' and '}'
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
 * Optimized for both persistent servers and Vercel Serverless Functions.
 */
export async function callFeatherlessJSON<T>(params: {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  preferredModel?: string | null;
}): Promise<T> {
  const config = getFeatherlessConfig(params.preferredModel);

  if (!config.apiKey) {
    throw new Error(
      'FEATHERLESS_API_KEY is missing in your deployment environment variables. Add FEATHERLESS_API_KEY in Vercel Project Settings → Environment Variables and redeploy.'
    );
  }

  return enqueueFeatherlessTask(async () => {
    const endpoint = `${config.baseUrl}/chat/completions`;
    // Fast serverless-friendly backoff delays so we stay well within Vercel function timeouts
    const retryBackoffsMs = [900, 1800, 3200];
    let lastErrorDetail = '';
    let lastStatus = 0;

    for (let attempt = 0; attempt <= retryBackoffsMs.length; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 24000);

      try {
        const requestBody: Record<string, any> = {
          model: config.activeModel,
          messages: [
            {
              role: 'system',
              content: `${LYNER_SYSTEM_CONSTITUTION}\n\n${params.systemPrompt}\n\nIMPORTANT: Return ONLY a valid JSON object. Do not wrap in markdown or long <think> blocks.`,
            },
            {
              role: 'user',
              content: params.userPrompt,
            },
          ],
          temperature: params.temperature ?? 0.35,
          max_tokens: params.maxTokens ?? 1600,
        };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data: any = await response.json();
          const msg = data?.choices?.[0]?.message;
          const rawText =
            msg?.content ||
            msg?.reasoning_content ||
            data?.choices?.[0]?.text ||
            '';
          return extractAndValidateJSON<T>(rawText);
        }

        lastStatus = response.status;
        try {
          const errJson: any = await response.json();
          lastErrorDetail =
            errJson?.error?.message || errJson?.message || response.statusText;
        } catch {
          lastErrorDetail = response.statusText;
        }

        const isRetryable =
          lastStatus === 429 ||
          lastStatus === 502 ||
          lastStatus === 503 ||
          lastStatus === 504;

        if (isRetryable && attempt < retryBackoffsMs.length) {
          const waitMs = retryBackoffsMs[attempt];
          console.warn(
            `[Featherless AI] HTTP ${lastStatus} (${lastErrorDetail}). Retrying ${
              attempt + 1
            }/${retryBackoffsMs.length} in ${waitMs}ms...`
          );
          await sleep(waitMs);
          continue;
        }

        break;
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        lastErrorDetail =
          fetchErr?.name === 'AbortError'
            ? `Model ${config.activeModel} timed out. Try switching to a faster non-reasoning model in Settings.`
            : fetchErr?.message || 'Network error contacting Featherless AI';

        if (attempt < retryBackoffsMs.length && fetchErr?.name !== 'AbortError') {
          await sleep(retryBackoffsMs[attempt]);
          continue;
        }
        break;
      }
    }

    console.warn(
      `[Featherless AI Notice] status=${lastStatus} model=${config.activeModel} detail=${lastErrorDetail}`
    );

    if (lastStatus === 429) {
      throw new Error(
        `Featherless AI concurrency/rate limit reached for ${config.activeModel}. Wait a couple seconds and try again.`
      );
    }

    throw new Error(
      `Featherless AI (${config.activeModel}) error${
        lastStatus ? ` [${lastStatus}]` : ''
      }: ${lastErrorDetail || 'Unable to complete request.'}`
    );
  });
}
