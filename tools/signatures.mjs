// npm run signatures
//
// Makes the email signatures for the principals, in the site's own style:
// the Drum logotype, an unworn keycap with the person's initial, the tagline
// and the site's one action as a key.
//
// Three designs per person, written to signatures/:
//   housing   the dark one, for new mail
//   paper     the same on white
//   plate     two lines and the mark, for replies
// signatures/index.html shows them all with a copy button each.
//
// Mail programs draw neither SVG nor web fonts, so the logotype and the keys
// are rendered to PNG in public/email/ and the signatures point at them on the
// live site. Until site.json has a domain the images are linked from this
// folder, which is good for looking and no good for sending: set the domain,
// deploy, then run this again. People and their details are in
// src/content/signatures.json; a detail left as TODO is left off.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { launch } from './shots.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'signatures');
const img = join(root, 'public', 'email');
const json = async (path) => JSON.parse(await readFile(join(root, path), 'utf8'));
const site = await json('src/content/site.json');
const { people, fallbackDomain, imageBase } = await json('src/content/signatures.json');
const isSet = (value) => typeof value === 'string' && value !== '' && value !== 'TODO';

const live = isSet(site.domain);
const domain = (live ? site.domain : fallbackDomain).replace(/^https?:\/\//, '').replace(/\/+$/, '');
const origin = `https://${domain}`;
// A mail program fetches the images itself, so they need a public address:
// the live site's, or imageBase in signatures.json if they are up somewhere
// else first (a workers.dev address, say, ending in /email).
const hosted = isSet(imageBase) ? imageBase.replace(/\/+$/, '') : live ? `${origin}/email` : null;
const src = (file) => (hosted ? `${hosted}/${file}` : `../public/email/${file}`);

// From src/styles/tokens.css. Mail needs the values written out.
const THEMES = {
  dark: { ground: '#0b0d10', rule: '#5c666f', hairline: '#1e252b', ink: '#e6eaee', muted: '#8d97a2', readout: '#d6dee6', live: '#4ea8ff', legend: '#07090b' },
  light: { ground: '#ffffff', rule: '#8a939d', hairline: '#e4e9ed', ink: '#0b0d10', muted: '#5b6672', readout: '#d6dee6', live: '#0b5fd0', legend: '#0b0d10' },
};
const FONT = {
  display: "Oswald,'Arial Narrow',Arial,sans-serif",
  body: 'Archivo,Helvetica,Arial,sans-serif',
  data: "'IBM Plex Mono',Consolas,'Courier New',monospace",
};

// ---------- Images ----------

// The Drum, as src/components/Logotype.astro draws it.
function lockup(t, ink) {
  const letters = site.name.split('');
  const W = 58, H = 84, B = 2;
  const width = letters.length * W + B * 2;
  const last = letters.length - 1;
  const y = B + H / 2 + 24;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${H + B * 2 + 10}" width="${width}">
    <defs><clipPath id="e"><rect x="${B + last * W}" y="${B}" width="${W}" height="${H}"/></clipPath></defs>
    <rect x="${B / 2}" y="${B / 2}" width="${width - B}" height="${H + B}" fill="none" stroke="${ink}" stroke-width="${B}"/>
    ${letters.slice(1).map((_, i) => `<rect x="${B + (i + 1) * W - 0.5}" y="${B}" width="1" height="${H}" fill="${t.hairline}"/>`).join('')}
    <rect x="${B}" y="${B + H * 0.66}" width="${letters.length * W}" height="1" fill="${t.hairline}"/>
    <g fill="${ink}" font-family="Oswald" font-weight="600" font-size="66" text-anchor="middle">
      ${letters.slice(0, -1).map((ch, i) => `<text x="${B + i * W + W / 2}" y="${y}">${ch}</text>`).join('')}
      <g clip-path="url(#e)">
        <text x="${B + last * W + W / 2}" y="${y + H * 0.16}">${letters[last]}</text>
        <text x="${B + last * W + W / 2}" y="${y + H * 0.16 - H}">${letters[last]}</text>
      </g>
    </g>
    <rect x="0" y="${H + B * 2 + 4}" width="${width}" height="6" fill="${ink}"/>
  </svg>`;
}

function mark(t, ink) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="64">
    <rect x="1" y="1" width="30" height="30" fill="none" stroke="${ink}" stroke-width="2"/>
    <rect x="2" y="21" width="28" height="1" fill="${t.hairline}"/>
    <text x="16" y="23" fill="${ink}" font-family="Oswald" font-weight="600" font-size="22" text-anchor="middle">${site.name[0]}</text>
  </svg>`;
}

// The drawn keycap, as src/components/KeySvg.astro draws it, unworn.
function key(t, legend) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200">
    <rect x="6" y="6" width="188" height="188" rx="6" fill="${t.rule}"/>
    <polygon points="6,6 194,6 162,34 38,34" fill="${t.rule}" opacity="0.82"/>
    <polygon points="6,194 194,194 162,158 38,158" fill="${t.hairline}"/>
    <polygon points="6,6 38,34 38,158 6,194" fill="${t.rule}" opacity="0.66"/>
    <polygon points="194,6 162,34 162,158 194,194" fill="${t.rule}" opacity="0.5"/>
    <rect x="38" y="34" width="124" height="124" rx="3" fill="${t.readout}"/>
    <text x="100" y="124" text-anchor="middle" font-family="Archivo" font-weight="600" font-size="78" fill="${t.legend}">${legend}</text>
  </svg>`;
}

const face = async (family, file) =>
  `@font-face{font-family:${family};font-weight:600;src:url(data:font/woff2;base64,${(await readFile(join(root, 'node_modules/@fontsource', file))).toString('base64')}) format("woff2")}`;

async function images() {
  await mkdir(img, { recursive: true });
  const drawings = [];
  for (const [name, t] of Object.entries(THEMES)) {
    drawings.push([`lockup-${name}.png`, t, lockup(t, name === 'dark' ? t.readout : t.ink), 0]);
    drawings.push([`mark-${name}.png`, t, mark(t, name === 'dark' ? t.readout : t.ink), 0]);
    for (const legend of new Set(people.map((p) => p.legend))) drawings.push([`key-${legend.toLowerCase()}-${name}.png`, t, key(t, legend), 0]);
  }
  const browser = await launch();
  const page = await (await browser.newContext({ viewport: { width: 800, height: 400 }, deviceScaleFactor: 1 })).newPage();
  await page.setContent(`<style>
    ${await face('Oswald', 'oswald/files/oswald-latin-600-normal.woff2')}
    ${await face('Archivo', 'archivo/files/archivo-latin-600-normal.woff2')}
    body{margin:0} div{display:inline-block} svg{display:block}
  </style>${drawings.map(([, t, svg, pad], i) => `<div id="d${i}" style="background:${t.ground};padding:${pad}px">${svg}</div>`).join('<br>')}
  <p style="font:600 20px Oswald">K</p><p style="font:600 20px Archivo">K</p>`);
  await page.evaluate(() => document.fonts.ready);
  for (const [i, [file]] of drawings.entries()) {
    const png = await page.locator(`#d${i}`).screenshot({ type: 'png' });
    const small = await sharp(png).png({ palette: true, compressionLevel: 9 }).toBuffer();
    await writeFile(join(img, file), small);
    console.log(`public/email/${file}  ${(small.length / 1024).toFixed(1)} KB`);
  }
  await browser.close();
}

