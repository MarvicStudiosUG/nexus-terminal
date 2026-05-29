// ============================================================
//  utils.js - Safe math parser, helpers, world clock, etc.
// ============================================================

import { add, esc } from './ui.js';
import { worldZones } from './config.js';

// ============================================================
//  Safe Math Parser (no eval, no Function)
// ============================================================
export function safeCalc(expr) {
  expr = expr.replace(/\s/g, '');
  if (!/^[0-9+\-*/().%]+$/.test(expr)) {
    throw new Error('Invalid characters in expression');
  }
  let tokens = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (ch >= '0' && ch <= '9') {
      let num = '';
      while (i < expr.length && ((expr[i] >= '0' && expr[i] <= '9') || expr[i] === '.')) {
        num += expr[i];
        i++;
      }
      tokens.push({ type: 'num', value: parseFloat(num) });
    } else if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '(' || ch === ')' || ch === '%') {
      tokens.push({ type: 'op', value: ch });
      i++;
    } else {
      throw new Error('Unexpected character: ' + ch);
    }
  }

  function parseExpr(pos) {
    let result = parseTerm(pos);
    let p = result.pos;
    while (p < tokens.length && (tokens[p].value === '+' || tokens[p].value === '-')) {
      const op = tokens[p].value;
      p++;
      const right = parseTerm(p);
      p = right.pos;
      if (op === '+') result.value += right.value;
      else result.value -= right.value;
    }
    return { value: result.value, pos: p };
  }

  function parseTerm(pos) {
    let result = parseFactor(pos);
    let p = result.pos;
    while (p < tokens.length && (tokens[p].value === '*' || tokens[p].value === '/' || tokens[p].value === '%')) {
      const op = tokens[p].value;
      p++;
      const right = parseFactor(p);
      p = right.pos;
      if (op === '*') result.value *= right.value;
      else if (op === '/') {
        if (right.value === 0) throw new Error('Division by zero');
        result.value /= right.value;
      } else if (op === '%') {
        if (right.value === 0) throw new Error('Modulo by zero');
        result.value %= right.value;
      }
    }
    return { value: result.value, pos: p };
  }

  function parseFactor(pos) {
    if (pos >= tokens.length) throw new Error('Unexpected end of expression');
    if (tokens[pos].type === 'num') {
      return { value: tokens[pos].value, pos: pos + 1 };
    }
    if (tokens[pos].value === '(') {
      const inner = parseExpr(pos + 1);
      if (inner.pos >= tokens.length || tokens[inner.pos].value !== ')') {
        throw new Error('Missing closing parenthesis');
      }
      return { value: inner.value, pos: inner.pos + 1 };
    }
    if (tokens[pos].value === '-') {
      const factor = parseFactor(pos + 1);
      return { value: -factor.value, pos: factor.pos };
    }
    throw new Error('Unexpected token: ' + tokens[pos].value);
  }

  const result = parseExpr(0);
  if (result.pos !== tokens.length) {
    throw new Error('Unexpected tokens after expression');
  }
  if (!isFinite(result.value) || isNaN(result.value)) {
    throw new Error('Invalid result');
  }
  return result.value;
}

// ============================================================
//  World Clock
// ============================================================
export function worldClock() {
  add('<strong>World Clock:</strong>', 'highlight');
  worldZones.forEach(z => {
    add(z.n + ': ' + new Date().toLocaleTimeString('en-US', { timeZone: z.tz, hour12: true }), 'ok');
  });
}

// ============================================================
//  Password Generator
// ============================================================
export function genPass(length = 12) {
  length = Math.min(parseInt(length) || 12, 50);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let pass = '';
  for (let i = 0; i < length; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  add('Generated password: ' + esc(pass), 'ok');
}

// ============================================================
//  Text Utilities
// ============================================================
export function reverseText(text) {
  add('Reversed: ' + esc(text.split('').reverse().join('')), 'ok');
}

export function upperText(text) {
  add('UPPER: ' + esc(text.toUpperCase()), 'ok');
}

export function lowerText(text) {
  add('lower: ' + esc(text.toLowerCase()), 'ok');
}

export function lenText(text) {
  add('Length: ' + text.length, 'ok');
}

export function echoText(text) {
  add(esc(text), 'ok');
}

// ============================================================
//  QR Code
// ============================================================
export function qrCode(text) {
  if (!text) {
    add('Usage: qr <text>', 'err');
    return;
  }
  const url = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(text);
  add('<img src="' + url +
    '" alt="QR Code" style="display:block;margin:0.5rem 0;border:2px solid var(--neon-cyan);border-radius:8px;">',
    'ok');
}
