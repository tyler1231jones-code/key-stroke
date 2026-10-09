// /llms.txt, written at build: the site in brief, for AI tools (src/lib/llms.ts).
import type { APIRoute } from 'astro';
import { llmsIndex } from '../lib/llms';

export const GET: APIRoute = () => new Response(llmsIndex(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
