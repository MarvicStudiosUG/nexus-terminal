// ============================================================
//  api.js - All external API functions with caching
// ============================================================

import { add, esc, loader, unloader } from './ui.js';
import { leagueMap } from './config.js';

const apiCache = new Map();

export function cacheGet(key) {
  const entry = apiCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    apiCache.delete(key);
    return null;
  }
  return entry.data;
}

export function cacheSet(key, data, ttl = 300000) {
  apiCache.set(key, { data, expiry: Date.now() + ttl });
}

export function cacheClear() {
  apiCache.clear();
}

// --- Weather ---
export async function weather(city) {
  const key = 'weather_' + city.toLowerCase();
  const cached = cacheGet(key);
  if (cached) {
    add('<div class="block"><strong>' + esc(cached.name) + ', ' + esc(cached.admin1 || '') + ' ' + esc(cached.country || '') +
      '</strong><br>Temperature: ' + cached.temp + '°C | Wind: ' + cached.wind + ' km/h</div>', 'ok');
    return;
  }
  const lid = loader('Weather for ' + city + '...');
  try {
    const geoRes = await fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(city) + '&count=1');
    if (!geoRes.ok) throw new Error('City not found');
    const geo = await geoRes.json();
    if (!geo.results || !geo.results.length) throw new Error('City not found');
    const loc = geo.results[0];
    const wRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=' + loc.latitude + '&longitude=' + loc.longitude +
      '&current_weather=true');
    if (!wRes.ok) throw new Error('Weather error');
    const w = await wRes.json();
    const data = { name: loc.name, admin1: loc.admin1 || '', country: loc.country || '', temp: w.current_weather.temperature,
      wind: w.current_weather.windspeed };
    cacheSet(key, data, 600000);
    unloader(lid);
    add('<div class="block"><strong>' + esc(data.name) + ', ' + esc(data.admin1 || '') + ' ' + esc(data.country || '') +
      '</strong><br>Temperature: ' + data.temp + '°C | Wind: ' + data.wind + ' km/h</div>', 'ok');
  } catch (e) {
    unloader(lid);
    add('Error: ' + esc(e.message), 'err');
  }
}

// --- Joke ---
export async function joke(count = 1) {
  count = Math.min(parseInt(count) || 1, 10);
  const lid = loader('Jokes...');
  try {
    const results = [];
    for (let i = 0; i < count; i++) {
      const r = await fetch('https://icanhazdadjoke.com/', { headers: { Accept: 'application/json' } });
      const d = await r.json();
      results.push(d.joke);
    }
    unloader(lid);
    results.forEach((j, idx) => {
      add('<div class="block"><strong>#' + (idx + 1) + '</strong><br>' + esc(j) + '</div>', 'ok');
    });
  } catch {
    unloader(lid);
    add('Joke service unavailable.', 'err');
  }
}

// --- Crypto ---
export async function crypto(coins = 'bitcoin,ethereum') {
  const key = 'crypto_' + coins;
  const cached = cacheGet(key);
  if (cached) {
    add('<strong>Live Prices (cached):</strong>', 'highlight');
    Object.entries(cached).forEach(([coin, val]) => {
      add(coin.toUpperCase() + ': $' + val.usd + ' (24h: ' + (val.usd_24h_change !== undefined ? val.usd_24h_change.toFixed(
        2) : 'N/A') + '%)', 'ok');
    });
    return;
  }
  const lid = loader('Crypto prices...');
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=' + coins +
      '&vs_currencies=usd&include_24hr_change=true');
    if (!r.ok) throw new Error('API error');
    const d = await r.json();
    cacheSet(key, d, 120000);
    unloader(lid);
    add('<strong>Live Prices:</strong>', 'highlight');
    Object.entries(d).forEach(([coin, val]) => {
      add(coin.toUpperCase() + ': $' + val.usd + ' (24h: ' + (val.usd_24h_change !== undefined ? val.usd_24h_change
        .toFixed(2) : 'N/A') + '%)', 'ok');
    });
  } catch {
    unloader(lid);
    add('Crypto unavailable.', 'err');
  }
}

