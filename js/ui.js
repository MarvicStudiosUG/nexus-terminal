// ui.js - Terminal output, quickbar, settings UI, helpers

import { MAX_OUTPUT_LINES, themes } from './config.js';
import { cmdFrequency } from './main.js';

export const output = document.getElementById('outputContainer');
export const quickbar = document.getElementById('quickbar');
export let outputLines = [];

export function esc(s) {
  return String(s).replace(/[&<>"]/g, function(m) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[m];
  });
}

export function add(html, cls = '') {
  const line = document.createElement('div');
  line.className = 'line ' + cls;
  line.innerHTML = html;
  output.appendChild(line);
  outputLines.push(line);
  if (outputLines.length > MAX_OUTPUT_LINES) {
    const removed = outputLines.shift();
    if (removed && removed.parentNode) removed.parentNode.removeChild(removed);
  }
  output.scrollTop = output.scrollHeight;
  return line;
}

export function cmdEcho(t) {
  add('<span class="cmd">' + esc(t) + '</span>');
}

export function loader(msg) {
  const id = 'l' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
  add('<span id="' + id + '" class="info">[...] ' + esc(msg) + '</span>');
  return id;
}

export function unloader(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

let updateTimer = null;
export function updateQuickbar() {
  if (updateTimer) return;
  updateTimer = setTimeout(() => {
    updateTimer = null;
    const sorted = Object.entries(cmdFrequency).sort((a, b) => b[1] - a[1]).slice(0, 8);
    quickbar.innerHTML = '';
    sorted.forEach(([cmd]) => {
      const btn = document.createElement('button');
      btn.className = 'qbtn';
      btn.dataset.cmd = cmd;
      btn.textContent = cmd;
      btn.addEventListener('click', () => {
        import('./main.js').then(mod => {
          mod.execute(cmd);
          document.getElementById('cmdInput').focus();
        });
      });
      quickbar.appendChild(btn);
    });
  }, 300);
}

export function recordCmd(cmd) {
  if (!cmdFrequency[cmd]) cmdFrequency[cmd] = 0;
  cmdFrequency[cmd]++;
  localStorage.setItem('nexus_cmdfreq', JSON.stringify(cmdFrequency));
}

export function applyTheme(name) {
  const t = themes[name] || themes.default;
  const r = document.documentElement;
  r.style.setProperty('--neon-cyan', t.cyan);
  r.style.setProperty('--neon-blue', t.blue);
  r.style.setProperty('--scroll-thumb', t.thumb);
  r.style.setProperty('--bg-deep', t.bg);
  localStorage.setItem('nexus_theme', name);
}
