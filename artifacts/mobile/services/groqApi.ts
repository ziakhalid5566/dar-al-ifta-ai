/**
 * Groq API service — proxies through api-server so the key stays server-side.
 * Includes retry logic and user-friendly error messages.
 */

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;

// Startup check: EXPO_PUBLIC_DOMAIN is baked into the bundle at build time.
// If it is missing, all API calls will build a broken URL ("https://undefined/api/groq").
// This logs a clear error so the problem is visible in the device logs.
if (!DOMAIN) {
  console.error(
    '[Dar Al-Ifta] CRITICAL: EXPO_PUBLIC_DOMAIN is not set. ' +
    'All chat and fatwa API calls will fail. ' +
    'Set this env var before building (EAS secret or .env file). ' +
    'See eas.json for the required env section.',
  );
}

const API_BASE = DOMAIN
  ? `https://${DOMAIN}/api/groq`
  : null; // null means all calls will return a friendly error

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

// ─── Error handling helpers ──────────────────────────────────────────────────

function friendlyError(status: number, serverMsg?: string): string {
  if (serverMsg && serverMsg.includes('GROQ_API_KEY')) {
    return 'Server configuration error. Please contact the administrator.';
  }
  switch (status) {
    case 0:
      return 'Network error — check your internet connection and try again.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
    case 502:
    case 503:
      return 'AI service is temporarily unavailable. Please try again shortly.';
    case 504:
      return 'Request timed out. Please try again.';
    default:
      return serverMsg ?? `Unexpected error (HTTP ${status}). Please try again.`;
  }
}

async function apiPost<T>(path: string, body: unknown, attempt = 1): Promise<T> {
  // Guard: fail fast if the domain was never set at build time
  if (!API_BASE) {
    throw new Error(
      'API server not configured. Please reinstall the app built with the correct backend URL.',
    );
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (networkErr) {
    // Retry once on network failure
    if (attempt === 1) {
      await new Promise((r) => setTimeout(r, 1500));
      return apiPost<T>(path, body, 2);
    }
    throw new Error('Network error — check your internet connection and try again.');
  }

  if (!response.ok) {
    let serverMsg: string | undefined;
    try {
      const json = (await response.json()) as { error?: string };
      serverMsg = json.error;
    } catch (_) {
      // ignore parse error
    }
    throw new Error(friendlyError(response.status, serverMsg));
  }

  return response.json() as Promise<T>;
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function sendChatMessage(
  messages: ChatMessage[],
  isMultiAgent = false,
  language = 'auto',
): Promise<string> {
  const data = await apiPost<{ content: string }>('/chat', {
    messages,
    isMultiAgent,
    language,
  });
  return data.content;
}

export async function sendAgentMessage(
  agentId: string,
  agentName: string,
  specialty: string,
  messages: ChatMessage[],
  language = 'auto',
): Promise<string> {
  const data = await apiPost<{ content: string }>('/agent', {
    agentId,
    agentName,
    specialty,
    messages,
    language,
  });
  return data.content;
}

/** Fetch comprehensive fatwa research for a given question */
export async function getFatwaResearch(
  question: string,
  category: string,
  language = 'auto',
): Promise<string> {
  const data = await apiPost<{ content: string }>('/fatwa', {
    question,
    category,
    language,
  });
  return data.content;
}
