/* MotoScope — client-only data using free endpoints (Wikipedia/Wikidata)
 * No API keys required. Uses CORS-friendly MediaWiki APIs.
 *
 * Sections wired:
 * - Hero next GP + season round
 * - Standings (Riders' Championship) for MotoGP/Moto2/Moto3 (best-effort)
 * - Riders (basic cards via teams & riders table or from standings)
 * - Teams (accordion from teams & riders table)
 * - Circuits & Schedule (calendar table)
 * - Archive search (Wikipedia search + summary)
 * - Predictions (no money) — localStorage
 *
 * You can refactor to your own API later — all DOM IDs/classes match your HTML.
 */

window.addEventListener('error', e => {
  console.error('Uncaught error:', e.error || e.message);
  const el = document.createElement('div');
  el.style.cssText='position:fixed;bottom:8px;left:8px;background:#300;color:#fff;padding:8px 10px;border:1px solid #700;border-radius:8px;z-index:9999;font:12px/1.3 monospace';
  el.textContent = 'JS error: ' + (e.error?.message || e.message);
  document.body.appendChild(el);
});
window.addEventListener('unhandledrejection', e => {
  console.error('Promise error:', e.reason);
  const el = document.createElement('div');
  el.style.cssText='position:fixed;bottom:40px;left:8px;background:#331a00;color:#fff;padding:8px 10px;border:1px solid #a60;border-radius:8px;z-index:9999;font:12px/1.3 monospace';
  el.textContent = 'Promise error: ' + (e.reason?.message || e.reason);
  document.body.appendChild(el);
});



