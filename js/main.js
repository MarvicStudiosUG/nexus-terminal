// ============================================================
//  main.js - Entry point: initializes all modules and events
// ============================================================

import { add, cmdEcho, output, outputLines, updateQuickbar, recordCmd, applyTheme } from './ui.js';
import { commands, registerCommands } from './commands.js';
import { vaultInit } from './vault.js';
import { aliasInit, resolveAlias, getAliases } from './alias.js';
import { themes } from './config.js';
import { safeCalc } from './utils.js';

// ============================================================
//  State
// ============================================================
export const history = JSON.parse(localStorage.getItem('nexus_history') || '[]');
export let histIdx = history.length;
export let sessionCommands = 0;
export let sessionStart = Date.now();
export const cmdFrequency = JSON.parse(localStorage.getItem('nexus_cmdfreq') || '{}');
export let commandCount = 0;

// DOM refs
const input = document.getElementById('cmdInput');
const execBtn = document.getElementById('execBtn');
const clockEl = document.getElementById('liveClock');
const settingsPanel = document.getElementById('settingsPanel');
const themeSelect = document.getElementById('themeSelect');
const sessionStats = document.getElementById('sessionStats');
const quickbar = document.getElementById('quickbar');
const dropOverlay = document.getElementById('dropOverlay');
const aliasInput = document.getElementById('aliasInput');
const aliasAddBtn = document.getElementById('aliasAddBtn');
const fontSizeSlider = document.getElementById('fontSizeSlider');

// ============================================================
//  UI Helpers
// ============================================================
function updateStats() {
  const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  sessionStats.textContent = 'Commands: ' + sessionCommands + ' | Session: ' + mins + 'm ' + secs + 's';
}

function tick() {
  clockEl.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false });
  updateStats();
}
setInterval(tick, 1000);
tick();

// ============================================================
//  Execute Command
// ============================================================
export async function execute(raw) {
  if (!raw || !raw.trim()) return;
  const resolved = resolveAlias(raw.trim());
  if (resolved !== raw.trim()) {
    add('(alias) ' + esc(resolved), 'info');
  }
  const parts = resolved.trim().split(/\s+/);
  const main = parts[0].toLowerCase();
  const args = parts.slice(1);

  cmdEcho(resolved);

  history.push(resolved);
  histIdx = history.length;
  if (history.length > 200) history = history.slice(-200);
  localStorage.setItem('nexus_history', JSON.stringify(history));

  const cmd = main;
  recordCmd(cmd);
  sessionCommands++;
  commandCount++;
  if (commandCount % 5 === 0) updateQuickbar();

  if (commands[cmd]) {
    try {
      await commands[cmd].exec(args);
    } catch (e) {
      add('Error: ' + esc(e.message), 'err');
    }
  } else {
    add('Unknown command: ' + esc(cmd) + '. Type help.', 'err');
  }
}

// ============================================================
//  Autocomplete (Tab)
// ============================================================
function getCompletions(prefix) {
  const cmdNames = Object.keys(commands);
  const completions = [];
  const lower = prefix.toLowerCase();
  cmdNames.forEach(name => {
    if (name.startsWith(lower)) completions.push(name);
  });
  const aliasNames = Object.keys(getAliases());
  aliasNames.forEach(name => {
    if (name.startsWith(lower)) completions.push(name);
  });
  return completions.sort();
}

input.addEventListener('keydown', function(e) {
  if (e.key === 'Tab') {
    e.preventDefault();
    const val = input.value.trim();
    if (!val) return;
    const parts = val.split(/\s+/);
    const prefix = parts[0];
    const completions = getCompletions(prefix);
    if (completions.length === 1) {
      parts[0] = completions[0];
      input.value = parts.join(' ') + ' ';
    } else if (completions.length > 1) {
      add('Completions: ' + completions.join('  '), 'info');
    }
  }
  if (e.ctrlKey && e.key === 'r') {
    e.preventDefault();
    const search = prompt('Search command history:', '');
    if (search) {
      let found = null;
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].includes(search)) { found = history[i]; break; }
      }
      if (found) {
        input.value = found;
        add('Found: ' + esc(found), 'info');
      } else {
        add('No matches found.', 'info');
      }
    }
  }
  if (e.ctrlKey && e.key === 'l') {
    e.preventDefault();
    output.innerHTML = '';
    outputLines.length = 0;
    add('Terminal cleared.', 'info');
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (histIdx > 0) {
      histIdx--;
      input.value = history[histIdx] || '';
    }
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (histIdx < history.length - 1) {
      histIdx++;
      input.value = history[histIdx] || '';
    } else {
      histIdx = history.length;
      input.value = '';
    }
  }
});