// --- News ---
export async function news() {
  const key = 'hackernews';
  const cached = cacheGet(key);
  if (cached) {
    add('<strong>Tech Headlines (cached):</strong>', 'highlight');
    cached.forEach((it, i) => {
      add('<div class="block">' + (i + 1) + '. <a href="' + esc(it.url || '#') +
        '" target="_blank" rel="noopener" style="color:#00ffcc;">' + esc(it.title) + '</a> (' + it.score + ' pts)</div>',
        'ok');
    });
    return;
  }
  const lid = loader('News...');
  try {
    const ids = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json').then(r => r.json());
    const items = await Promise.all(ids.slice(0, 5).map(id =>
      fetch('https://hacker-news.firebaseio.com/v0/item/' + id + '.json').then(r => r.json())
    ));
    cacheSet(key, items, 600000);
    unloader(lid);
    add('<strong>Tech Headlines:</strong>', 'highlight');
    items.forEach((it, i) => {
      add('<div class="block">' + (i + 1) + '. <a href="' + esc(it.url || '#') +
        '" target="_blank" rel="noopener" style="color:#00ffcc;">' + esc(it.title) + '</a> (' + it.score + ' pts)</div>',
        'ok');
    });
  } catch {
    unloader(lid);
    add('News unavailable.', 'err');
  }
}

// --- IP Info ---
export async function ipInfo() {
  const key = 'ipinfo';
  const cached = cacheGet(key);
  if (cached) {
    add('<div class="block">IP: ' + esc(cached.ip) + ' | Location: ' + esc(cached.city) + ', ' + esc(cached.region) +
      ' ' + esc(cached.country_name) + ' | ISP: ' + esc(cached.org) + '</div>', 'ok');
    return;
  }
  const lid = loader('IP lookup...');
  try {
    const d = await fetch('https://ipapi.co/json/').then(r => r.json());
    cacheSet(key, d, 3600000);
    unloader(lid);
    add('<div class="block">IP: ' + esc(d.ip) + ' | Location: ' + esc(d.city) + ', ' + esc(d.region) + ' ' + esc(d
      .country_name) + ' | ISP: ' + esc(d.org) + '</div>', 'ok');
  } catch {
    unloader(lid);
    add('IP lookup failed.', 'err');
  }
}

// --- DNS ---
export async function dnsLookup(domain) {
  const key = 'dns_' + domain;
  const cached = cacheGet(key);
  if (cached) {
    cached.forEach(r => add(r.type + ': ' + esc(r.data), 'ok'));
    return;
  }
  const lid = loader('DNS for ' + domain + '...');
  try {
    const d = await fetch('https://dns.google/resolve?name=' + encodeURIComponent(domain) + '&type=A').then(r => r.json());
    unloader(lid);
    if (d.Answer) {
      cacheSet(key, d.Answer, 600000);
      d.Answer.forEach(r => add(r.type + ': ' + esc(r.data), 'ok'));
    } else {
      add('No A records found.', 'err');
    }
  } catch {
    unloader(lid);
    add('DNS failed.', 'err');
  }
}

// --- Currency ---
export async function currency(from = 'USD', to = 'EUR', amount = 1) {
  from = from.toUpperCase();
  to = to.toUpperCase();
  amount = parseFloat(amount) || 1;
  const key = 'currency_' + from + '_' + to;
  const cached = cacheGet(key);
  if (cached) {
    add('<div class="block">' + amount + ' ' + from + ' = <strong>' + (amount * cached).toFixed(2) + ' ' + to +
      '</strong> (rate: ' + cached + ')</div>', 'ok');
    return;
  }
  const lid = loader('Currency...');
  try {
    const d = await fetch('https://api.exchangerate-api.com/v4/latest/' + from).then(r => r.json());
    const rate = d.rates[to];
    if (!rate) throw new Error('Invalid currency');
    cacheSet(key, rate, 3600000);
    unloader(lid);
    add('<div class="block">' + amount + ' ' + from + ' = <strong>' + (amount * rate).toFixed(2) + ' ' + to +
      '</strong> (rate: ' + rate + ')</div>', 'ok');
  } catch (e) {
    unloader(lid);
    add('Currency error: ' + esc(e.message), 'err');
  }
}