// ---------- Signatures ----------

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const tel = (s) => `tel:${s.replace(/[^\d+]/g, '')}`;
const table = (attrs = '') => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" ${attrs}`;

function rows(p, t) {
  const link = (href, text, colour = t.ink) => `<a href="${href}" style="color:${colour};text-decoration:none;">${esc(text)}</a>`;
  return [
    isSet(p.mobile) && ['M', link(tel(p.mobile), p.mobile)],
    isSet(p.email) && ['E', link(`mailto:${p.email}`, p.email)],
    ['W', link(origin, domain, t.live)],
  ].filter(Boolean);
}

// Housing and Paper: one layout in the two themes. A long, low card: who and
// how to reach them on one line, the logotype, the tagline and the key below.
function card(p, name) {
  const t = THEMES[name];
  // The key is a table cell, not a styled link: mail programs keep a cell's
  // bgcolor and drop a link's background.
  const cta = `${table('align="right"')}><tr><td bgcolor="${t.readout}" style="background:${t.readout};border-bottom:2px solid ${t.rule};border-radius:6px;padding:6px 12px;white-space:nowrap;"><a href="${origin}/contact" style="color:${t.legend};font-family:${FONT.body};font-size:12px;line-height:18px;font-weight:600;text-decoration:none;white-space:nowrap;"><font color="${t.legend}">Book a free consultation</font></a></td></tr></table>`;
  return `${table(`width="640" bgcolor="${t.ground}" style="width:100%;max-width:640px;background:${t.ground};border:1px solid ${t.rule};border-collapse:separate;"`)}>
  <tr><td style="padding:18px 20px 16px 20px;">
    ${table('width="100%"')}><tr>
      <td valign="middle" width="64" style="padding-right:16px;"><img src="${src(`key-${p.legend.toLowerCase()}-${name}.png`)}" width="64" height="64" alt="" style="display:block;border:0;"></td>
      <td valign="middle" style="padding-right:20px;">
        <div style="font-family:${FONT.display};font-size:27px;line-height:28px;font-weight:600;letter-spacing:0.01em;text-transform:uppercase;white-space:nowrap;color:${t.ink};">${esc(p.name)}</div>
        <div style="padding-top:6px;font-family:${FONT.data};font-size:10px;line-height:14px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;white-space:nowrap;color:${t.muted};">${esc(p.role)}</div>
      </td>
      <td valign="middle" align="right">
        ${table(`align="right" style="border-left:1px solid ${t.hairline};"`)}>
          ${rows(p, t).map(([label, value]) => `<tr>
            <td width="24" style="padding-left:20px;font-family:${FONT.data};font-size:11px;line-height:21px;font-weight:500;color:${t.muted};">${label}</td>
            <td style="font-family:${FONT.body};font-size:14px;line-height:21px;white-space:nowrap;color:${t.ink};">${value}</td>
          </tr>`).join('')}
        </table>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="border-top:1px solid ${t.hairline};padding:12px 20px 14px 20px;">
    ${table('width="100%"')}><tr>
      <td valign="middle" width="126"><a href="${origin}" style="text-decoration:none;"><img src="${src(`lockup-${name}.png`)}" width="126" height="24" alt="${esc(site.name)}" style="display:block;border:0;"></a></td>
      <td valign="middle" style="padding:0 16px;font-family:${FONT.data};font-size:10px;line-height:14px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:${t.muted};">${esc(site.tagline)}</td>
      <td valign="middle" align="right">${cta}</td>
    </tr></table>
  </td></tr>
  <tr><td height="6" bgcolor="${name === 'dark' ? t.readout : t.ink}" style="height:6px;line-height:6px;font-size:0;background:${name === 'dark' ? t.readout : t.ink};">&nbsp;</td></tr>
</table>`;
}

