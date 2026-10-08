// The Worker in front of the site. Everything is still served as static files
// from dist/; only /api/* reaches this code (see wrangler.jsonc).
//
//   POST /api/quiz    the nine quiz answers and a reCAPTCHA token in, a read
//                     of the answers written by Claude out
//   GET  /api/health  whether the two secrets are set. Says yes or no, never
//                     the values.
//   GET  /api/stamp   the time and the visitor's IP address, recorded with an
//                     onboarding form's acceptance of the terms
//
// One quiz request works like this:
//
//   1. The answers are checked against quiz.json. Only the quiz's own option
//      ids are accepted, never free text, so nothing a visitor types reaches
//      the model.
//   2. The reCAPTCHA v3 token is checked with Google, using the secret key.
//      A failed check stops here. Nothing has been sent to Claude.
//   3. Claude reads the answers against the product list and replies in a
//      fixed shape: it can pick only from the ids it was given. Names, cases
//      and prices on the page come from the site's own content.
//
// If any step fails the page keeps the result it worked out itself
// (src/lib/quiz.ts), so the quiz never ends on an error.
//
// Secrets, set by a person in the Cloudflare dashboard (Settings, Variables
// and Secrets) and never written in this project:
//   ANTHROPIC_API_KEY   from the Claude Console, made inside a workspace
//   RECAPTCHA_SECRET    the reCAPTCHA v3 secret key
import Anthropic from '@anthropic-ai/sdk';
import quiz from './content/quiz.json';
import productsJson from './content/products.json';
import servicesJson from './content/services.json';
import site from './content/site.json';

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  ANTHROPIC_API_KEY?: string;
  /** Only for an API key that is not tied to one workspace: the workspace to bill. */
  ANTHROPIC_WORKSPACE_ID?: string;
  RECAPTCHA_SECRET?: string;
  /** Accepted as another name for RECAPTCHA_SECRET. */
  RECAPTCHA_SECRET_KEY?: string;
  QUIZ_LIMIT?: { limit(options: { key: string }): Promise<{ success: boolean }> };
}

export type Answers = Record<string, string[]>;

/** What the page gets back. Ids only: the page writes the names. */
export interface Advice {
  read: string;
  picks: { product: string; why: string; tools: string[] }[];
  firstStep: string;
}

const MODEL = 'claude-opus-5-5';
const MAX_PICKS = quiz.sizing.maxItems;
const MIN_SCORE = 0.5;
/** The reCAPTCHA action the page asks for. A token for another action is refused. */
const QUIZ_ACTION = 'quiz_result';

const items = productsJson.items.filter((item) => site.demo || !item.demo);
const serviceOf = (practice: string) => servicesJson.find((s) => s.practice === practice);
const toolNames = servicesJson.flatMap((s) => s.products.map((p) => p.name));

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

/* ---------- 1. The answers ---------- */
function checkAnswers(input: unknown): Answers | null {
  if (!input || typeof input !== 'object') return null;
  const given = input as Record<string, unknown>;
  const out: Answers = {};
  for (const q of quiz.questions) {
    const ids = given[q.id];
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > q.options.length) return null;
    if (new Set(ids).size !== ids.length) return null;
    if (!ids.every((id) => typeof id === 'string' && q.options.some((o) => o.id === id))) return null;
    if (q.type === 'single' && ids.length !== 1) return null;
    if ('exclusive' in q && ids.includes(q.exclusive) && ids.length !== 1) return null;
    out[q.id] = ids as string[];
  }
  return out;
}

/* ---------- 2. reCAPTCHA ---------- */
async function human(token: string, secret: string, ip: string | null): Promise<boolean> {
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set('remoteip', ip);
  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', { method: 'POST', body });
  if (!response.ok) return false;
  const verdict = (await response.json()) as { success?: boolean; score?: number; action?: string; 'error-codes'?: string[] };
  if (!verdict.success) {
    console.warn('reCAPTCHA refused the token:', verdict['error-codes']);
    return false;
  }
  const passed = verdict.action === QUIZ_ACTION && (verdict.score ?? 0) >= MIN_SCORE;
  // Why a visitor was turned away, for the Worker's logs.
  if (!passed) console.warn(`reCAPTCHA turned a visitor away: score ${verdict.score}, action "${verdict.action}" (needs ${MIN_SCORE} and "${QUIZ_ACTION}").`);
  return passed;
}