// --- GitHub ---
export async function github(username) {
  const key = 'github_' + username;
  const cached = cacheGet(key);
  if (cached) {
    const { user, repos } = cached;
    add('<div class="block"><strong>' + esc(user.name || user.login) + '</strong> | Followers: ' + user.followers +
      ' | Repos: ' + user.public_repos + '<br>Bio: ' + esc(user.bio || 'N/A') + '</div>', 'ok');
    if (repos.length) {
      add('<strong>Top Repos:</strong>', 'highlight');
      repos.forEach(r => {
        add(r.stargazers_count + '* <a href="' + esc(r.html_url) + '" target="_blank" style="color:#00ffcc;">' +
          esc(r.name) + '</a>: ' + esc(r.description || ''), 'ok');
      });
    }
    return;
  }
  const lid = loader('GitHub...');
  try {
    const [user, repos] = await Promise.all([
      fetch('https://api.github.com/users/' + username).then(r => r.json()),
      fetch('https://api.github.com/users/' + username + '/repos?sort=stars&per_page=5').then(r => r.json())
    ]);
    if (!user.login) throw new Error('GitHub error');
    cacheSet(key, { user, repos }, 600000);
    unloader(lid);
    add('<div class="block"><strong>' + esc(user.name || user.login) + '</strong> | Followers: ' + user.followers +
      ' | Repos: ' + user.public_repos + '<br>Bio: ' + esc(user.bio || 'N/A') + '</div>', 'ok');
    if (repos.length) {
      add('<strong>Top Repos:</strong>', 'highlight');
      repos.forEach(r => {
        add(r.stargazers_count + '* <a href="' + esc(r.html_url) + '" target="_blank" style="color:#00ffcc;">' +
          esc(r.name) + '</a>: ' + esc(r.description || ''), 'ok');
      });
    }
  } catch {
    unloader(lid);
    add('GitHub error.', 'err');
  }
}

// --- SpaceX ---
export async function spacex() {
  const key = 'spacex';
  const cached = cacheGet(key);
  if (cached) {
    add('<div class="block"><strong>SpaceX</strong><br>Next: ' + esc(cached.next.name) + ' (' + new Date(cached.next
      .date_utc).toLocaleString() + ')<br>Latest: ' + esc(cached.latest.name) + ' - ' + (cached.latest.success ?
      'Success' : 'Failed') + '</div>', 'ok');
    return;
  }
  const lid = loader('SpaceX...');
  try {
    const [next, latest] = await Promise.all([
      fetch('https://api.spacexdata.com/v5/launches/next').then(r => r.json()),
      fetch('https://api.spacexdata.com/v5/launches/latest').then(r => r.json())
    ]);
    cacheSet(key, { next, latest }, 3600000);
    unloader(lid);
    add('<div class="block"><strong>SpaceX</strong><br>Next: ' + esc(next.name) + ' (' + new Date(next.date_utc)
      .toLocaleString() + ')<br>Latest: ' + esc(latest.name) + ' - ' + (latest.success ? 'Success' : 'Failed') +
      '</div>', 'ok');
  } catch {
    unloader(lid);
    add('SpaceX error.', 'err');
  }
}

// --- Quote ---
export async function quote() {
  const key = 'quote';
  const cached = cacheGet(key);
  if (cached) {
    add('<div class="block">"' + esc(cached.content) + '"<br><span style="color:var(--dim);">-- ' + esc(cached.author) +
      '</span></div>', 'ok');
    return;
  }
  const lid = loader('Quote...');
  try {
    const d = await fetch('https://api.quotable.io/random').then(r => r.json());
    cacheSet(key, d, 600000);
    unloader(lid);
    add('<div class="block">"' + esc(d.content) + '"<br><span style="color:var(--dim);">-- ' + esc(d.author) +
      '</span></div>', 'ok');
  } catch {
    unloader(lid);
    add('Quote error.', 'err');
  }
}

// --- Sports ---
export function getLeagueId(name) {
  return leagueMap[name.toLowerCase()] || null;
}

export async function sportsSchedule(league) {
  const lid = loader('Schedule for ' + league + '...');
  let leagueId = getLeagueId(league);
  if (!leagueId) {
    try {
      const res = await fetch('https://www.thesportsdb.com/api/v1/json/1/search_all_leagues.php?l=' + encodeURIComponent(
        league));
      const data = await res.json();
      if (data.leagues && data.leagues.length) leagueId = data.leagues[0].idLeague;
    } catch {}
  }
  if (!leagueId) {
    unloader(lid);
    add('League not found (try EPL, La Liga).', 'err');
    return;
  }
  try {
    const res = await fetch('https://www.thesportsdb.com/api/v1/json/1/eventsnextleague.php?id=' + leagueId);
    const data = await res.json();
    unloader(lid);
    if (!data.events || !data.events.length) {
      add('No upcoming events.', 'info');
      return;
    }
    add('<strong>Upcoming matches:</strong>', 'highlight');
    data.events.slice(0, 10).forEach(e => {
      add(esc(e.strEvent) + ': ' + esc(e.strHomeTeam) + ' vs ' + esc(e.strAwayTeam) + ' (' + e.dateEvent + ')',
        'ok');
    });
  } catch {
    unloader(lid);
    add('Schedule error.', 'err');
  }
}