function plate(p) {
  const t = THEMES.light;
  const sep = ` <span style="color:${t.rule};">/</span> `;
  const bits = rows(p, t).map(([, value]) => value).join(sep);
  return `${table()}><tr>
  <td valign="top" style="padding-right:12px;"><a href="${origin}" style="text-decoration:none;"><img src="${src('mark-light.png')}" width="36" height="36" alt="${esc(site.name)}" style="display:block;border:0;"></a></td>
  <td valign="top" style="border-left:2px solid ${t.ink};padding-left:12px;">
    <div style="font-family:${FONT.display};font-size:17px;line-height:18px;font-weight:600;letter-spacing:0.02em;text-transform:uppercase;color:${t.ink};">${esc(p.name)} <span style="font-family:${FONT.data};font-size:10px;font-weight:500;letter-spacing:0.16em;color:${t.muted};">&nbsp;${esc(p.role)}, ${esc(site.name)}</span></div>
    <div style="padding-top:3px;font-family:${FONT.body};font-size:13px;line-height:18px;color:${t.ink};">${bits}</div>
  </td>
</tr></table>`;
}

const DESIGNS = [
  ['housing', 'Housing', 'The dark one. For new mail.', (p) => card(p, 'dark')],
  ['paper', 'Paper', 'The same on white, for mail that prints or lands in a light inbox.', (p) => card(p, 'light')],
  ['plate', 'Plate', 'Two lines and the mark. For replies and forwards.', plate],
];

