// Captures built screens from the running app into docs/design: PNG, static HTML and source.
// Usage: npm run capture            every screen in screens.mjs
//        npm run capture -- E11 R21  only these

import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import puppeteer from 'puppeteer-core';

import { areaPath } from './areas.mjs';
import { createApi } from './fixtures.mjs';
import { screens } from './screens.mjs';

const designDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const appUrl = process.env.APP_URL ?? 'http://localhost:8081';
const edge = process.env.BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const debugPort = 9334;
const width = 390;
const minHeight = 844;
const settleMs = 900;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function startBrowser() {
  const profile = mkdtempSync(join(tmpdir(), 'herculean-capture-'));
  const child = spawn(edge, ['--headless=new', '--disable-gpu', '--disable-web-security', '--hide-scrollbars', `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });

  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${debugPort}`, defaultViewport: null });

      return { browser, stop: () => browser.close().finally(() => { child.kill(); rmSync(profile, { recursive: true, force: true, maxRetries: 3 }); }) };
    } catch {
      await sleep(500);
    }
  }
  throw new Error('The browser did not start.');
}

/** Answers API calls from the sample data. A screen's own answers come first. */
async function mockApi(page, state) {
  const api = createApi();
  await page.setRequestInterception(true);
  page.on('request', async (request) => {
    const url = new URL(request.url());
    if (!url.pathname.startsWith('/api/v1/')) {
      await request.continue();
      return;
    }

    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
    if (request.method() === 'OPTIONS') {
      await request.respond({ status: 204, headers: cors });
      return;
    }

    const key = `${request.method()} ${url.pathname}`;
    const given = state.answers?.[key];
    const custom = typeof given === 'function' ? given(url) : given;
    if (custom === 'hold') {
      return;
    }
    if (custom === 'fail') {
      await request.abort('failed');
      return;
    }

    const postData = request.hasPostData() ? await request.fetchPostData() : undefined;
    const body = postData === undefined ? undefined : JSON.parse(postData);
    const answer = custom ?? api(request.method(), url.pathname, body, url.searchParams);
    await request.respond({
      status: answer.status,
      headers: cors,
      contentType: 'application/json',
      body: answer.body === undefined ? '' : JSON.stringify(answer.body),
    });
  });
}

/** The visible element with this label, or with this text. The last one is on top. */
function findCenter(page, name) {
  return page.evaluate((wanted) => {
    const visible = (element) => {
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);

      return box.width > 0 && box.height > 0 && style.visibility !== 'hidden' && box.top < innerHeight && box.bottom > 0;
    };
    const labelled = [...document.querySelectorAll('[aria-label]')].filter((element) => element.getAttribute('aria-label') === wanted && visible(element));
    const texts = labelled.length > 0 ? labelled : [...document.querySelectorAll('body *')].filter((element) => element.children.length === 0 && element.textContent.trim() === wanted && visible(element));
    // A pager keeps pages beside the screen. Scrolling to one of those would shift the page shown.
    const onScreen = texts.filter((element) => {
      const box = element.getBoundingClientRect();

      return box.right > 0 && box.left < innerWidth;
    });
    const target = onScreen.at(-1) ?? texts.at(-1);
    if (target === undefined) {
      return null;
    }
    target.scrollIntoView({ block: 'center' });
    const box = target.getBoundingClientRect();

    return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  }, name);
}

async function waitForCenter(page, name) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const center = await findCenter(page, name);
    if (center !== null) {
      return center;
    }
    await sleep(150);
  }
  throw new Error(`Couldn't find "${name}" on ${page.url()}: ${(await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 300)}`);
}

