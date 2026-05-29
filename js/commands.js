// ============================================================
//  commands.js - Command registry
// ============================================================

import { add, esc } from './ui.js';
import {
  weather, joke, crypto, news, ipInfo, dnsLookup, currency, github, spacex, quote,
  sportsSchedule, sportsScores, sportsTable, sportsTeam, gameDeals,
  reddit, stocks, translate
} from './api.js';
import {
  vaultSetPassword, vaultUnlock, vaultAdd, vaultList, vaultDelete, vaultLock
} from './vault.js';
import {
  fsList, fsCreate, fsRead, fsDelete, fsSearch
} from './fs.js';
import {
  addAlias, listAliases, removeAlias
} from './alias.js';
import { applyTheme, themes } from './config.js';
import {
  safeCalc, worldClock, genPass, reverseText, upperText, lowerText, lenText, echoText, qrCode
} from './utils.js';
import { cacheClear } from './api.js';

export const commands = {};

export function registerCommands() {
  commands.help = {
    exec: function() {
      add('<strong>=== All Commands (click to load) ===</strong>', 'highlight');
      const cmdList = [
        ['WEATHER <city>', 'weather'],
        ['JOKE [count]', 'joke'],
        ['CRYPTO [coins]', 'crypto'],
        ['NEWS', 'news'],
        ['IP', 'ip'],
        ['DNS <domain>', 'dns'],
        ['CURRENCY <from> <to> [amount]', 'currency'],
        ['GITHUB <user>', 'github'],
        ['SPACEX', 'spacex'],
        ['QUOTE', 'quote'],
        ['SPORTS schedule <league>', 'sports schedule'],
        ['SPORTS scores <league>', 'sports scores'],
        ['SPORTS table <league>', 'sports table'],
        ['SPORTS team <name>', 'sports team'],
        ['GAMES deals', 'games deals'],
        ['TIME', 'time'],
        ['DATE', 'date'],
        ['CALC <expression>', 'calc'],
        ['GENPASS [length]', 'genpass'],
        ['REVERSE <text>', 'reverse'],
        ['UPPER <text>', 'upper'],
        ['LOWER <text>', 'lower'],
        ['LEN <text>', 'len'],
        ['ECHO <text>', 'echo'],
        ['FACT', 'fact'],
        ['WIKI <term>', 'wiki'],
        ['DEFINE <word>', 'define'],
        ['QR <text>', 'qr'],
        ['RANDOMUSER', 'randomuser'],
        ['BORED', 'bored'],
        ['CATFACT', 'catfact'],
        ['DOG', 'dog'],
        ['REDDIT <subreddit> [limit]', 'reddit'],
        ['STOCKS <symbol>', 'stocks'],
        ['TRANSLATE <text> <target>', 'translate'],
        ['FS ls|create|read|delete|search', 'fs'],
        ['VAULT setpass|unlock|add|list|delete|lock', 'vault'],
        ['ALIAS <name> <command>', 'alias'],
        ['ALIAS list', 'alias list'],
        ['ALIAS remove <name>', 'alias remove'],
        ['THEME <name>', 'theme'],
        ['CACHE clear', 'cache clear'],
        ['CLEAR', 'clear'],
        ['ABOUT', 'about']
      ];
      cmdList.forEach(([label, cmdBase]) => {
        add('<span class="clickable-cmd" data-cmd="' + esc(cmdBase) + '">' + esc(label) + '</span>', 'info');
      });
    }
  };

  commands.weather = { exec: function(args) { if (!args.length) { add('Usage: weather <city>', 'err'); } else { weather(args
          .join(' ')); } } };
  commands.joke = { exec: function(args) { joke(args[0] ? Math.min(parseInt(args[0]), 10) : 1); } };
  commands.crypto = { exec: function(args) { crypto(args.join(',') || 'bitcoin,ethereum'); } };
  commands.news = { exec: news };
  commands.ip = { exec: ipInfo };
  commands.dns = { exec: function(args) { if (!args.length) { add('Usage: dns <domain>', 'err'); } else { dnsLookup(args[
            0]); } } };
  commands.currency = { exec: function(args) { currency(args[0] || 'USD', args[1] || 'EUR', args[2] ? parseFloat(args[
          2]) : 1); } };
  commands.github = { exec: function(args) { if (!args.length) { add('Usage: github <user>', 'err'); } else { github(args[
            0]); } } };
  commands.spacex = { exec: spacex };
  commands.quote = { exec: quote };
  commands.sports = {
    exec: function(args) {
      if (args[0] === 'schedule' && args[1]) sportsSchedule(args.slice(1).join(' '));
      else if (args[0] === 'scores' && args[1]) sportsScores(args.slice(1).join(' '));
      else if (args[0] === 'table' && args[1]) sportsTable(args.slice(1).join(' '));
      else if (args[0] === 'team' && args[1]) sportsTeam(args.slice(1).join(' '));
      else add('Usage: sports <schedule|scores|table|team> <league/team>', 'err');
    }
  };
  commands.games = { exec: function(args) { if (args[0] === 'deals') gameDeals();
      else add('Usage: games deals', 'err'); } };
  commands.time = { exec: worldClock };
  commands.date = { exec: function() { add(new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric',
          month: 'long', day: 'numeric' }), 'ok'); } };
  commands.calc = {
    exec: function(args) {
      if (!args.length) { add('Usage: calc <expression>', 'err'); return; }
      try {
        const res = safeCalc(args.join(''));
        add(args.join('') + ' = ' + res, 'ok');
      } catch (e) {
        add('Invalid expression. Use numbers and + - * / ( ).', 'err');
      }
    }
  };
  commands.math = { exec: function(args) { commands.calc.exec(args); } };
  commands.genpass = { exec: function(args) { genPass(args[0] ? parseInt(args[0]) : 12); } };
  commands.reverse = { exec: function(args) { if (!args.length) { add('Usage: reverse <text>', 'err'); } else { reverseText(
          args.join(' ')); } } };
  commands.upper = { exec: function(args) { if (!args.length) { add('Usage: upper <text>', 'err'); } else { upperText(args
          .join(' ')); } } };
  commands.lower = { exec: function(args) { if (!args.length) { add('Usage: lower <text>', 'err'); } else { lowerText(args
          .join(' ')); } } };
  commands.len = { exec: function(args) { if (!args.length) { add('Usage: len <text>', 'err'); } else { lenText(args.join(
            ' ')); } } };
  commands.echo = { exec: function(args) { if (!args.length) { add('Usage: echo <text>', 'err'); } else { echoText(args
          .join(' ')); } } };
  commands.fact = { exec: function() {
      import('./api.js').then(mod => mod.randomFact());
    } };
  commands.wiki = { exec: function(args) { if (!args[0]) { add('Usage: wiki <search term>', 'err'); } else {
      import('./api.js').then(mod => mod.wikiSearch(args.join(' ')));
    } } };
  commands.define = { exec: function(args) { if (!args[0]) { add('Usage: define <word>', 'err'); } else {
      import('./api.js').then(mod => mod.defineWord(args[0]));
    } } };
  commands.qr = { exec: function(args) { if (!args[0]) { add('Usage: qr <text>', 'err'); } else { qrCode(args.join(
            ' ')); } } };
  commands.randomuser = { exec: function() {
      import('./api.js').then(mod => mod.randomUser());
    } };
  commands.bored = { exec: function() {
      import('./api.js').then(mod => mod.boredActivity());
    } };
  commands.catfact = { exec: function() {
      import('./api.js').then(mod => mod.catFact());
    } };
  commands.dog = { exec: function() {
      import('./api.js').then(mod => mod.dogImage());
    } };
  commands.reddit = { exec: function(args) { reddit(args[0] || 'all', args[1] || 5); } };
  commands.stocks = { exec: function(args) { stocks(args[0] || 'AAPL'); } };
  commands.translate = { exec: function(args) { if (args.length < 2) { add('Usage: translate <text> <target>', 'err'); } else {
        const target = args.pop();
        translate(args.join(' '), target);
      } } };
  commands.fs = {
    exec: function(args) {
      if (args[0] === 'ls' || args[0] === 'list') fsList();
      else if (args[0] === 'create' && args[1]) fsCreate(args[1], args.slice(2).join(' '));
      else if (args[0] === 'read' && args[1]) fsRead(args[1]);
      else if (args[0] === 'delete' && args[1]) fsDelete(args[1]);
      else if (args[0] === 'search' && args[1]) fsSearch(args[1]);
      else add('Usage: fs <ls|create|read|delete|search> ...', 'err');
    }
  };
  commands.vault = {
    exec: function(args) {
      if (args[0] === 'setpass' && args[1]) vaultSetPassword(args[1]);
      else if (args[0] === 'unlock' && args[1]) vaultUnlock(args[1]);
      else if (args[0] === 'add' && args.slice(1).join(' ')) vaultAdd(args.slice(1).join(' '));
      else if (args[0] === 'list') vaultList();
      else if (args[0] === 'delete' && args[1]) vaultDelete(parseInt(args[1]));
      else if (args[0] === 'lock') vaultLock();
      else add('Usage: vault <setpass|unlock|add|list|delete|lock> [args]', 'err');
    }
  };
  commands.alias = {
    exec: function(args) {
      if (args[0] === 'list') listAliases();
      else if (args[0] === 'remove' && args[1]) removeAlias(args[1]);
      else if (args.length >= 2) addAlias(args[0], args.slice(1).join(' '));
      else add('Usage: alias <name> <command> or alias list or alias remove <name>', 'err');
    }
  };
  commands.theme = {
    exec: function(args) {
      if (args[0] && themes[args[0]]) { applyTheme(args[0]);
        add('Theme set to ' + args[0] + '.', 'ok'); } else add('Available: ' + Object.keys(themes).join(', '),
        'info');
    }
  };
  commands.cache = {
    exec: function(args) {
      if (args[0] === 'clear') { cacheClear();
        add('Cache cleared.', 'ok'); } else add('Usage: cache clear', 'err');
    }
  };
  commands.clear = { exec: function() {
      import('./ui.js').then(mod => {
        mod.output.innerHTML = '';
        mod.outputLines.length = 0;
        add('Terminal cleared.', 'info');
      });
    } };
  commands.about = { exec: function() { add('<div class="block"><strong>Nexus Terminal Pro v4.3</strong><br>Professional command hub with real-time APIs, vault, tools, and more.<br>Marvic Studios UG</div>',
        'ok'); } };
}