if (!process.argv.includes('--no-images')) await images();
await mkdir(out, { recursive: true });
const blocks = [];
for (const p of people) {
  for (const [id, title, note, make] of DESIGNS) {
    const html = make(p);
    await writeFile(join(out, `${p.id}-${id}.html`), `<!doctype html><meta charset="utf-8"><title>${esc(p.name)}, ${title}</title>\n${html}\n`);
    blocks.push(`<section><header><h2>${esc(p.name)} <span>${title}</span></h2><p>${note}</p><button type="button">Copy signature</button></header><div class="sig">${html}</div></section>`);
  }
}

await writeFile(join(out, 'index.html'), `<!doctype html>
<html lang="en-AU"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(site.name)} email signatures</title>
<style>
  body{margin:0;padding:40px 24px 80px;background:#f4f6f8;color:#0b0d10;font:16px/25px Archivo,Helvetica,Arial,sans-serif}
  main{max-width:720px;margin:0 auto}
  h1{font:600 34px/34px Oswald,'Arial Narrow',Arial,sans-serif;text-transform:uppercase;margin:0 0 12px}
  .warn{border:1px solid #cc1f14;padding:12px 16px;margin:16px 0}
  ol{padding-left:20px;color:#5b6672;font-size:14px;line-height:21px}
  section{margin-top:48px}
  header{display:grid;grid-template-columns:1fr auto;gap:0 16px;align-items:end;margin-bottom:16px}
  h2{font:600 22px/24px Oswald,'Arial Narrow',Arial,sans-serif;text-transform:uppercase;margin:0}
  h2 span{color:#5b6672}
  header p{grid-column:1;margin:0;font-size:14px;line-height:21px;color:#5b6672}
  button{grid-row:1 / span 2;grid-column:2;font:600 14px/21px inherit;min-height:40px;padding:0 16px;background:#d6dee6;color:#0b0d10;border:0;border-radius:6px;box-shadow:0 2px 0 #8a939d;cursor:pointer}
  button:active{box-shadow:none;transform:translateY(2px)}
  .sig{background:#fff;padding:24px;border:1px solid #e4e9ed;overflow-x:auto}
</style>
<main>
  <h1>Email signatures</h1>
  ${hosted ? '' : `<p class="warn">Preview only. The images are files on this computer, which a mail program cannot fetch, so they will drop out when pasted. Deploy the site, set its domain in site.json (or imageBase in signatures.json), and run <code>npm run signatures</code> again before pasting these into a mail program.</p>`}
  <ol>
    <li>Press Copy signature.</li>
    <li>Gmail: Settings, See all settings, Signature, Create new, paste.</li>
    <li>Outlook: Settings, Mail, Compose and reply (or Signatures), New signature, paste.</li>
    <li>Apple Mail: Settings, Signatures, add one, untick "Always match my default message font", paste.</li>
  </ol>
  ${blocks.join('\n  ')}
</main>
<script>
  for (const button of document.querySelectorAll('button')) {
    button.addEventListener('click', async () => {
      const sig = button.closest('section').querySelector('.sig');
      const done = () => { button.textContent = 'Copied'; setTimeout(() => (button.textContent = 'Copy signature'), 1600); };
      // The markup as written, so nothing is restyled on the way to the clipboard.
      try {
        await navigator.clipboard.write([new ClipboardItem({
          'text/html': new Blob([sig.innerHTML], { type: 'text/html' }),
          'text/plain': new Blob([sig.innerText], { type: 'text/plain' }),
        })]);
        return done();
      } catch {}
      const range = document.createRange();
      range.selectNodeContents(sig);
      const selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('copy');
      selection.removeAllRanges();
      done();
    });
  }
</script>
</html>
`);
console.log(`${people.length * DESIGNS.length} signatures written to signatures/. Open signatures/index.html.${hosted ? '' : ' Preview only: the images have no public address yet.'}`);
