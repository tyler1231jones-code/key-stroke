// /llms-full.txt, written at build: every real public page's substance in one file, for AI tools (src/lib/llms.ts).
import type { APIRoute } from 'astro';
import { llmsFull } from '../lib/llms';

export const GET: APIRoute = () => new Response(llmsFull(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