// ============================================================
//  Event Listeners
// ============================================================
execBtn.addEventListener('click', function() {
  execute(input.value);
  input.value = '';
  input.focus();
});

input.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    execute(input.value);
    input.value = '';
  }
});

document.getElementById('clearBtn').addEventListener('click', function() {
  output.innerHTML = '';
  outputLines.length = 0;
  add('Terminal cleared.', 'info');
});

document.getElementById('settingsToggle').addEventListener('click', function() {
  settingsPanel.classList.toggle('active');
});

document.querySelector('.terminal').addEventListener('click', function(e) {
  if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') input.focus();
});

themeSelect.addEventListener('change', function(e) {
  applyTheme(e.target.value);
});

fontSizeSlider.addEventListener('input', function(e) {
  const val = e.target.value;
  document.documentElement.style.fontSize = val + 'px';
  document.getElementById('fontSizeValue').textContent = val + 'px';
  localStorage.setItem('nexus_fontSize', val);
});

aliasAddBtn.addEventListener('click', function() {
  const val = aliasInput.value.trim();
  if (!val) { add('Usage: alias <name> <command>', 'err'); return; }
  const parts = val.split('=');
  if (parts.length === 2) {
    import('./alias.js').then(mod => {
      mod.addAlias(parts[0].trim(), parts[1].trim());
    });
  } else {
    add('Format: alias=command (e.g. gs=git status)', 'err');
  }
  aliasInput.value = '';
});

aliasInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') aliasAddBtn.click();
});

// Clickable commands
output.addEventListener('click', function(e) {
  const cmdEl = e.target.closest('.clickable-cmd');
  if (!cmdEl) return;
  const cmd = cmdEl.dataset.cmd;
  if (cmd) {
    input.value = cmd;
    input.focus();
  }
});

// ============================================================
//  Drag & Drop
// ============================================================
let dragCounter = 0;
const terminalEl = document.getElementById('app');

terminalEl.addEventListener('dragenter', function(e) {
  e.preventDefault();
  dragCounter++;
  dropOverlay.classList.add('active');
});

terminalEl.addEventListener('dragover', function(e) {
  e.preventDefault();
});

terminalEl.addEventListener('dragleave', function(e) {
  e.preventDefault();
  dragCounter--;
  if (dragCounter === 0) dropOverlay.classList.remove('active');
});

terminalEl.addEventListener('drop', function(e) {
  e.preventDefault();
  dragCounter = 0;
  dropOverlay.classList.remove('active');
  const files = e.dataTransfer.files;
  if (!files.length) return;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const reader = new FileReader();
    reader.onload = function(ev) {
      import('./fs.js').then(mod => {
        const name = mod.fsSanitize(file.name);
        if (!name) {
          add('Invalid filename: ' + esc(file.name), 'err');
          return;
        }
        const f = JSON.parse(localStorage.getItem('nexus_fs') || '{}');
        if (f[name]) {
          add('File "' + esc(name) + '" already exists. Use fs delete first.', 'err');
          return;
        }
        f[name] = ev.target.result;
        localStorage.setItem('nexus_fs', JSON.stringify(f));
        add('Uploaded "' + esc(name) + '" (' + ev.target.result.length + ' bytes).', 'ok');
      });
    };
    reader.readAsText(file);
  }
});

// ============================================================
//  Init
// ============================================================
function init() {
  // Register commands from commands.js
  registerCommands();

  // Init modules
  vaultInit();
  aliasInit();

  // Theme
  const savedTheme = localStorage.getItem('nexus_theme') || 'default';
  themeSelect.value = savedTheme;
  applyTheme(savedTheme);

  // Font size
  const savedFont = localStorage.getItem('nexus_fontSize') || '14';
  fontSizeSlider.value = savedFont;
  document.documentElement.style.fontSize = savedFont + 'px';
  document.getElementById('fontSizeValue').textContent = savedFont + 'px';

  // Welcome
  add('<div class="block"><strong>Nexus Terminal Pro v4.3</strong><br>Type <span class="cmd">help</span> to see all commands.</div>',
    'ok');
  add('Ready.', 'info');

  updateQuickbar();
  input.focus();
}

init();