export async function sportsScores(league) {
  const lid = loader('Scores for ' + league + '...');
  let leagueId = getLeagueId(league);
  if (!leagueId) {
    try {
      const res = await fetch('https://www.thesportsdb.com/api/v1/json/1/search_all_leagues.php?l=' + encodeURIComponent(
        league));
      const data = await res.json();
      if (data.leagues && data.leagues.length) leagueId = data.leagues[0].idLeague;
    } catch {}
  }
  if (!leagueId) {
    unloader(lid);
    add('League not found.', 'err');
    return;
  }
  try {
    const res = await fetch('https://www.thesportsdb.com/api/v1/json/1/eventspastleague.php?id=' + leagueId);
    const data = await res.json();
    unloader(lid);
    if (!data.events || !data.events.length) {
      add('No recent results.', 'info');
      return;
    }
    add('<strong>Recent results:</strong>', 'highlight');
    data.events.slice(0, 10).forEach(e => {
      const score = (e.intHomeScore != null) ? e.intHomeScore + '-' + e.intAwayScore : '?';
      add(esc(e.strHomeTeam) + ' ' + score + ' ' + esc(e.strAwayTeam) + ' (' + e.dateEvent + ')', 'ok');
    });
  } catch {
    unloader(lid);
    add('Scores error.', 'err');
  }
}

export async function sportsTable(league) {
  const lid = loader('Table for ' + league + '...');
  let leagueId = getLeagueId(league);
  if (!leagueId) {
    try {
      const res = await fetch('https://www.thesportsdb.com/api/v1/json/1/search_all_leagues.php?l=' + encodeURIComponent(
        league));
      const data = await res.json();
      if (data.leagues && data.leagues.length) leagueId = data.leagues[0].idLeague;
    } catch {}
  }
  if (!leagueId) {
    unloader(lid);
    add('League not found.', 'err');
    return;
  }
  try {
    const res = await fetch('https://www.thesportsdb.com/api/v1/json/1/lookuptable.php?id=' + leagueId +
      '&s=2024-2025');
    const data = await res.json();
    unloader(lid);
    if (!data.table || !data.table.length) {
      add('No standings available for current season.', 'info');
      return;
    }
    add('<strong>League Table:</strong>', 'highlight');
    data.table.slice(0, 10).forEach(t => {
      add(t.intRank + '. ' + esc(t.strTeam) + ' - P:' + t.intPlayed + ' W:' + t.intWin + ' D:' + t.intDraw +
        ' L:' + t.intLoss + ' Pts:' + t.intPoints, 'ok');
    });
  } catch {
    unloader(lid);
    add('Table error.', 'err');
  }
}

export async function sportsTeam(name) {
  const lid = loader('Team info: ' + name + '...');
  try {
    const res = await fetch('https://www.thesportsdb.com/api/v1/json/1/searchteams.php?t=' + encodeURIComponent(name));
    const data = await res.json();
    unloader(lid);
    if (!data.teams || !data.teams.length) {
      add('Team not found. Try a different spelling.', 'err');
      return;
    }
    const t = data.teams[0];
    add('<div class="block"><strong>' + esc(t.strTeam) + '</strong> (' + esc(t.strLeague || 'Unknown') +
      ')<br>Stadium: ' + esc(t.strStadium || 'N/A') + '<br>' + esc((t.strDescriptionEN || '').substring(0, 150)) +
      '...</div>', 'ok');
  } catch {
    unloader(lid);
    add('Team error.', 'err');
  }
}

// --- Game Deals ---
export async function gameDeals() {
  const key = 'gamedeals';
  const cached = cacheGet(key);
  if (cached) {
    add('<strong>Game Deals (<$15):</strong>', 'highlight');
    cached.slice(0, 8).forEach(d => {
      add('<div class="block"><strong>' + esc(d.title) + '</strong><br>$' + d.salePrice + ' (was $' + d
        .normalPrice + ') | Rating: ' + d.steamRatingPercent + '%</div>', 'ok');
    });
    return;
  }
  const lid = loader('Game deals...');
  try {
    const res = await fetch('https://www.cheapshark.com/api/1.0/deals?storeID=1&upperPrice=15');
    const data = await res.json();
    cacheSet(key, data, 3600000);
    unloader(lid);
    add('<strong>Game Deals (<$15):</strong>', 'highlight');
    data.slice(0, 8).forEach(d => {
      add('<div class="block"><strong>' + esc(d.title) + '</strong><br>$' + d.salePrice + ' (was $' + d
        .normalPrice + ') | Rating: ' + d.steamRatingPercent + '%</div>', 'ok');
    });
  } catch {
    unloader(lid);
    add('Game deals unavailable.', 'err');
  }
}

