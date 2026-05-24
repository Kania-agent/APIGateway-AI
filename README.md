# API Gateway Simulator

A fully functional, browser-based API gateway simulator for testing and prototyping. Build mock API endpoints, simulate rate limiting, track response times, and analyze traffic patterns — all with local storage persistence.

## Features

- **Mock Endpoint Creator** — Define custom endpoints with configurable method, path, status code, latency, rate limits, and response body
- **API Console** — Send requests to your mock endpoints and inspect responses in real-time
- **Rate Limiting** — Per-endpoint, per-client configurable rate limits with 429 responses
- **Request/Response Logging** — Full request logs with method, path, status, latency, client ID, and timestamp
- **Analytics Dashboard** — Status code distribution, latency over time, requests by method, and requests by endpoint charts
- **Export Logs** — Download request logs as CSV files
- **Local Storage Persistence** — All endpoints and logs survive page refreshes

## Getting Started

1. Open `index.html` in any modern browser (no server required)
2. Go to the **Endpoints** tab and create your first mock endpoint
3. Switch to the **Console** tab and send a request
4. Check the **Logs** and **Analytics** tabs to see recorded traffic

## Usage

### Creating Endpoints
- Click **+ New Endpoint**
- Set the HTTP method, path, response status code, simulated latency, rate limit, and response body
- Click **Save Endpoint**

### Sending Requests
- In the Console tab, select an endpoint and method
- Optionally add a request body and client ID
- Click **Send** or use the quick-action buttons

### Rate Limiting
- Set a rate limit (requests per minute) on any endpoint
- Use different client IDs to simulate separate clients
- Exceeding the limit returns a `429 Too Many Requests` response

### Analytics
- View summary stats: total requests, average latency, rate-limited count, active endpoints
- Charts update in real-time with each request sent

## Tech Stack

- Vanilla HTML, CSS, JavaScript (zero dependencies)
- Canvas-based chart rendering
- LocalStorage for persistence

## License

MIT
