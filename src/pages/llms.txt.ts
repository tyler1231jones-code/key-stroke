// /llms.txt, written at build: the site in brief, for AI tools (src/lib/llms.ts).
import type { APIRoute } from 'astro';
import { llmsIndex } from '../lib/llms';
import { posts } from '../lib/blog';

export const GET: APIRoute = async () => new Response(llmsIndex(await posts()), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
