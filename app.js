// APIGateway AI — app.js

const endpoints = [
    { method: 'GET', path: '/api/v1/users', upstream: 'user-service:3001', latency: '23ms', rps: '452', status: 'healthy' },
    { method: 'POST', path: '/api/v1/auth/login', upstream: 'auth-service:3002', latency: '67ms', rps: '891', status: 'healthy' },
    { method: 'POST', path: '/api/v1/orders', upstream: 'order-service:3003', latency: '145ms', rps: '234', status: 'healthy' },
    { method: 'GET', path: '/api/v1/products', upstream: 'product-service:3004', latency: '31ms', rps: '1,203', status: 'healthy' },
    { method: 'PUT', path: '/api/v1/users/:id', upstream: 'user-service:3001', latency: '89ms', rps: '127', status: 'healthy' },
    { method: 'DELETE', path: '/api/v1/sessions/:id', upstream: 'auth-service:3002', latency: '12ms', rps: '45', status: 'healthy' },
    { method: 'GET', path: '/api/v1/analytics', upstream: 'analytics-service:3005', latency: '234ms', rps: '56', status: 'degraded' },
    { method: 'POST', path: '/api/v1/webhooks', upstream: 'webhook-service:3006', latency: '12ms', rps: '342', status: 'healthy' },
    { method: 'GET', path: '/api/v1/search', upstream: 'search-service:3007', latency: '78ms', rps: '678', status: 'healthy' },
    { method: 'POST', path: '/api/v1/payments', upstream: 'payment-service:3008', latency: '156ms', rps: '189', status: 'healthy' },
];

const rateLimits = [
    { name: 'Users API', used: 78, max: 1000, color: '#06b6d4' },
    { name: 'Auth API', used: 92, max: 500, color: '#ef4444' },
    { name: 'Orders API', used: 45, max: 500, color: '#3b82f6' },
    { name: 'Search API', used: 61, max: 800, color: '#a855f7' },
];

function renderEndpoints() {
    const tbody = document.getElementById('endpointBody');
    tbody.innerHTML = endpoints.map(e => `
        <tr>
            <td><span class="method-badge ${e.method.toLowerCase()}">${e.method}</span></td>
            <td><span class="endpoint-path">${e.path}</span></td>
            <td><span class="endpoint-upstream">${e.upstream}</span></td>
            <td><span class="endpoint-latency" style="color:${parseInt(e.latency) > 100 ? '#ef4444' : parseInt(e.latency) > 50 ? '#eab308' : '#22c55e'}">${e.latency}</span></td>
            <td><span class="endpoint-rps">${e.rps}</span></td>
            <td><span class="status-badge ${e.status}"></span></td>
        </tr>
    `).join('');
}

function renderRateLimits() {
    const container = document.getElementById('rateGauges');
    container.innerHTML = rateLimits.map(g => {
        const pct = (g.used / g.max * 100);
        const angle = (pct / 100) * 360;
        const color = pct > 85 ? '#ef4444' : pct > 60 ? '#eab308' : '#22c55e';
        return `
            <div class="gauge-item">
                <div class="gauge-ring" style="background: conic-gradient(${color} 0deg ${angle}deg, var(--bg-elevated) ${angle}deg 360deg);">
                    <div class="gauge-inner" style="color:${color}">${Math.round(pct)}%</div>
                </div>
                <div class="gauge-label">${g.name}</div>
                <div class="gauge-limit">${g.used}K / ${g.max}K req/h</div>
            </div>
        `;
    }).join('');
}

function renderFlowDiagram() {
    const diagram = document.getElementById('flowDiagram');
    diagram.innerHTML = `
        <div class="flow-node client">📱 Client</div>
        <div class="flow-arrow">
            <div class="line"></div>
            <div class="label">HTTPS</div>
            <div class="line"></div>
        </div>
        <div class="flow-node gateway">⚡ API Gateway<br><span style="font-size:10px;font-weight:400;color:var(--text-dim)">MiMo V2.5 Load Balancer</span></div>
        <div class="flow-arrow">
            <div class="line"></div>
            <div class="label">auth check</div>
            <div class="line"></div>
        </div>
        <div class="flow-node auth">🔐 Auth Middleware<br><span style="font-size:10px;font-weight:400;color:var(--text-dim)">JWT / Rate Limit</span></div>
        <div class="flow-arrow">
            <div class="line"></div>
            <div class="label">route</div>
            <div class="line"></div>
        </div>
        <div class="flow-node router">🔀 Router<br><span style="font-size:10px;font-weight:400;color:var(--text-dim)">Path-based routing</span></div>
        <div class="flow-arrow">
            <div class="line"></div>
            <div class="line"></div>
        </div>
        <div class="flow-branches">
            <div class="flow-branch">
                <div class="flow-node service" style="font-size:11px">👤 Users</div>
            </div>
            <div class="flow-branch">
                <div class="flow-node service" style="font-size:11px">📦 Orders</div>
            </div>
            <div class="flow-branch">
                <div class="flow-node service" style="font-size:11px">🔍 Search</div>
            </div>
            <div class="flow-branch">
                <div class="flow-node service" style="font-size:11px">💳 Pay</div>
            </div>
        </div>
    `;
}

// Simulate live request counter
function simulateRequests() {
    const el = document.querySelector('.live-text');
    let base = 1247;
    setInterval(() => {
        base += Math.floor(Math.random() * 40 - 15);
        if (base < 800) base = 800;
        if (base > 2000) base = 2000;
        el.textContent = base.toLocaleString() + ' req/s';
    }, 2000);
}

document.addEventListener('DOMContentLoaded', () => {
    renderEndpoints();
    renderRateLimits();
    renderFlowDiagram();
    simulateRequests();

    document.getElementById('addEndpointBtn').addEventListener('click', () => {
        const methods = ['GET', 'POST', 'PUT', 'DELETE'];
        const newEndpoint = {
            method: methods[Math.floor(Math.random() * methods.length)],
            path: `/api/v1/custom-${Date.now().toString(36)}`,
            upstream: `service-${Math.floor(Math.random() * 10)}:30${Math.floor(Math.random() * 90 + 10)}`,
            latency: Math.floor(Math.random() * 200 + 5) + 'ms',
            rps: String(Math.floor(Math.random() * 500 + 10)),
            status: 'healthy'
        };
        endpoints.unshift(newEndpoint);
        renderEndpoints();
    });
});