function helpers(page) {
  return {
    tap: async (name) => {
      const { x, y } = await waitForCenter(page, name);
      await page.mouse.click(x, y);
      await sleep(250);
    },
    /** Taps the visible text that starts with this, for a label that counts down. */
    tapStarting: async (start) => {
      const center = await page.evaluate((wanted) => {
        const target = [...document.querySelectorAll('body *')].filter((element) => element.children.length === 0 && element.textContent.trim().startsWith(wanted) && element.getBoundingClientRect().width > 0).at(-1);
        if (target === undefined) {
          return null;
        }
        const box = target.getBoundingClientRect();

        return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
      }, start);
      if (center === null) {
        throw new Error(`Couldn't find text starting with "${start}" on ${page.url()}.`);
      }
      await page.mouse.click(center.x, center.y);
      await sleep(250);
    },
    type: async (label, text) => {
      await page.waitForSelector(`[aria-label="${label}"]`, { timeout: 8000 });
      const fields = await page.$$(`[aria-label="${label}"]`);
      const field = fields.at(-1);
      await field.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await field.type(text);
    },
    waitFor: (name) => waitForCenter(page, name),
    /** Drags sideways from an element, which swipes it. */
    swipe: async (name, distance) => {
      const { x, y } = await waitForCenter(page, name);
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + distance / 2, y, { steps: 4 });
      await page.mouse.move(x + distance, y, { steps: 4 });
      await page.mouse.up();
      await sleep(600);
    },
    /** Picks up an element and moves it up or down, and keeps holding it. */
    hold: async (name, distance) => {
      const { x, y } = await waitForCenter(page, name);
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x, y + distance / 2, { steps: 6 });
      await page.mouse.move(x, y + distance, { steps: 6 });
      await sleep(400);
    },
    /** Lets go of what is held. */
    release: async () => {
      await page.mouse.up();
      await sleep(600);
    },
    /** Scrolls every scrolling list to its end, for what sits below the screen. */
    end: async () => {
      await page.evaluate(() => {
        for (const element of document.querySelectorAll('*')) {
          if (element.scrollHeight > element.clientHeight + 1) {
            element.scrollTop = element.scrollHeight;
          }
        }
      });
      await sleep(400);
    },
    /** Moves within the app, because reloading the page would sign the user out. */
    go: async (path) => {
      await page.evaluate((target) => {
        history.pushState(null, '', target);
        dispatchEvent(new PopStateEvent('popstate', { state: null }));
      }, path);
      await sleep(500);
    },
    sleep,
  };
}

async function signIn(page, on) {
  await on.type('Email', 'filip@example.com');
  await on.type('Password', 'password');
  await on.tap('Sign in');
  await on.waitFor('Home');
}

/** How much taller than the screen the content is, so long screens are drawn whole. */
function fullHeight(page) {
  return page.evaluate(() => {
    let overflow = 0;
    for (const element of document.querySelectorAll('body *')) {
      const style = getComputedStyle(element);
      if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && element.getBoundingClientRect().height > 0) {
        overflow = Math.max(overflow, element.scrollHeight - element.clientHeight);
      }
    }

    return innerHeight + overflow;
  });
}

