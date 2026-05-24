# 🚀 APIGateway AI

> Intelligent API gateway with AI-powered routing, rate limiting, and analytics — powered by MiMo V2.5

## Why This Exists

Modern applications are distributed systems — dozens of microservices, third-party APIs, and data sources all behind a single frontend. Without a gateway, clients make direct calls to every backend, creating a web of coupling, security nightmares, and operational chaos. Traditional API gateways handle routing and rate limiting with static rules, but they're blind to the content and context of requests. They can't differentiate between a lightweight metadata fetch and an expensive aggregation query, nor can they adapt routing based on real-time backend health or user behavior patterns.

APIGateway AI adds an intelligence layer to your gateway using MiMo V2.5 — Nous Research's reasoning model. Instead of static round-robin or weighted routing, the AI Router inspects request payloads, user history, and backend telemetry to make optimal routing decisions in real time. It detects anomalous request patterns that signal abuse, automatically scales rate limits based on user tier and backend capacity, and provides deep analytics that reveal not just how many requests you served, but what they meant and why they mattered.

The dashboard gives platform teams a real-time view of their API surface: endpoint performance, rate limit gauges, routing flow visualization, and request monitoring with AI-generated insights. It's the difference between a dumb pipe that forwards HTTP requests and an intelligent layer that understands and optimizes your entire API ecosystem.

## Architecture

```
┌─────────────────┐
│    Request       │   HTTP/HTTPS request from client
│  (Incoming)      │   with headers, payload, and auth token
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Rate Limiter    │   Token bucket + sliding window with
│  (Enforcement)   │   per-user, per-endpoint, per-tier limits
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   AI Router      │   MiMo V2.5 — payload inspection, load
│  (MiMo V2.5)    │   awareness, anomaly detection, smart routing
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Backend       │   Microservices, databases, external APIs
│  (Services)      │   selected by the AI Router
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Response       │   Enriched response with AI analytics,
│  (Enriched)      │   caching headers, and observability data
└─────────────────┘
```

## Token Consumption Model

| Agent | Tokens/Op | Frequency | Daily/User (est.) |
|-------|-----------|-----------|-------------------|
| AI Router | 100K | ~500 requests/day | 50M |
| Auth Agent | 50K | ~500 requests/day | 25M |
| Analytics Agent | 150K | ~100 aggregations/day | 15M |
| **Total** | **300K** | — | **~90M** |

> Token estimates based on a medium-traffic gateway handling 500 requests/day per user with 100 analytics aggregations. Batch processing reduces per-request cost significantly in production.

## Features

- 🚦 **Dynamic rate limiting** — AI-adjusted limits based on user tier, endpoint cost, and backend health
- 🧠 **Smart request routing** — MiMo V2.5 inspects payloads to route to optimal backend instances
- 📊 **Endpoint performance table** — Method, path, latency percentiles, error rates, and throughput per endpoint
- 🎛️ **Rate limit gauges** — CSS radial gauges showing current utilization against limits
- 🔀 **Routing flow visualization** — Interactive diagram showing request paths through the gateway
- 🔍 **Real-time request monitoring** — Live stream of requests with latency, status, and route details
- 🛡️ **Anomaly detection** — AI identifies unusual patterns: DDoS attempts, credential stuffing, abuse
- 📈 **Analytics dashboard** — Request volume, error trends, p50/p95/p99 latency charts
- 🔌 **Plugin architecture** — Extend with custom middleware, transforms, and auth providers

## Tech Stack

- **Frontend:** Vanilla HTML5, CSS3, JavaScript (ES6+)
- **AI Engine:** MiMo V2.5 by Nous Research
- **Architecture:** Zero-dependency — no external frameworks or build tools
- **Rate Limiting:** Custom token bucket with sliding window algorithm
- **Visualization:** CSS-only radial gauges and flow diagrams

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/APIGateway-AI.git
cd APIGateway-AI

# Open the gateway dashboard
open index.html

# Or serve locally
python3 -m http.server 8080
```

1. Open `index.html` in your browser
2. The dashboard loads with live endpoint monitoring and rate limit gauges
3. Browse the endpoint table to see latency, status, and request counts
4. Watch the routing flow diagram for real-time request path visualization
5. Check the analytics panel for aggregate metrics and trends
6. To connect real backends, configure endpoints in `js/config.js`

## Project Structure

```
APIGateway-AI/
├── index.html                  # Gateway dashboard entry point
├── css/
│   ├── main.css                # Core dark theme and layout
│   ├── gauges.css              # Rate limit radial gauge styles
│   └── flow-diagram.css        # Request routing flow visualization
├── js/
│   ├── app.js                  # Main application controller
│   ├── rate-limiter.js         # Token bucket and sliding window
│   ├── ai-router.js            # MiMo V2.5 request routing logic
│   ├── analytics.js            # Metrics aggregation and reporting
│   ├── monitor.js              # Real-time request stream viewer
│   └── config.js               # Backend endpoints and gateway settings
├── data/
│   ├── endpoints/              # API endpoint definitions
│   └── sample-traffic/         # Simulated request data for demo
├── assets/
│   └── icons/                  # Status and method icons (GET/POST/PUT/DELETE)
└── README.md
```

---

> Built with MiMo V2.5 — [Nous Research](https://nousresearch.com)