/* ---------- 3. Claude ---------- */
const SYSTEM = `You write the result of a short quiz on the website of ${site.name}, a two-person Australian firm that finds the admin a small business does by hand and rebuilds it so it runs itself. The visitor owns or runs a business and has just answered nine multiple-choice questions. They read your reply on the result page, straight after the last question.

Your job is to read their answers as a whole and tell them which of our products fit their situation, in the order we would do them, and why.

What we sell. Recommend only from this list, by id:
${items
  .map((item) => {
    const s = serviceOf(item.practice);
    return `- ${item.id}: ${item.name}. Part of our "${s?.name}" service.`;
  })
  .join('\n')}

Specific tools we build, grouped by service. For each product you pick you may name up to three of these that suit what the visitor described, by exact name, taken from the same service as that product:
${servicesJson.map((s) => `- ${s.name}: ${s.products.map((p) => `${p.name} (${p.line})`).join('; ')}`).join('\n')}

How the answers usually point:
${quiz.rules
  .map((rule) => {
    const signals = rule.any.map((cond) => {
      const q = quiz.questions.find((x) => x.id === cond.q);
      const wanted = 'includes' in cond ? cond.includes : cond.in;
      return `"${q?.text}" answered ${(wanted ?? []).map((id) => `"${q?.options.find((o) => o.id === id)?.label}"`).join(' or ')}`;
    });
    return `- ${rule.item}: ${signals.join('; or ')}`;
  })
  .join('\n')}
These are a guide, and you can weigh the answers together. A product needs support in the answers: if nothing they said points to it, leave it out.

Rules that matter, and why:
- Pick at most ${MAX_PICKS} products, most valuable first. A short list they can act on is worth more than a complete one.
- If nothing in the answers points to work being done twice, late or by hand, pick nothing and say plainly that our advice is to buy nothing yet. We would rather lose a sale than sell something a business does not need, and visitors trust the result because of it.
- Do not state prices, hours saved, percentages or timeframes. We count those in an audit and never guess them, and the page shows our own figures where we have them.
- Do not invent facts about the visitor's business. You know only the nine answers.
- The business may be of any size, or in a trade we did not list. Say what still applies and do not turn them away.

Voice: plain Australian English, direct, second person, short sentences. No sales language, no exclamation marks, no emoji, no markdown. Write the way a tradesperson's sensible accountant would talk.

The fields:
- read: two to four sentences on what their answers say about how the business runs today, in their terms. This is the first thing they read.
- picks: the products, in the order to do them. For each, "why" is one or two sentences tying it to answers they gave, and "tools" is the tools from our list that fit.
- first_step: one or two sentences on what to do first. The way in is the free consultation, which can include a free initial audit: a quick overview of where the hand work is, not an in-depth count. Do not describe the initial audit as counting keystrokes or hours, and do not call any other audit free. Take account of what they said is stopping them.`;

const FORMAT = {
  type: 'json_schema' as const,
  schema: {
    type: 'object',
    properties: {
      read: { type: 'string' },
      picks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            product: { type: 'string', enum: items.map((item) => item.id) },
            why: { type: 'string' },
            tools: { type: 'array', items: { type: 'string', enum: toolNames } },
          },
          required: ['product', 'why', 'tools'],
          additionalProperties: false,
        },
      },
      first_step: { type: 'string' },
    },
    required: ['read', 'picks', 'first_step'],
    additionalProperties: false,
  },
};

/** The answers as a person would read them. Built from quiz.json, never from what was posted. */
function asText(a: Answers): string {
  return quiz.questions
    .map((q, i) => `${i + 1}. ${q.text}\n   ${a[q.id].map((id) => q.options.find((o) => o.id === id)?.label).join('; ')}`)
    .join('\n');
}

const clip = (text: unknown, max: number) => (typeof text === 'string' ? text.trim().slice(0, max) : '');