(function () {
  const $d = $(document);

  // ====== Config ======
  const NOW = new Date();
  const CURRENT_YEAR = NOW.getFullYear();
  const CLASSES = ["motogp", "moto2", "moto3"];
  const WIKI_BASE = "https://en.wikipedia.org";
  const API = `${WIKI_BASE}/w/api.php`;
  const PAGE_BY_YEAR = (y) => `${y}_MotoGP_World_Championship`;

  // State
  const state = {
    year: CURRENT_YEAR,
    parsedHTML: null,        // Document fragment of the parsed season page
    schedule: [],            // [{round,gp,circuit,date,localTime?,country}]
    standings: {             // by class -> [{pos,rider,team,points,wins,podiums}]
      motogp: [], moto2: [], moto3: []
    },
    teams: [],               // [{team, manufacturer, riders:[...]}]
    riders: [],              // [{name, number?, country?, team?, bike?}]
    circuits: [],            // [{name,country,length,turns,record}]
    nextGP: null,            // {round,gp,date,circuit,country}
  };

  // ===== Wikipedia REST Summary helper (no API key needed) =====
  async function wikiSummary(title){
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}?redirect=true`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`Wiki summary HTTP ${res.status} for ${title}`);
    return res.json();
  }

  // Tiny in-memory cache to avoid spamming Wikipedia
  const _wikiCache = new Map();
  async function cachedWikiSummary(title){
    if (_wikiCache.has(title)) return _wikiCache.get(title);
    const data = await wikiSummary(title);
    _wikiCache.set(title, data);
    return data;
  }

  // Fill a rider card with image/text from Wikipedia Summary
  async function fillRiderCardFromWiki($card, riderName){
    try {
      const data = await cachedWikiSummary(riderName);
      // Title/desc fallbacks
      const $title = $card.find('.card-title');
      const $sub   = $card.find('.rider-sub');
      if ($title.length) $title.text(data.title || riderName);
      if ($sub.length && !$sub.text().trim()) $sub.text(data.description || '');

      // Thumbnail into <img.avatar>
      const imgEl = $card.find('img.avatar')[0];
      if (imgEl && data?.thumbnail?.source) imgEl.src = data.thumbnail.source;

      // "Profile" button opens the article
      $card.find('[data-action="view-rider"]').off('click').on('click', () => {
        const href = data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(riderName)}`;
        window.open(href, '_blank', 'noopener');
      });
    } catch (_) {
      // Quietly ignore if the page doesn’t exist
    }
  }


  // ====== Utilities ======
  const el = (sel, root = document) => root.querySelector(sel);
  const els = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const toHTML = (str) => {
    const tpl = document.createElement('template');
    tpl.innerHTML = str;
    return tpl.content;
  };
  const parseDate = (txt) => {
    // Accept formats like "5 October 2025" or "Oct 5, 2025" etc.
    const d = new Date(txt.replace(/\u00a0/g, ' '));
    return isNaN(d) ? null : d;
  };
  const fmtDate = (d) => d ? d.toLocaleDateString(undefined, {year:'numeric', month:'short', day:'numeric'}) : '—';

  const setText = (bind, value) => {
    const selector = `[data-bind="${bind}"]`;
    els(selector).forEach(n => n.textContent = value ?? '—');
  };

  const fetchJSON = async (url, params) => {
    const qs = new URLSearchParams(params || {});
    if (!qs.has('origin')) qs.set('origin', '*'); // CORS for MediaWiki
    const full = url + (url.includes('?') ? '&' : '?') + qs.toString();
    const r = await fetch(full);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  };

  const getSeasonPageHTML = async (year) => {
    const page = PAGE_BY_YEAR(year);
    const data = await fetchJSON(API, {
      action: "parse",
      page,
      prop: "text",
      format: "json"
    });
    if (!data.parse || !data.parse.text) throw new Error("Parse failed");
    const html = data.parse.text["*"];
    return toHTML(html);
  };

  // Grab the table nearest to a heading containing some text
  const tableNearHeading = (root, headingRegex) => {
    const headings = els('h2, h3, h4', root);
    for (const h of headings) {
      const t = h.textContent.trim();
      if (headingRegex.test(t)) {
        // nextElementSibling that is a table
        let sib = h.nextElementSibling;
        while (sib && sib.tagName !== 'TABLE') sib = sib.nextElementSibling;
        if (sib && sib.tagName === 'TABLE') return sib;
      }
    }
    return null;
  };

  const parseTable = (tableEl) => {
    const safe = { headers: [], rows: [] };
    if (!tableEl) return safe;

    const trs = els('tr', tableEl);
    if (!trs.length) return safe;

    const ths = els('th', trs[0] || {});
    const headers = ths.map(th => th.textContent.trim());
    const rows = [];

    for (let i = 1; i < trs.length; i++) {
      const tds = els('td,th', trs[i]).map(td => td.textContent.replace(/\[\d+\]/g, '').trim());
      if (tds.length) rows.push(Object.fromEntries(tds.map((v, idx) => [headers[idx] || `col${idx}`, v])));
    }
    return { headers, rows };
  };


  // ====== Extractors (best-effort against Wikipedia layout) ======
  const extractSchedule = (root) => {
    // Try to find "Calendar" / "Grands Prix" table
    // helper to find a wikitable whose <caption> matches a regex
    function tableByCaption(root, rx){
      const tables = els('table.wikitable', root);
      for (const t of tables) {
        const cap = el('caption', t);
        if (cap && rx.test(cap.textContent.trim())) return t;
      }
      return null;
    }

    const table =
      tableNearHeading(root, /(Calendar|Grands? Prix|Season calendar)/i)
      || tableByCaption(root, /calendar|grand prix|season/i);

    const { headers, rows } = parseTable(table);
    if (!headers.length && !rows.length) {
      state.schedule = [];
      state.nextGP = null;
      return; // nothing to parse; keeps the app running
    }
    const roundIdx = headers.findIndex(h => /Round|No\.?/i.test(h));
    const gpIdx = headers.findIndex(h => /Grand Prix|GP|Race/i.test(h));
    const circuitIdx = headers.findIndex(h => /Circuit/i.test(h));
    const dateIdx = headers.findIndex(h => /Date/i.test(h));

    const out = rows.map(r => {
      const vals = Object.values(r);
      return {
        round: roundIdx >= 0 ? r[headers[roundIdx]] : vals[0],
        gp: gpIdx >= 0 ? r[headers[gpIdx]] : vals[1],
        circuit: circuitIdx >= 0 ? r[headers[circuitIdx]] : vals[2],
        date: dateIdx >= 0 ? r[headers[dateIdx]] : vals[3],
        country: (r['Country'] || '').trim()
      };
    }).filter(x => x.round && x.gp);

    // pick next GP
    const now = new Date();
    let next = null;
    for (const ev of out) {
      const d = parseDate(ev.date);
      if (d && d >= now) { next = { ...ev, when: d }; break; }
    }
    state.schedule = out;
    state.nextGP = next || out[out.length - 1] || null;
  };

  // Try to extract Riders' standings for each class
  const extractStandings = (root) => {
    // There can be multiple standings tables. We search by headings for each class:
    const lookup = [
      { key: 'motogp', rx: /(Riders'|Rider|World).*standings.*MotoGP/i },
      { key: 'moto2',  rx: /(Riders'|Rider|World).*standings.*Moto2/i },
      { key: 'moto3',  rx: /(Riders'|Rider|World).*standings.*Moto3/i }
    ];

    lookup.forEach(({ key, rx }) => {
      let table = tableNearHeading(root, rx);
      if (!table) {
        // fallback: first wikitable after a heading mentioning the class
        const hd = els('h2, h3, h4', root).find(h => rx.test(h.textContent));
        if (hd) {
          let sib = hd.nextElementSibling;
          while (sib && sib.tagName !== 'TABLE') sib = sib.nextElementSibling;
          table = sib;
        }
      }
      if (!table) return;

      const { headers, rows } = parseTable(table);
      const posH = headers.find(h => /^Pos\.?$|Position/i.test(h)) || headers[0];
      const riderH = headers.find(h => /Rider|Name/i.test(h)) || headers[1];
      const teamH = headers.find(h => /Team|Constructor|Manufacturer/i.test(h));
      const ptsH = headers.find(h => /Pts|Points/i.test(h));
      const winsH = headers.find(h => /Wins/i.test(h));
      const podH = headers.find(h => /Podiums?/i.test(h));

      const list = rows.map(r => ({
        pos: (r[posH] || '').replace(/[^\d]/g,''),
        rider: r[riderH] || '',
        team: teamH ? r[teamH] : '',
        points: (r[ptsH] || '').replace(/[^\d]/g,''),
        wins: winsH ? (r[winsH] || '').replace(/[^\d]/g,'') : '',
        podiums: podH ? (r[podH] || '').replace(/[^\d]/g,'') : ''
      })).filter(x => x.rider);

      state.standings[key] = list;
    });
  };

  const extractTeamsAndRiders = (root) => {
    // Find "Teams and riders" section table(s)
    const table = tableNearHeading(root, /(Teams? and riders|Entry list|Teams)/i);
    if (!table) return;

    // Some seasons have multiple tables; we’ll parse the next few siblings if they’re tables
    const tables = [table];
    let nxt = table.nextElementSibling;
    while (nxt && nxt.tagName === 'TABLE' && tables.length < 3) {
      tables.push(nxt);
      nxt = nxt.nextElementSibling;
    }

    const riders = [];
    const teams = [];

    for (const t of tables) {
      const { headers, rows } = parseTable(t);
      const teamH = headers.find(h => /Team|Constructor|Manufacturer|Entr(y|ant)/i);
      const manuH = headers.find(h => /Constructor|Manufacturer/i) || teamH;
      const riderH = headers.find(h => /Rider|Name/i);
      const bikeH = headers.find(h => /Bike|Motorcycle/i);
      const numH = headers.find(h => /No\.|Number/i);

      rows.forEach(r => {
        const team = (r[teamH] || '').trim();
        const rider = (r[riderH] || '').trim();
        if (team && rider) {
          riders.push({
            name: rider,
            number: r[numH] || '',
            team,
            bike: r[bikeH] || (r[manuH] || '')
          });
          // group teams
          let tt = teams.find(x => x.team === team);
          if (!tt) {
            tt = { team, manufacturer: (r[manuH] || '').trim(), riders: [] };
            teams.push(tt);
          }
          if (!tt.riders.includes(rider)) tt.riders.push(rider);
        }
      });
    }

    // Deduplicate riders
    const uniq = new Map();
    riders.forEach(r => uniq.set(r.name, { ...uniq.get(r.name), ...r }));
    state.riders = Array.from(uniq.values());
    state.teams = teams;
  };

  const extractCircuits = () => {
    // Derive circuits from schedule
    const seen = new Map();
    for (const ev of state.schedule) {
      const key = `${ev.circuit}__${ev.country || ''}`;
      if (!seen.has(key)) {
        seen.set(key, {
          name: (ev.circuit || '').trim(),
          country: (ev.country || '').trim(),
          length: '—',
          turns: '—',
          record: '—'
        });
      }
    }
    state.circuits = Array.from(seen.values()).filter(c => c.name);
  };

  // === compat: Array.prototype.findLast poly ===
  function findLastCompat(arr, pred){
    if (!Array.isArray(arr)) return undefined;
    for (let i = arr.length - 1; i >= 0; i--) {
      if (pred(arr[i])) return arr[i];
    }
    return undefined;
  }


  // ====== Renderers ======
  const renderHero = () => {
    setText('season-year', state.year);
    // Round: use next GP or completed length
    const lastWithRound = findLastCompat(state.schedule, x => x && x.round);
    const currentRound = state.nextGP?.round || lastWithRound?.round || '—';
    setText('season-year', state.year);
    setText('season-round', currentRound);

    if (state.nextGP) {
      setText('next-gp-name', state.nextGP.gp);
      setText('next-gp-date', fmtDate(state.nextGP.when || parseDate(state.nextGP.date)));
      setText('next-gp-location', state.nextGP.country || '');
      setText('next-gp-sessions', 'Race weekend'); // placeholder
    }
  };

  const renderSchedule = () => {
    const $body = $('#scheduleBody').empty();
    state.schedule.forEach(ev => {
      const d = parseDate(ev.date);
      $body.append(`
        <tr>
          <td>${ev.round || ''}</td>
          <td>${ev.gp || ''}</td>
          <td>${fmtDate(d) || (ev.date || '')}</td>
          <td class="hide-sm">${ev.circuit || ''}</td>
          <td>${ev.localTime || '—'}</td>
        </tr>
      `);
    });

    // Season select (simple: current and ±2 years)
    const $sel = $('#seasonSelect').empty();
    [state.year-2, state.year-1, state.year, state.year+1].forEach(y => {
      if (y <= CURRENT_YEAR + 1) $sel.append(`<option value="${y}" ${y===state.year?'selected':''}>${y}</option>`);
    });
  };

  const renderStandings = (klass = 'motogp') => {
    const list = state.standings[klass] || [];
    const $body = $('#standingsBody').empty();
    if (!list.length) {
      $body.append(`<tr class="skeleton"><td colspan="6">No standings found (Wikipedia layout may have changed)</td></tr>`);
      return;
    }
    list.forEach(row => {
      $body.append(`
        <tr>
          <td>${row.pos || ''}</td>
          <td>${row.rider || ''}</td>
          <td class="hide-sm">${row.team || ''}</td>
          <td>${row.points || ''}</td>
          <td class="hide-sm">${row.wins || ''}</td>
          <td class="hide-sm">${row.podiums || ''}</td>
        </tr>
      `);
    });
  };

  const renderRiders = () => {
    const $grid = $('#riderGrid').empty();
    const tpl = el('#tmplRiderCard');
    let data = state.riders;
    const cls = $('#riderClass').val();
    if (cls !== 'test') {
      // rough filter: if rider appears in standings of selected class, keep
      const names = new Set((state.standings[cls] || []).map(x => x.rider));
      if (names.size) data = data.filter(r => names.has(r.name));
    }
    const q = ($('#riderFilter').val() || '').toLowerCase();
    if (q) data = data.filter(r => r.name.toLowerCase().includes(q) || (r.team||'').toLowerCase().includes(q));

    data.slice(0, 60).forEach(r => {
      const node = tpl.content.cloneNode(true);
      const root = node.querySelector('article');
      root.dataset.id = r.name;
      const img = node.querySelector('.avatar');
      img.alt = `${r.name} portrait`;
      // Use Wikipedia summary image if available
      // Basic text first
      node.querySelector('.card-title').textContent = r.name;
      node.querySelector('.rider-sub').textContent = `${r.number ? '#'+r.number+' • ' : ''}${r.country || ''}`.replace(/ • $/,'');
      node.querySelector('.rider-team').textContent = r.team || '—';
      node.querySelector('.rider-bike').textContent = r.bike || '—';
      node.querySelector('.rider-age').textContent = '—';

      // Append first so selectors work, then enrich with Wikipedia
      $grid.append(node);
      fillRiderCardFromWiki($(root), r.name);

    });

    $('#ridersPage').text(`Page 1`); // simple
  };

  const renderTeams = () => {
    const $list = $('#teamList').empty();
    if (!state.teams.length) {
      $list.append(`<div class="acc-item"><div class="ph" style="padding:1rem;">No team data parsed.</div></div>`);
      return;
    }
    state.teams.forEach(t => {
      $list.append(`
        <details class="acc-item">
          <summary><strong>${t.team}</strong> • ${t.manufacturer || '—'}</summary>
          <div class="acc-body">
            <div class="two-col">
              <div>
                <h4>Riders</h4>
                <ul class="bullets">
                  ${t.riders.map(r => `<li>${r}</li>`).join('')}
                </ul>
              </div>
              <div>
                <h4>Stats</h4>
                <p>Titles: — • Wins: — • Podiums: —</p>
              </div>
            </div>
          </div>
        </details>
      `);
    });
  };

  const renderCircuits = () => {
    const $grid = $('#circuitGrid').empty();
    const tpl = el('#tmplCircuitCard');
    let data = state.circuits;
    const q = ($('#circuitFilter').val() || '').toLowerCase();
    if (q) data = data.filter(c => c.name.toLowerCase().includes(q) || (c.country||'').toLowerCase().includes(q));

    const sort = $('#circuitSort').val();
    if (sort === 'name') data.sort((a,b) => a.name.localeCompare(b.name));
    if (sort === 'country') data.sort((a,b) => (a.country||'').localeCompare(b.country||''));

    data.forEach(c => {
      const node = tpl.content.cloneNode(true);
      node.querySelector('.card-title').textContent = c.name;
      node.querySelector('.circuit-country').textContent = c.country || '';
      node.querySelector('.circuit-length').textContent = c.length;
      node.querySelector('.circuit-turns').textContent = c.turns;
      node.querySelector('.circuit-record').textContent = c.record;
      $grid.append(node);
    });
  };

  // ====== Archive search (Wikipedia) ======
  const doArchiveSearch = async () => {
    const type = $('#archiveType').val(); // riders/teams/bikes/circuits/champions/stories
    const q = ($('#archiveFilter').val() || '').trim();
    const searchTerm = q || ({
      riders: 'MotoGP riders',
      teams: 'MotoGP teams',
      bikes: 'MotoGP motorcycle',
      circuits: 'MotoGP circuits',
      champions: 'MotoGP world champions',
      stories: 'MotoGP history'
    }[type]);

    const res = await fetchJSON(API, {
      action: "query",
      list: "search",
      srsearch: searchTerm,
      srlimit: 10,
      format: "json"
    });
    const results = (res.query && res.query.search) ? res.query.search : [];
    const $list = $('#archiveList').empty();
    results.forEach(item => {
      const title = item.title;
      const snippet = item.snippet.replace(/<\/?span[^>]*>/g,'');
      const li = $(`
        <article class="card">
          <h3 class="card-title">${title}</h3>
          <p class="muted">${snippet}…</p>
          <div class="card-actions">
            <button class="btn btn-ghost" data-action="open-archive" data-title="${encodeURIComponent(title)}">Open</button>
            <a class="btn btn-ghost" href="${WIKI_BASE}/wiki/${encodeURIComponent(title)}" target="_blank" rel="noopener">Source</a>
          </div>
        </article>
      `);
      $list.append(li);
    });
  };

  const openArchiveDetail = async (title) => {
    $('#archiveDetailTitle').text(decodeURIComponent(title));
    $('#archiveDetailMeta').text('Loading…');
    $('#archiveDetailBody').html('');
    $('#btnOpenSource').prop('disabled', false).off('click').on('click', () => {
      window.open(`${WIKI_BASE}/wiki/${title}`, '_blank', 'noopener');
    });

    try {
      const js = await wikiSummary(title);
      $('#archiveDetailMeta').text(js.description || js.extract?.slice(0, 160) || '');
      const body = js.extract_html || `<p>${js.extract || 'No summary available.'}</p>`;
      $('#archiveDetailBody').html(body);
    } catch {
      $('#archiveDetailMeta').text('No summary available.');
    }

    $('#archiveDetail').attr('aria-hidden', 'false');
  };

  // ====== Predictions (client-only) ======
  const PRED_KEY = 'motoscope_predictions';
  const readPreds = () => JSON.parse(localStorage.getItem(PRED_KEY) || '{}');
  const writePreds = (o) => localStorage.setItem(PRED_KEY, JSON.stringify(o));

  const setupPredictions = () => {
    // Fill rounds
    const $roundSel = $('#predictRound').empty();
    state.schedule.forEach(ev => {
      $roundSel.append(`<option value="${ev.round}">${ev.round} — ${ev.gp}</option>`);
    });

    $('#btnLoadGrid').off('click').on('click', () => {
      const r = $('#predictRound').val();
      loadGridForRound(r);
    });

    $('#btnClearPrediction').off('click').on('click', () => {
      const round = $('#predictRound').val();
      const all = readPreds();
      delete all[round];
      writePreds(all);
      renderPredictionSlots(round, []);
    });

    $('#btnSubmitPrediction').off('click').on('click', () => {
      const round = $('#predictRound').val();
      const picks = $('#finishOrder').children().map(function () {
        return $(this).data('rider') || null;
      }).get().filter(Boolean);
      const all = readPreds();
      all[round] = picks;
      writePreds(all);
      alert('Prediction saved (local only).');
      refreshLeaderboard();
    });

    // Preload current/next round
    if (state.nextGP?.round) {
      $roundSel.val(state.nextGP.round);
      loadGridForRound(state.nextGP.round);
    } else if (state.schedule[0]) {
      $roundSel.val(state.schedule[0].round);
      loadGridForRound(state.schedule[0].round);
    }
    refreshLeaderboard();
  };

  const loadGridForRound = (round) => {
    // Use current class standings as pool
    const pool = (state.standings.motogp || []).map(x => x.rider);
    const $pool = $('#gridPool').empty();
    pool.forEach(name => {
      const li = $(`<li class="chip" draggable="true" data-rider="${name}">${name}</li>`);
      $pool.append(li);
    });
    renderPredictionSlots(round, readPreds()[round] || []);
    // Drag & drop
    setupDragDrop();
  };

  const renderPredictionSlots = (round, picks) => {
    const $list = $('#finishOrder').empty();
    const N = 10; // top 10 positions
    for (let i = 1; i <= N; i++) {
      const name = picks[i-1] || '';
      const li = $(`<li data-pos="${i}" ${name ? `data-rider="${name}"` : ''}>${i}. ${name || '<span class="muted">drop rider here</span>'}</li>`);
      $list.append(li);
    }
  };

  const setupDragDrop = () => {
    // chips → droppable slots
    const onDragStart = (e) => {
      e.originalEvent.dataTransfer.setData('text/plain', $(e.target).data('rider'));
    };
    const onDragOver = (e) => { e.preventDefault(); };
    const onDrop = (e) => {
      e.preventDefault();
      const name = e.originalEvent.dataTransfer.getData('text/plain');
      const $li = $(e.currentTarget);
      if (!name) return;
      // ensure unique: remove from any other slot
      $('#finishOrder li').each(function(){
        if ($(this).data('rider') === name) {
          $(this).removeAttr('data-rider').html(`${$(this).data('pos')}. <span class="muted">drop rider here</span>`);
        }
      });
      $li.attr('data-rider', name).text(`${$li.data('pos')}. ${name}`);
    };

    // Bind drag events
    $('#gridPool .chip').off('dragstart').on('dragstart', onDragStart);
    $('#finishOrder li').off('dragover drop').on('dragover', onDragOver).on('drop', onDrop);
  };

  const refreshLeaderboard = () => {
    // purely cosmetic: count how many picks a "user" has per round
    const all = readPreds();
    const $lb = $('#leaderboard').empty();
    Object.entries(all).forEach(([round, picks]) => {
      $lb.append(`<li>Round ${round}: ${picks.length} picks</li>`);
    });
    if (!Object.keys(all).length) $lb.append(`<li class="muted">No submissions yet.</li>`);
  };

  // ====== Wiring UI ======
  const wireUI = () => {
    // Mobile nav
    $('#btnMenu').on('click', function(){
      const $nav = $('#mainNav');
      const show = !$nav.hasClass('show');
      $nav.toggleClass('show', show);
      $(this).attr('aria-expanded', show ? 'true' : 'false');
    });

    // Theme switch
    $('#toggleTheme').on('change', function(){
      document.documentElement.classList.toggle('light', this.checked);
    });

    // Standings controls
    $('#standingsClass').on('change', function(){
      renderStandings(this.value);
    });
    $('#refreshStandings').on('click', () => renderStandings($('#standingsClass').val()));

    // Riders filter/class
    $('#riderFilter').on('input', renderRiders);
    $('#riderClass').on('change', renderRiders);

    // Circuits filter/sort
    $('#circuitFilter').on('input', renderCircuits);
    $('#circuitSort').on('change', renderCircuits);

    // Season switch
    $('#seasonSelect').on('change', async function(){
      await loadSeason(+this.value);
    });

    // Archive
    $('#archiveFilter, #archiveType').on('input change', doArchiveSearch);
    $('#btnImportStories').on('click', doArchiveSearch);
    $(document).on('click', '[data-action="open-archive"]', function(){
      openArchiveDetail($(this).data('title'));
    });
    $('[data-action="close-drawer"]').on('click', function(){
      $('#archiveDetail').attr('aria-hidden','true');
    });

    // Scroll top
    $('#btnScrollTop').on('click', () => window.scrollTo({top:0, behavior:'smooth'}));
  };

  // ====== Load season workflow ======
  const loadSeason = async (yearCandidate) => {
    // try current year, then fallback one year if page missing
    let y = yearCandidate;
    try {
      const html = await getSeasonPageHTML(y);
      state.year = y;
      state.parsedHTML = html;
    } catch (e) {
      // fallback to previous season
      y = yearCandidate - 1;
      const html = await getSeasonPageHTML(y);
      state.year = y;
      state.parsedHTML = html;
      console.warn(`Season ${yearCandidate} not found; using ${y} instead.`);
    }

    // Extract
    extractSchedule(state.parsedHTML);
    extractStandings(state.parsedHTML);
    extractTeamsAndRiders(state.parsedHTML);
    extractCircuits();

    // Render
    renderHero();
    renderSchedule();
    renderStandings($('#standingsClass').val() || 'motogp');
    renderRiders();
    renderTeams();
    renderCircuits();
    doArchiveSearch();
    setupPredictions();
  };

  // ====== Kickoff ======
  $d.ready(async function(){
    wireUI();
    await loadSeason(CURRENT_YEAR);
  });

})();
