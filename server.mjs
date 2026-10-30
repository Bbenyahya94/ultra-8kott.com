import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const port = Number(process.env.PORT || 3000);
const root = join(process.cwd(), 'dist');
const mime = { '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.html':'text/html; charset=utf-8', '.png':'image/png', '.webp':'image/webp', '.mp4':'video/mp4', '.svg':'image/svg+xml', '.ico':'image/x-icon' };

function reply(res, status, body, type='application/json; charset=utf-8') { res.writeHead(status, { 'content-type':type, 'cache-control':'no-store' }); res.end(typeof body === 'string' ? body : JSON.stringify(body)); }
function readJson(req) { return new Promise((resolve, reject) => { let raw=''; req.on('data', chunk => { raw += chunk; if (raw.length > 8000) req.destroy(); }); req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch { reject(new Error('Invalid JSON')); } }); req.on('error', reject); }); }

async function chat(req, res) {
  if (!process.env.OPENAI_API_KEY) return reply(res, 503, { error:'Chat is not configured yet.' });
  try {
    const { message, language='en' } = await readJson(req);
    if (typeof message !== 'string' || !message.trim() || message.length > 1200) return reply(res, 400, { error:'Please enter a short question.' });
    const system = `You are Ultra Assistant for Ultra 8K OTT. Reply in the visitor's language (${language}). Be concise, professional and helpful. You may explain pricing, 24-hour trials, device setup, and reseller activation beginning at 120 credits. Do not claim access to accounts, accept payments, or give legal guarantees. For account-specific questions, direct the visitor to WhatsApp support.`;
    const response = await fetch('https://api.openai.com/v1/responses', {
      method:'POST',
      headers:{ 'content-type':'application/json', authorization:`Bearer ${process.env.OPENAI_API_KEY}` },
      body:JSON.stringify({ model:process.env.OPENAI_MODEL || 'gpt-4.1-mini', instructions:system, input:message, max_output_tokens:260 })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || 'OpenAI request failed');
    reply(res, 200, { reply:data.output_text || 'Please contact WhatsApp support for help.' });
  } catch (error) { console.error('Chat request failed:', error.message); reply(res, 502, { error:'The assistant is temporarily unavailable. Please try again or contact WhatsApp support.' }); }
}

async function serve(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === 'POST' && url.pathname === '/api/chat') return chat(req, res);
  if (req.method !== 'GET' && req.method !== 'HEAD') return reply(res, 405, 'Method not allowed', 'text/plain; charset=utf-8');
  const routes = { '/':'index.html', '/subscription':'subscription/index.html', '/reseller':'reseller/index.html', '/setup':'setup/index.html', '/faq':'faq/index.html' };
  let file = routes[url.pathname] || url.pathname.replace(/^\/+/, '');
  if (!file || file.includes('..')) file = '404.html';
  let full = normalize(join(root, file));
  if (!full.startsWith(root)) full = join(root, '404.html');
  try { const info = await stat(full); if (info.isDirectory()) full = join(full, 'index.html'); const body = await readFile(full); res.writeHead(200, { 'content-type':mime[extname(full)] || 'application/octet-stream' }); res.end(req.method === 'HEAD' ? undefined : body); }
  catch { try { const body = await readFile(join(root, '404.html')); res.writeHead(404, { 'content-type':'text/html; charset=utf-8' }); res.end(body); } catch { reply(res, 404, 'Not found', 'text/plain; charset=utf-8'); } }
}

createServer(serve).listen(port, '0.0.0.0', () => console.log(`Ultra 8K OTT running on port ${port}`));
