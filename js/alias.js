// ============================================================
//  alias.js - Command alias management
// ============================================================

import { add, esc } from './ui.js';

let aliases = JSON.parse(localStorage.getItem('nexus_aliases') || '{}');

export function getAliases() {
  return aliases;
}

export function addAlias(alias, command) {
  if (!alias || !command) {
    add('Usage: alias <name> <command>', 'err');
    return;
  }
  alias = alias.trim();
  command = command.trim();
  if (alias.includes(' ') || alias.includes('=')) {
    add('Alias name cannot contain spaces or equals.', 'err');
    return;
  }
  aliases[alias] = command;
  localStorage.setItem('nexus_aliases', JSON.stringify(aliases));
  add('Alias "' + esc(alias) + '" -> "' + esc(command) + '"', 'ok');
}

export function listAliases() {
  const keys = Object.keys(aliases);
  if (!keys.length) {
    add('No aliases defined.', 'info');
    return;
  }
  add('<strong>Aliases:</strong>', 'highlight');
  keys.forEach(k => add(esc(k) + ' = ' + esc(aliases[k]), 'ok'));
}

export function removeAlias(alias) {
  alias = alias.trim();
  if (!aliases[alias]) {
    add('Alias not found.', 'err');
    return;
  }
  delete aliases[alias];
  localStorage.setItem('nexus_aliases', JSON.stringify(aliases));
  add('Alias "' + esc(alias) + '" removed.', 'ok');
}

export function resolveAlias(cmd) {
  const parts = cmd.trim().split(/\s+/);
  const first = parts[0];
  if (aliases[first]) {
    const rest = parts.slice(1).join(' ');
    return aliases[first] + (rest ? ' ' + rest : '');
  }
  return cmd;
}

export function aliasInit() {
  // Ensure aliases are loaded
  aliases = JSON.parse(localStorage.getItem('nexus_aliases') || '{}');
}
