// fs.js - Virtual file system with path validation

import { add, esc } from './ui.js';

export function fsSanitize(name) {
  if (!name || typeof name !== 'string') return null;
  if (name.includes('..') || name.includes('/') || name.includes('\\')) {
    return null;
  }
  return name.replace(/[^a-zA-Z0-9_\-\.]/g, '');
}

export function fsList() {
  const files = JSON.parse(localStorage.getItem('nexus_fs') || '{}');
  const names = Object.keys(files);
  if (!names.length) {
    add('FS empty.', 'info');
  } else {
    names.forEach(n => add(esc(n) + ' (' + files[n].length + ' bytes)', 'ok'));
  }
}

export function fsCreate(name, content = '') {
  const safe = fsSanitize(name);
  if (!safe) {
    add('Invalid filename (no path traversal, alphanumeric only).', 'err');
    return;
  }
  const f = JSON.parse(localStorage.getItem('nexus_fs') || '{}');
  if (f[safe]) {
    add('File exists.', 'err');
    return;
  }
  f[safe] = String(content || '');
  localStorage.setItem('nexus_fs', JSON.stringify(f));
  add('Created "' + esc(safe) + '".', 'ok');
}

export function fsRead(name) {
  const safe = fsSanitize(name);
  if (!safe) {
    add('Invalid filename.', 'err');
    return;
  }
  const f = JSON.parse(localStorage.getItem('nexus_fs') || '{}');
  if (!f[safe]) {
    add('File not found.', 'err');
    return;
  }
  add('<div class="block"><strong>' + esc(safe) + '</strong><br>' + esc(f[safe]) + '</div>', 'ok');
}

export function fsDelete(name) {
  const safe = fsSanitize(name);
  if (!safe) {
    add('Invalid filename.', 'err');
    return;
  }
  const f = JSON.parse(localStorage.getItem('nexus_fs') || '{}');
  if (!f[safe]) {
    add('File not found.', 'err');
    return;
  }
  delete f[safe];
  localStorage.setItem('nexus_fs', JSON.stringify(f));
  add('Deleted "' + esc(safe) + '".', 'ok');
}

export function fsSearch(query) {
  if (!query) {
    add('Usage: fs search <query>', 'err');
    return;
  }
  const f = JSON.parse(localStorage.getItem('nexus_fs') || '{}');
  const results = [];
  Object.keys(f).forEach(name => {
    if (name.includes(query) || f[name].includes(query)) {
      results.push(name);
    }
  });
  if (!results.length) {
    add('No matches.', 'info');
  } else {
    add('<strong>Search results:</strong>', 'highlight');
    results.forEach(n => add(esc(n), 'ok'));
  }
}
