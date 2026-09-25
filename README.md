# HimSentry — Hackathon Full-Stack Prototype

HimSentry is a deployable React + Express prototype based on the supplied **HimSentry – Executive Summary**.

The product story is implemented as three layers:

1. **DETECT** — satellite change detection, seismic trigger and upstream river radar.
2. **PREDICT** — live signals matched to pre-computed HEC-RAS flood scenarios.
3. **ACT** — village-level countdowns, uphill evacuation routes, and SMS / cell-broadcast / siren alerting.

> **Important:** The live-looking data in this prototype is illustrative demo data. It is not connected to real satellite, seismic, river or emergency-broadcast systems.

## What is included

- Responsive command-center dashboard
- Source-zone risk map with selectable zones
- Signal-fusion panel
- Village time-to-flood countdowns
- Evacuation route visualization
- Alert broadcast demo
- Express backend with REST APIs
- Health endpoint for deployment monitoring
- QR / SHARE button that creates a QR code for the currently opened URL
- Vite production build served by the Express server
- No database required for the demo

## Project structure

```text
HimSentry-Hackathon/
├── index.html
├── package.json
├── vite.config.js
├── server.js
├── README.md
└── src/
    ├── App.jsx
    ├── main.jsx
    └── styles.css
```

## Run locally

Requirements: Node.js 20+ recommended.

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:4000/api/health`

For a production-style local run:

```bash
npm run build
npm start
```

Then open:

```text
http://localhost:4000
```

## API

- `GET /api/health` — deployment health check
- `GET /api/dashboard` — complete dashboard state
- `GET /api/zones` — source-zone risk data
- `GET /api/villages` — village impact data
- `GET /api/events` — recent alert events
- `POST /api/alerts` — queues a demo alert
- `POST /api/simulate` — changes a demo zone risk/signal

Example:

```bash
curl -X POST http://localhost:4000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{"zone":"BK-01","severity":"CRITICAL"}'
```

## Deploy

This project is intentionally suitable for a Node-capable host such as Render, Railway, Fly.io or a VPS.

Build command:

```bash
npm install && npm run build
```

Start command:

```bash
npm start
```

The server uses `process.env.PORT`, so the platform can supply its own port.

After deployment, open the public HTTPS URL. Press **QR / SHARE** in the header. The generated QR code encodes the current public URL and can be scanned from a phone.

## Hackathon demo flow

1. Open **Command Center**.
2. Point out the selected upstream source zone.
3. Show the four fused signals.
4. Show the matched scenario and confidence.
5. Show the village ETA countdown.
6. Show the recommended uphill route.
7. Click **Trigger test alert** to demonstrate the backend API.
8. Press **QR / SHARE** to put the live prototype on judges' phones.

## Source alignment

The interface and product language are derived from the supplied presentation:

- Bhote Koshi–Trishuli pilot corridor
- Rasuwa and Nuwakot
- Detect → Predict → Act
- glacier speed, lake growth, water colour
- seismic trigger
- solar radar water-level sensors
- pre-computed HEC-RAS scenarios
- arrival time and depth for every village/asset
- evacuation routes uphill and away from the river
- SMS, cell broadcast, sirens and operator dashboard

The supplied deck describes the pricing figures as illustrative assumptions; this prototype does not implement billing.

## Next production steps

For a real deployment, replace the demo state with authenticated ingestion services for Sentinel imagery, seismic feeds and river sensors; run actual HEC-RAS scenario datasets; add a persistent database; connect an approved emergency messaging provider; add role-based operator authentication; and have local authorities validate every evacuation route before public use.