// Runs in the page: the visible page as plain elements with their exact styles.
function serialize() {
  const props = ['display', 'position', 'top', 'right', 'bottom', 'left', 'width', 'height', 'min-height', 'box-sizing', 'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink', 'flex-basis', 'align-items', 'align-self', 'align-content', 'justify-content', 'gap', 'row-gap', 'column-gap', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width', 'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius', 'background-color', 'background-image', 'color', 'fill', 'stroke', 'font-family', 'font-size', 'font-weight', 'font-variant-numeric', 'letter-spacing', 'line-height', 'text-transform', 'text-align', 'text-decoration-line', 'white-space', 'opacity', 'overflow-x', 'overflow-y', 'z-index', 'transform', 'box-shadow'];
  const keptAttributes = /^(aria-|role$|type$|placeholder$|viewBox$|d$|x$|y$|x1$|x2$|y1$|y2$|cx$|cy$|r$|rx$|ry$|fx$|fy$|offset$|stop-|fill$|stroke|points$|transform$|gradient|id$|xmlns)/;
  const frame = document.createElement('iframe');
  frame.style.display = 'none';
  document.body.append(frame);
  const blank = frame.contentDocument;
  const defaults = new Map();
  const defaultsOf = (element) => {
    const key = `${element.namespaceURI} ${element.localName}`;
    if (!defaults.has(key)) {
      const copy = blank.createElementNS(element.namespaceURI, element.localName);
      blank.body.append(copy);
      const style = frame.contentWindow.getComputedStyle(copy);
      defaults.set(key, Object.fromEntries(props.map((prop) => [prop, style.getPropertyValue(prop)])));
      copy.remove();
    }

    return defaults.get(key);
  };
  const hex = (value) => value.replace(/rgb\((\d+), (\d+), (\d+)\)/g, (_, r, g, b) => `#${[r, g, b].map((part) => Number(part).toString(16).padStart(2, '0')).join('').toUpperCase()}`);
  const escape = (text) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const attribute = (text) => escape(text).replaceAll('"', '&quot;');

  const walk = (element) => {
    if (element === frame || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'LINK', 'META'].includes(element.tagName)) {
      return '';
    }
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return '';
    }

    const base = defaultsOf(element);
    const declarations = [];
    for (const prop of props) {
      let value = style.getPropertyValue(prop);
      const positioned = style.position !== 'static';
      const side = prop.match(/^border-(top|right|bottom|left)-(style|color)$/)?.[1];
      if (
        value === base[prop] ||
        (['top', 'right', 'bottom', 'left'].includes(prop) && (!positioned || style.position === 'relative')) ||
        (side !== undefined && style.getPropertyValue(`border-${side}-width`) === '0px')
      ) {
        continue;
      }
      if (prop === 'font-family') {
        const match = value.match(/ChakraPetch_(\d+)/);
        value = "'Chakra Petch', system-ui, sans-serif";
        if (match !== null) {
          declarations.push(`font-weight: ${match[1]}`);
        }
      }
      if (prop === 'font-weight' && /ChakraPetch_/.test(style.fontFamily)) {
        continue;
      }
      declarations.push(`${prop}: ${hex(value)}`);
    }

    const tag = element.localName;
    const attributes = [...element.attributes]
      .filter((item) => keptAttributes.test(item.name) && !(item.name === 'id' && item.value === 'root'))
      .map((item) => ` ${item.name}="${attribute(item.value)}"`)
      .join('');
    const styleAttribute = declarations.length > 0 ? ` style="${attribute(declarations.join('; '))}"` : '';
    if (tag === 'input' || tag === 'textarea') {
      const value = element.value === '' ? '' : ` value="${attribute(element.value)}"`;

      return `<input${attributes}${value}${styleAttribute}>`;
    }

    const children = [...element.childNodes]
      .map((node) => (node.nodeType === Node.TEXT_NODE ? escape(node.textContent) : node.nodeType === Node.ELEMENT_NODE ? walk(node) : ''))
      .join('');

    return `<${tag}${attributes}${styleAttribute}>${children}</${tag}>`;
  };

  const html = [...document.body.children].map(walk).join('\n');
  frame.remove();

  return html;
}

function htmlFile(title, body, height) {
  return `<!DOCTYPE html><html lang="en"><head><link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&display=swap" rel="stylesheet">
<meta charset="utf-8">
<title>Herculean · ${title}</title>
<style>
body{margin:0;background:#050506}
</style>
</head>
<body>
<div style="position: relative; width: ${width}px; height: ${height}px; overflow: hidden; background: #050506">
${body}
</div>
</body></html>
`;
}

const tokens = [
  ['#050506', 'c.bg'], ['#0F1012', 'c.card'], ['#17181B', 'c.raised'], ['#2C2F34', 'c.border'], ['#F2F3F5', 'c.text'], ['#A9AEB6', 'c.muted'],
  ['#1A55E6', 'c.primary'], ['#7EA2FF', 'c.primaryText'], ['#FFFFFF', 'c.onPrimary'], ['#F87171', 'c.danger'], ['#DC2626', 'c.dangerFill'],
  ['#C58FA6', 'c.day.monday'], ['#A99BC9', 'c.day.tuesday'], ['#7FB0C2', 'c.day.wednesday'], ['#7FB59F', 'c.day.thursday'], ['#A9B77E', 'c.day.friday'], ['#C9B57A', 'c.day.saturday'], ['#C99A7A', 'c.day.sunday'],
];
const radii = [['6px', 'r.card'], ['4px', 'r.ctrl'], ['3px', 'r.pill'], ['10px', 'r.sheet']];