// --- Reddit ---
export async function reddit(subreddit = 'all', limit = 5) {
  limit = Math.min(parseInt(limit) || 5, 10);
  const key = 'reddit_' + subreddit;
  const cached = cacheGet(key);
  if (cached) {
    add('<strong>r/' + esc(subreddit) + ' (cached):</strong>', 'highlight');
    cached.slice(0, limit).forEach((post, i) => {
      add((i + 1) + '. <a href="' + esc('https://reddit.com' + post.permalink) +
        '" target="_blank" rel="noopener" style="color:#00ffcc;">' + esc(post.title) + '</a> (' + post.score +
        ' pts)', 'ok');
    });
    return;
  }
  const lid = loader('r/' + subreddit + '...');
  try {
    const res = await fetch('https://www.reddit.com/r/' + encodeURIComponent(subreddit) + '/hot.json?limit=' +
      limit + '&t=week');
    if (!res.ok) throw new Error('Reddit error');
    const data = await res.json();
    const posts = data.data.children.map(c => c.data);
    cacheSet(key, posts, 300000);
    unloader(lid);
    add('<strong>r/' + esc(subreddit) + ':</strong>', 'highlight');
    posts.forEach((post, i) => {
      add((i + 1) + '. <a href="' + esc('https://reddit.com' + post.permalink) +
        '" target="_blank" rel="noopener" style="color:#00ffcc;">' + esc(post.title) + '</a> (' + post.score +
        ' pts)', 'ok');
    });
  } catch (e) {
    unloader(lid);
    add('Reddit error: ' + esc(e.message), 'err');
  }
}

// --- Stocks ---
export async function stocks(symbol = 'AAPL') {
  symbol = symbol.toUpperCase();
  const key = 'stocks_' + symbol;
  const cached = cacheGet(key);
  if (cached) {
    add('<div class="block"><strong>' + esc(symbol) + '</strong><br>Price: $' + cached.price + ' | Change: ' + cached
      .change + '%</div>', 'ok');
    return;
  }
  const lid = loader('Stock: ' + symbol + '...');
  try {
    const res = await fetch(
      'https://api.alpha-vantage.co/query?function=GLOBAL_QUOTE&symbol=' + encodeURIComponent(symbol) +
      '&apikey=demo');
    const data = await res.json();
    if (!data['Global Quote'] || !data['Global Quote']['05. price']) {
      throw new Error('Stock not found or API limit');
    }
    const q = data['Global Quote'];
    const result = { price: parseFloat(q['05. price']), change: parseFloat(q['10. change percent']) };
    cacheSet(key, result, 300000);
    unloader(lid);
    add('<div class="block"><strong>' + esc(symbol) + '</strong><br>Price: $' + result.price + ' | Change: ' + result
      .change + '%</div>', 'ok');
  } catch (e) {
    unloader(lid);
    add('Stocks error: ' + esc(e.message) + ' (use demo symbols like AAPL, MSFT, GOOGL)', 'err');
  }
}

// --- Translate ---
export async function translate(text, target = 'es') {
  const key = 'translate_' + text + '_' + target;
  const cached = cacheGet(key);
  if (cached) {
    add('<div class="block"><strong>Translation:</strong><br>' + esc(cached) + '</div>', 'ok');
    return;
  }
  const lid = loader('Translating...');
  try {
    const res = await fetch('https://libretranslate.com/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source: 'en', target: target, format: 'text' })
    });
    if (!res.ok) throw new Error('Translation error');
    const data = await res.json();
    const translated = data.translatedText;
    cacheSet(key, translated, 3600000);
    unloader(lid);
    add('<div class="block"><strong>Translation (' + target + '):</strong><br>' + esc(translated) + '</div>', 'ok');
  } catch (e) {
    unloader(lid);
    add('Translation error: ' + esc(e.message), 'err');
  }
          }
