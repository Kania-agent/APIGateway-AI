// ============================================================
// API Gateway Simulator — app.js
// ============================================================

(function () {
  'use strict';

  // ---- State ----
  let endpoints = loadJSON('ag_endpoints', []);
  let logs = loadJSON('ag_logs', []);
  let editingId = null;

  // ---- DOM refs ----
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ---- LocalStorage helpers ----
  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  }

  function saveJSON(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // ---- ID generator ----
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ---- Tab switching ----
  $$('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      $$('.tab').forEach((t) => t.classList.remove('active'));
      $$('.tab-panel').forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      $(`#panel-${tab.dataset.tab}`).classList.add('active');
      if (tab.dataset.tab === 'analytics') renderAnalytics();
      if (tab.dataset.tab === 'logs') renderLogs();
      if (tab.dataset.tab === 'console') refreshEndpointSelect();
    });
  });

  // ---- Endpoint form ----
  $('#addEndpointBtn').addEventListener('click', () => {
    editingId = null;
    $('#formTitle').textContent = 'Create Endpoint';
    $('#epMethod').value = 'GET';
    $('#epPath').value = '';
    $('#epStatus').value = '200';
    $('#epLatency').value = '50';
    $('#epRateLimit').value = '0';
    $('#epBody').value = '';
    $('#endpointFormCard').style.display = 'block';
    $('#epPath').focus();
  });

  $('#cancelFormBtn').addEventListener('click', () => {
    $('#endpointFormCard').style.display = 'none';
    editingId = null;
  });

  $('#saveEndpointBtn').addEventListener('click', () => {
    const method = $('#epMethod').value;
    const path = $('#epPath').value.trim();
    const status = parseInt($('#epStatus').value, 10);
    const latency = parseInt($('#epLatency').value, 10) || 0;
    const rateLimit = parseInt($('#epRateLimit').value, 10) || 0;
    const bodyRaw = $('#epBody').value.trim();

    if (!path.startsWith('/')) {
      alert('Path must start with /');
      return;
    }

    let body = null;
    if (bodyRaw) {
      try {
        body = JSON.parse(bodyRaw);
      } catch (e) {
        alert('Invalid JSON in response body: ' + e.message);
        return;
      }
    }

    if (editingId) {
      const ep = endpoints.find((e) => e.id === editingId);
      if (ep) {
        Object.assign(ep, { method, path, status, latency, rateLimit, body });
      }
    } else {
      endpoints.push({ id: uid(), method, path, status, latency, rateLimit, body });
    }

    saveJSON('ag_endpoints', endpoints);
    $('#endpointFormCard').style.display = 'none';
    editingId = null;
    renderEndpoints();
    refreshEndpointSelect();
  });

  // ---- Render endpoints list ----
  function renderEndpoints() {
    const list = $('#endpointsList');
    const empty = $('#emptyEndpoints');

    if (endpoints.length === 0) {
      list.innerHTML = '';
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';
    list.innerHTML = endpoints.map((ep) => `
      <div class="endpoint-item" data-id="${ep.id}">
        <span class="method-badge method-${ep.method}">${ep.method}</span>
        <span class="endpoint-path">${escapeHTML(ep.path)}</span>
        <div class="endpoint-meta">
          <span>${ep.status}</span>
          <span>${ep.latency}ms</span>
          <span>${ep.rateLimit ? ep.rateLimit + '/min' : 'unlimited'}</span>
        </div>
        <div class="endpoint-actions">
          <button class="btn btn-sm btn-outline edit-ep" data-id="${ep.id}">✏️</button>
          <button class="btn btn-sm btn-danger delete-ep" data-id="${ep.id}">🗑</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.edit-ep').forEach((btn) => {
      btn.addEventListener('click', () => editEndpoint(btn.dataset.id));
    });
    list.querySelectorAll('.delete-ep').forEach((btn) => {
      btn.addEventListener('click', () => deleteEndpoint(btn.dataset.id));
    });

    $('#statEndpoints').textContent = endpoints.length;
  }

  function editEndpoint(id) {
    const ep = endpoints.find((e) => e.id === id);
    if (!ep) return;
    editingId = id;
    $('#formTitle').textContent = 'Edit Endpoint';
    $('#epMethod').value = ep.method;
    $('#epPath').value = ep.path;
    $('#epStatus').value = ep.status;
    $('#epLatency').value = ep.latency;
    $('#epRateLimit').value = ep.rateLimit;
    $('#epBody').value = ep.body ? JSON.stringify(ep.body, null, 2) : '';
    $('#endpointFormCard').style.display = 'block';
  }

  function deleteEndpoint(id) {
    endpoints = endpoints.filter((e) => e.id !== id);
    saveJSON('ag_endpoints', endpoints);
    renderEndpoints();
    refreshEndpointSelect();
  }

  // ---- Console: populate endpoint selector ----
  function refreshEndpointSelect() {
    const sel = $('#consoleEndpoint');
    sel.innerHTML = endpoints.length === 0
      ? '<option value="">— no endpoints —</option>'
      : endpoints.map((ep) =>
          `<option value="${ep.id}">${ep.method} ${ep.path}</option>`
        ).join('');
  }

  // ---- Send simulated request ----
  $('#sendRequestBtn').addEventListener('click', sendRequest);
  $('#consoleMethod').addEventListener('change', () => {
    // auto-select matching endpoint if any
    const m = $('#consoleMethod').value;
    const firstMatch = endpoints.find((ep) => ep.method === m);
    if (firstMatch) $('#consoleEndpoint').value = firstMatch.id;
  });

  $$('.quick-send').forEach((btn) => {
    btn.addEventListener('click', () => {
      $('#consoleMethod').value = btn.dataset.method;
      sendRequest();
    });
  });

  function sendRequest() {
    const endpointId = $('#consoleEndpoint').value;
    const clientId = $('#consoleClientId').value || 'anonymous';
    const bodyRaw = $('#consoleBody').value.trim();

    if (!endpointId) {
      alert('Please create an endpoint first or select one.');
      return;
    }

    const ep = endpoints.find((e) => e.id === endpointId);
    if (!ep) return;

    // --- Rate limiting ---
    if (ep.rateLimit > 0) {
      const now = Date.now();
      const windowMs = 60 * 1000;
      const recentLogs = logs.filter(
        (l) => l.endpointId === ep.id && l.clientId === clientId && (now - l.timestamp) < windowMs
      );
      if (recentLogs.length >= ep.rateLimit) {
        const retryAfter = Math.ceil(
          (recentLogs[0].timestamp + windowMs - now) / 1000
        );
        const logEntry = buildLog(ep, clientId, bodyRaw, 429, 0, true);
        logEntry.body = JSON.stringify({ error: 'Too Many Requests', retryAfter });
        logs.unshift(logEntry);
        saveJSON('ag_logs', logs);
        showResponse(429, 0, { error: 'Too Many Requests', retryAfter });
        updateBadge();
        return;
      }
    }

    // --- Simulated latency ---
    const actualLatency = ep.latency + Math.floor(Math.random() * Math.min(ep.latency, 50));
    const start = performance.now();

    setTimeout(() => {
      const end = performance.now();
      const measured = Math.round(end - start);
      const logEntry = buildLog(ep, clientId, bodyRaw, ep.status, measured, false);
      logEntry.body = ep.body ? JSON.stringify(ep.body, null, 2) : '';
      logs.unshift(logEntry);
      saveJSON('ag_logs', logs);
      showResponse(ep.status, measured, ep.body);
      updateBadge();
    }, actualLatency);
  }

  function buildLog(ep, clientId, requestBody, status, latency, rateLimited) {
    return {
      id: uid(),
      timestamp: Date.now(),
      method: ep.method,
      path: ep.path,
      status,
      latency,
      clientId,
      endpointId: ep.id,
      rateLimited,
      requestBody: requestBody || '',
    };
  }

  function showResponse(status, latency, body) {
    const card = $('#responseCard');
    card.style.display = 'block';
    const statusClass = status < 300 ? 'status-2xx' : status < 400 ? 'status-3xx' : status < 500 ? 'status-4xx' : 'status-5xx';
    $('#responseStatus').textContent = status;
    $('#responseStatus').className = `status-badge ${statusClass}`;
    $('#responseTime').textContent = latency + 'ms';
    $('#responseBody').textContent = body ? (typeof body === 'string' ? body : JSON.stringify(body, null, 2)) : '(empty)';
  }

  // ---- Badge ----
  function updateBadge() {
    $('#totalRequestsBadge').textContent = logs.length + ' request' + (logs.length !== 1 ? 's' : '');
  }

  // ---- Logs ----
  function renderLogs() {
    const filter = $('#logFilter').value;
    const search = $('#logSearch').value.toLowerCase();

    let filtered = logs;
    if (filter === '2xx') filtered = filtered.filter((l) => l.status >= 200 && l.status < 300);
    else if (filter === '3xx') filtered = filtered.filter((l) => l.status >= 300 && l.status < 400);
    else if (filter === '4xx') filtered = filtered.filter((l) => l.status >= 400 && l.status < 500);
    else if (filter === '5xx') filtered = filtered.filter((l) => l.status >= 500);

    if (search) {
      filtered = filtered.filter((l) =>
        l.path.toLowerCase().includes(search) ||
        l.method.toLowerCase().includes(search) ||
        String(l.status).includes(search) ||
        l.clientId.toLowerCase().includes(search)
      );
    }

    // Stats
    const s2 = logs.filter((l) => l.status >= 200 && l.status < 300).length;
    const s4 = logs.filter((l) => l.status >= 400 && l.status < 500).length;
    const s5 = logs.filter((l) => l.status >= 500).length;
    const rl = logs.filter((l) => l.rateLimited).length;
    $('#logsStats').innerHTML = `
      <span class="stat-pill">Total: ${logs.length}</span>
      <span class="stat-pill" style="color:var(--green)">2xx: ${s2}</span>
      <span class="stat-pill" style="color:var(--orange)">4xx: ${s4}</span>
      <span class="stat-pill" style="color:var(--red)">5xx: ${s5}</span>
      <span class="stat-pill" style="color:var(--purple)">Rate Limited: ${rl}</span>
    `;

    const tbody = $('#logsBody');
    const emptyLogs = $('#emptyLogs');

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      emptyLogs.style.display = 'block';
      return;
    }
    emptyLogs.style.display = 'none';

    tbody.innerHTML = filtered.slice(0, 200).map((l) => {
      const sc = l.status < 300 ? 'status-s2xx' : l.status < 400 ? 'status-s3xx' : l.status < 500 ? 'status-s4xx' : 'status-s5xx';
      const time = new Date(l.timestamp).toLocaleTimeString();
      return `<tr>
        <td>${time}</td>
        <td><span class="method-badge method-${l.method}" style="font-size:0.7rem;padding:0.1rem 0.4rem;">${l.method}</span></td>
        <td>${escapeHTML(l.path)}</td>
        <td class="status-cell ${sc}">${l.status}</td>
        <td>${l.latency}ms</td>
        <td>${escapeHTML(l.clientId)}</td>
      </tr>`;
    }).join('');
  }

  $('#logFilter').addEventListener('change', renderLogs);
  $('#logSearch').addEventListener('input', renderLogs);

  // ---- Export CSV ----
  $('#exportLogsBtn').addEventListener('click', () => {
    if (logs.length === 0) {
      alert('No logs to export.');
      return;
    }
    const header = 'Timestamp,Method,Path,Status,Latency,ClientID,RateLimited,RequestBody\n';
    const rows = logs.map((l) =>
      [new Date(l.timestamp).toISOString(), l.method, `"${l.path}"`, l.status, l.latency, `"${l.clientId}"`, l.rateLimited, `"${(l.requestBody || '').replace(/"/g, '""')}"`].join(',')
    ).join('\n');
    const csv = header + rows;
    downloadFile('api-gateway-logs.csv', csv, 'text/csv');
  });

  // ---- Clear logs ----
  $('#clearLogsBtn').addEventListener('click', () => {
    if (!confirm('Clear all request logs?')) return;
    logs = [];
    saveJSON('ag_logs', logs);
    renderLogs();
    updateBadge();
  });

  // ---- Clear all ----
  $('#clearAllBtn').addEventListener('click', () => {
    if (!confirm('Delete all endpoints and logs?')) return;
    endpoints = [];
    logs = [];
    saveJSON('ag_endpoints', endpoints);
    saveJSON('ag_logs', logs);
    renderEndpoints();
    refreshEndpointSelect();
    updateBadge();
  });

  // ---- Analytics ----
  function renderAnalytics() {
    // Stats
    $('#statTotal').textContent = logs.length;
    const avg = logs.length > 0
      ? Math.round(logs.reduce((s, l) => s + l.latency, 0) / logs.length)
      : 0;
    $('#statAvgLatency').textContent = avg + 'ms';
    $('#statRateLimited').textContent = logs.filter((l) => l.rateLimited).length;
    $('#statEndpoints').textContent = endpoints.length;

    drawStatusChart();
    drawLatencyChart();
    drawMethodChart();
    drawEndpointChart();
  }

  // ---- Charts (pure canvas, no libs) ----

  function drawStatusChart() {
    const canvas = $('#statusChart');
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const buckets = {};
    logs.forEach((l) => {
      const key = String(l.status);
      buckets[key] = (buckets[key] || 0) + 1;
    });

    const keys = Object.keys(buckets).sort();
    if (keys.length === 0) {
      ctx.fillStyle = '#8b949e';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No data yet', w / 2, h / 2);
      return;
    }

    const maxVal = Math.max(...Object.values(buckets));
    const barW = Math.min(60, (w - 80) / keys.length - 10);
    const chartH = h - 60;

    keys.forEach((key, i) => {
      const x = 50 + i * (barW + 10);
      const barH = (buckets[key] / maxVal) * chartH;
      const color = key < 300 ? '#3fb950' : key < 400 ? '#58a6ff' : key < 500 ? '#d29922' : '#f85149';

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, h - 30 - barH, barW, barH, 4);
      ctx.fill();

      ctx.fillStyle = '#e6edf3';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(key, x + barW / 2, h - 15);

      ctx.fillStyle = '#8b949e';
      ctx.fillText(buckets[key], x + barW / 2, h - 35 - barH);
    });
  }

  function drawLatencyChart() {
    const canvas = $('#latencyChart');
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const data = logs.slice(0, 50).reverse();
    if (data.length < 2) {
      ctx.fillStyle = '#8b949e';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Need at least 2 requests', w / 2, h / 2);
      return;
    }

    const maxLat = Math.max(...data.map((d) => d.latency), 1);
    const padL = 50, padR = 20, padT = 20, padB = 30;
    const chartW = w - padL - padR;
    const chartH = h - padT - padB;

    // Grid
    ctx.strokeStyle = '#30363d';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();
      ctx.fillStyle = '#8b949e';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxLat - (maxLat / 4) * i) + 'ms', padL - 5, y + 3);
    }

    // Line
    ctx.strokeStyle = '#58a6ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = padL + (i / (data.length - 1)) * chartW;
      const y = padT + chartH - (d.latency / maxLat) * chartH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill
    ctx.fillStyle = 'rgba(88, 166, 255, 0.1)';
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = padL + (i / (data.length - 1)) * chartW;
      const y = padT + chartH - (d.latency / maxLat) * chartH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(padL + chartW, padT + chartH);
    ctx.lineTo(padL, padT + chartH);
    ctx.closePath();
    ctx.fill();
  }

  function drawMethodChart() {
    const canvas = $('#methodChart');
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const buckets = {};
    logs.forEach((l) => { buckets[l.method] = (buckets[l.method] || 0) + 1; });
    const keys = Object.keys(buckets).sort((a, b) => buckets[b] - buckets[a]);
    if (keys.length === 0) {
      ctx.fillStyle = '#8b949e';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No data yet', w / 2, h / 2);
      return;
    }

    const colors = { GET: '#3fb950', POST: '#58a6ff', PUT: '#d29922', PATCH: '#bc8cff', DELETE: '#f85149' };
    const maxVal = Math.max(...Object.values(buckets));
    const barH = Math.min(30, (h - 40) / keys.length - 8);
    const chartW = w - 140;

    keys.forEach((key, i) => {
      const y = 20 + i * (barH + 8);
      const barW = (buckets[key] / maxVal) * (chartW - 60);

      ctx.fillStyle = colors[key] || '#8b949e';
      ctx.beginPath();
      ctx.roundRect(90, y, barW, barH, 4);
      ctx.fill();

      ctx.fillStyle = '#e6edf3';
      ctx.font = '12px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(key, 80, y + barH / 2 + 4);

      ctx.fillStyle = '#8b949e';
      ctx.textAlign = 'left';
      ctx.fillText(buckets[key], 95 + barW, y + barH / 2 + 4);
    });
  }

  function drawEndpointChart() {
    const canvas = $('#endpointChart');
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const buckets = {};
    logs.forEach((l) => {
      const key = l.method + ' ' + l.path;
      buckets[key] = (buckets[key] || 0) + 1;
    });
    const keys = Object.keys(buckets).sort((a, b) => buckets[b] - buckets[a]).slice(0, 6);
    if (keys.length === 0) {
      ctx.fillStyle = '#8b949e';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No data yet', w / 2, h / 2);
      return;
    }

    const maxVal = Math.max(...Object.values(buckets));
    const barH = Math.min(28, (h - 40) / keys.length - 8);
    const chartW = w - 160;

    keys.forEach((key, i) => {
      const y = 20 + i * (barH + 8);
      const barW = (buckets[key] / maxVal) * (chartW - 60);

      const gradient = ctx.createLinearGradient(90, 0, 90 + barW, 0);
      gradient.addColorStop(0, '#58a6ff');
      gradient.addColorStop(1, '#bc8cff');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(90, y, barW, barH, 4);
      ctx.fill();

      ctx.fillStyle = '#e6edf3';
      ctx.font = '11px monospace';
      ctx.textAlign = 'right';
      const label = key.length > 18 ? key.slice(0, 17) + '…' : key;
      ctx.fillText(label, 82, y + barH / 2 + 4);

      ctx.fillStyle = '#8b949e';
      ctx.textAlign = 'left';
      ctx.fillText(buckets[key], 95 + barW, y + barH / 2 + 4);
    });
  }

  // ---- Helpers ----
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function downloadFile(name, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ---- Polyfill roundRect for older browsers ----
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      if (typeof r === 'number') r = [r];
      const [tl = 0] = r;
      this.moveTo(x + tl, y);
      this.lineTo(x + w - tl, y);
      this.arcTo(x + w, y, x + w, y + tl, tl);
      this.lineTo(x + w, y + h - tl);
      this.arcTo(x + w, y + h, x + w - tl, y + h, tl);
      this.lineTo(x + tl, y + h);
      this.arcTo(x, y + h, x, y + h - tl, tl);
      this.lineTo(x, y + tl);
      this.arcTo(x, y, x + tl, y, tl);
      this.closePath();
      return this;
    };
  }

  // ---- Init ----
  renderEndpoints();
  refreshEndpointSelect();
  updateBadge();
})();