function sourceFile(title, body, height, script) {
  let themed = body.replaceAll("'Chakra Petch', system-ui, sans-serif", "'{{font}}', system-ui, sans-serif");
  for (const [value, token] of tokens) {
    themed = themed.replaceAll(value, `{{${token}}}`);
  }
  for (const [value, token] of radii) {
    themed = themed.replace(new RegExp(`(border-[a-z]+-[a-z]+-radius: )${value}`, 'g'), `$1{{${token}}}`);
  }
  const sized = script.replace(/("\$preview":\{"width":390,"height":)\d+/, `$1${height}`);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Herculean · ${title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=Oxanium:wght@400;500;600;700&family=Exo+2:wght@400;500;600;700&family=Saira:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
body{margin:0}
</style>
</helmet>
<div style="position: relative; width: ${width}px; height: ${height}px; overflow: hidden; background: {{c.bg}}">
${themed}
</div>
</x-dc>
${sized}
</body>
</html>
`;
}

async function capture(browser, screen, script) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: minHeight, deviceScaleFactor: 2 });
  try {
    if (screen.today !== undefined) {
      await page.evaluateOnNewDocument((today) => {
        const RealDate = Date;
        const shift = new RealDate(today).getTime() - RealDate.now();
        globalThis.Date = class extends RealDate {
          constructor(...args) {
            super(...(args.length === 0 ? [RealDate.now() + shift] : args));
          }

          static now() {
            return RealDate.now() + shift;
          }
        };
      }, screen.today);
    }
    await mockApi(page, { answers: { ...screen.answers } });
    await page.goto(screen.before === 'launch' ? appUrl : `${appUrl}/`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    const on = helpers(page);
    if (screen.signedIn !== false) {
      await signIn(page, on);
    } else {
      await on.sleep(600);
    }
    await screen.steps?.(on);
    await sleep(settleMs);

    if (screen.full !== false) {
      const height = await fullHeight(page);
      if (height > minHeight) {
        await page.setViewport({ width, height, deviceScaleFactor: 2 });
        await sleep(settleMs);
      }
    }
    const height = await page.evaluate(() => innerHeight);
    const file = screen.file;
    await page.screenshot({ path: join(designDir, 'screens', areaPath(file, 'png')) });
    const body = await page.evaluate(serialize);
    writeFileSync(join(designDir, 'html', areaPath(file, 'html')), htmlFile(screen.title, body, height));
    writeFileSync(join(designDir, 'source', areaPath(file, 'dc.html')), sourceFile(screen.title, body, height, script));

    return height;
  } finally {
    await page.close();
  }
}

/** Puts every captured screen in the screen index, the Index board and the canvas. */
function updateIndexes(results) {
  const indexPath = join(designDir, 'screen-index.md');
  let index = readFileSync(indexPath, 'utf8');
  for (const { screen, height } of results) {
    const full = height > minHeight ? ' · full scroll' : '';
    const label = screen.title + full;
    const row = `| ${screen.id} | ${label} | ${screen.row} | ${width}×${height} | [png](screens/${areaPath(screen.file, 'png')}) · [html](html/${areaPath(screen.file, 'html')}) · [source](source/${areaPath(screen.file, 'dc.html')}) |`;
    const existing = new RegExp(`^\\| ${screen.id} \\|[^\\n]*$`, 'm');
    if (existing.test(index)) {
      index = index.replace(existing, () => row);
    } else {
      const earlier = screens.slice(0, screens.indexOf(screen)).reverse();
      const previous = earlier.find((candidate) => new RegExp(`^\\| ${candidate.id} \\|`, 'm').test(index));
      index = index.replace(new RegExp(`^\\| ${previous.id} \\|[^\\n]*$`, 'm'), (line) => `${line}\n${row}`);
    }
  }
  const rows = [...index.matchAll(/^\| ([A-Z]\d\d) \| (.*?) \| ([A-Z]\d) [^|]*\| [^|]* \| .*?\(source\/([^)]+)\) \|$/gm)];
  index = index.replace(/^\d+ screens\./m, `${rows.length} screens.`);
  writeFileSync(indexPath, index);

  const readmePath = join(designDir, 'README.md');
  writeFileSync(readmePath, readFileSync(readmePath, 'utf8').replace(/All \d+ screens:/, `All ${rows.length} screens:`));

  const positions = {};
  const byArea = {};
  for (const [, id, name, row] of rows) {
    positions[row] = (positions[row] ?? 0) + 1;
    (byArea[id[0]] ??= []).push({ id, name, row, position: positions[row] });
  }
  const boardPath = join(designDir, 'source', 'Index.dc.html');
  const lines = [];
  let boardHeight = 0;
  for (const line of readFileSync(boardPath, 'utf8').split('\n')) {
    if (line.includes('width: 430px')) {
      continue;
    }
    lines.push(line);
    const head = line.match(/<p style="position: absolute; left: (\d+)px; top: 220px/);
    if (head !== null) {
      const area = line.match(/>([A-Z]) /)[1];
      (byArea[area] ?? []).forEach((item, position) => {
        const top = 280 + 56 * position;
        boardHeight = Math.max(boardHeight, top + 96);
        lines.push(`<div style="position: absolute; left: ${head[1]}px; top: ${top}px; width: 430px; display: flex; gap: 14px; align-items: baseline"><span style="flex: none; width: 48px; font-size: 18px; font-weight: 700; color: #7EA2FF">${item.id}</span><span style="display: flex; flex-direction: column; gap: 2px"><span style="font-size: 16px; font-weight: 600; color: #F2F3F5">${item.name}</span><span style="font-size: 13px; color: #A9AEB6">Row ${item.row}, position ${item.position}</span></span></div>`);
      });
    }
  }
  const board = lines.join('\n')
    .replace(/(aria-label="Screen index" style="width: 2980px; height: )\d+/, `$1${Math.max(1576, boardHeight)}`)
    .replace(/("\$preview":\{"width":2980,"height":)\d+/, `$1${Math.max(1576, boardHeight)}`);
  writeFileSync(boardPath, board);

  const canvasPath = join(designDir, 'source', 'canvas.json');
  const canvas = JSON.parse(readFileSync(canvasPath, 'utf8'));
  canvas.boards['Index.dc.html'].h = Math.max(1576, boardHeight);
  for (const { screen, height } of results) {
    const file = areaPath(screen.file, 'dc.html');
    const y = Math.max(...Object.values(canvas.boards).map((item) => item.y + item.h));
    canvas.boards[file] ??= { is_interactive: true, x: 0, y: y + 120, w: width, h: height, title: '' };
    if (!canvas.order.includes(file)) {
      canvas.order.push(file);
    }
    canvas.boards[file].h = height;
  }
  for (const [, id, name, , source] of rows) {
    if (canvas.boards[source] !== undefined) {
      canvas.boards[source].title = `${id} · ${name}`;
    }
  }
  writeFileSync(canvasPath, JSON.stringify(canvas));
}

const only = process.argv.slice(2);
const wanted = only.length > 0 ? screens.filter((screen) => only.includes(screen.id)) : screens;
const script = readFileSync(join(designDir, 'capture', 'theme.dc.html'), 'utf8');
const { browser, stop } = await startBrowser();
const results = [];
const failures = [];
for (const screen of wanted) {
  try {
    const height = await capture(browser, screen, script);
    results.push({ screen, height });
    console.log(`${screen.id} ${height}`);
  } catch (error) {
    failures.push(screen.id);
    console.log(`${screen.id} FAILED: ${error.message.slice(0, 400)}`);
  }
}
await stop().catch(() => undefined);
updateIndexes(results);
console.log(`${results.length} captured, ${failures.length} failed${failures.length > 0 ? `: ${failures.join(' ')}` : ''}`);
process.exit(failures.length > 0 ? 1 : 0);