async function advise(a: Answers, apiKey: string, workspace?: string): Promise<Advice | null> {
  const client = new Anthropic({ apiKey, maxRetries: 1, timeout: 25_000, defaultHeaders: workspace ? { 'anthropic-workspace-id': workspace } : undefined });
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 4000,
    // If a safety check declines the request, the API re-runs it on another model.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    // A short read of nine answers. Thinking is always on for this model; low keeps the reply quick.
    output_config: { effort: 'low', format: FORMAT },
    system: SYSTEM,
    messages: [{ role: 'user', content: `The visitor's answers:\n\n${asText(a)}` }],
  });
  if (response.stop_reason !== 'end_turn') {
    console.warn('Claude stopped early:', response.stop_reason);
    return null;
  }
  const text = response.content.find((block) => block.type === 'text');
  if (!text || text.type !== 'text') return null;
  const raw = JSON.parse(text.text) as { read?: unknown; picks?: unknown; first_step?: unknown };

  // The shape is guaranteed by the API. The page's own limits are checked here.
  const seen = new Set<string>();
  const picks: Advice['picks'] = [];
  for (const pick of Array.isArray(raw.picks) ? (raw.picks as Record<string, unknown>[]) : []) {
    const item = items.find((x) => x.id === pick.product);
    if (!item || seen.has(item.id) || picks.length >= MAX_PICKS) continue;
    seen.add(item.id);
    const own = serviceOf(item.practice)?.products.map((p) => p.name) ?? [];
    const tools = (Array.isArray(pick.tools) ? pick.tools : []).filter((t): t is string => typeof t === 'string' && own.includes(t)).slice(0, 3);
    picks.push({ product: item.id, why: clip(pick.why, 400), tools });
  }
  const read = clip(raw.read, 700);
  if (!read) return null;
  return { read, picks, firstStep: clip(raw.first_step, 400) };
}

/* ---------- The request ---------- */
async function quizResult(request: Request, env: Env): Promise<Response> {
  const secret = env.RECAPTCHA_SECRET ?? env.RECAPTCHA_SECRET_KEY;
  if (!env.ANTHROPIC_API_KEY || !secret) {
    console.error('The quiz cannot run: ANTHROPIC_API_KEY or RECAPTCHA_SECRET is not set on this Worker.');
    return json({ error: 'not-configured' }, 503);
  }
  // The site's own pages only.
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) return json({ error: 'forbidden' }, 403);
  if (Number(request.headers.get('content-length') ?? 0) > 8192) return json({ error: 'too-large' }, 413);

  let body: { answers?: unknown; token?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad-request' }, 400);
  }
  const answers = checkAnswers(body.answers);
  if (!answers || typeof body.token !== 'string' || body.token.length < 20 || body.token.length > 4096) return json({ error: 'bad-request' }, 400);

  const ip = request.headers.get('cf-connecting-ip');
  if (env.QUIZ_LIMIT && !(await env.QUIZ_LIMIT.limit({ key: ip ?? 'unknown' })).success) return json({ error: 'slow-down' }, 429);

  if (!(await human(body.token, secret, ip))) return json({ error: 'recaptcha' }, 403);

  try {
    const advice = await advise(answers, env.ANTHROPIC_API_KEY, env.ANTHROPIC_WORKSPACE_ID);
    return advice ? json({ advice }) : json({ error: 'no-advice', reason: 'empty' }, 502);
  } catch (err) {
    // The kind of failure goes back with the error, so one can be told from
    // another without the logs. The full message stays in the logs.
    let reason = 'worker';
    if (err instanceof Anthropic.AuthenticationError) {
      reason = 'api-key';
      console.error('Claude refused the API key. Check ANTHROPIC_API_KEY.');
    } else if (err instanceof Anthropic.RateLimitError) {
      reason = 'rate-limit';
      console.error('Claude is rate limiting this key, or its spend limit is reached.');
    } else if (err instanceof Anthropic.APIError) {
      reason = `claude-${err.status ?? 'connection'}`;
      console.error(`Claude answered ${err.status}:`, err.message);
    } else {
      console.error('The quiz result failed:', err);
    }
    return json({ error: 'no-advice', reason }, 502);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/quiz') {
      return request.method === 'POST' ? quizResult(request, env) : json({ error: 'method' }, 405);
    }
    // The onboarding forms record when, and from which address, a client
    // accepted the terms. Read by the page just before it sends.
    if (pathname === '/api/stamp') {
      return json({ at: new Date().toISOString(), ip: request.headers.get('cf-connecting-ip') ?? null });
    }
    if (pathname === '/api/health') {
      return json({ anthropicKey: Boolean(env.ANTHROPIC_API_KEY), recaptchaSecret: Boolean(env.RECAPTCHA_SECRET ?? env.RECAPTCHA_SECRET_KEY), rateLimit: Boolean(env.QUIZ_LIMIT) });
    }
    if (pathname.startsWith('/api/')) return json({ error: 'not-found' }, 404);
    return env.ASSETS.fetch(request);
  },
};
