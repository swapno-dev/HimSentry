import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 4000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json());

let state = {
  status: { system: "ONLINE", model: "HEC-RAS scenario engine", updated: new Date().toISOString() },
  zones: [
    { id: "BK-01", name: "Bhote Koshi Source", region: "Rasuwa", risk: 86, signal: "SEISMIC + SATELLITE", eta: 19, depth: 3.8, lat: 28.20, lon: 85.39 },
    { id: "TR-02", name: "Upper Trishuli", region: "Nuwakot", risk: 62, signal: "LAKE GROWTH", eta: 42, depth: 2.1, lat: 28.08, lon: 85.25 },
    { id: "TR-03", name: "Lower Trishuli", region: "Nuwakot", risk: 31, signal: "RIVER LEVEL", eta: 87, depth: 1.2, lat: 27.93, lon: 85.16 }
  ],
  villages: [
    { id: "V-01", name: "Timure", zone: "BK-01", eta: 19, depth: 3.8, people: 820, route: "Ridge Route A", status: "EVACUATE" },
    { id: "V-02", name: "Syabrubesi", zone: "BK-01", eta: 27, depth: 2.9, people: 1540, route: "School Hill Route", status: "EVACUATE" },
    { id: "V-03", name: "Dhunche", zone: "TR-02", eta: 42, depth: 2.1, people: 2190, route: "North Ridge", status: "READY" },
    { id: "V-04", name: "Beteni", zone: "TR-03", eta: 87, depth: 1.2, people: 640, route: "Temple Ridge", status: "MONITOR" }
  ]
};

const events = [];

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "HimSentry API", time: new Date().toISOString() }));
app.get("/api/dashboard", (_req, res) => {
  state.status.updated = new Date().toISOString();
  res.json(state);
});
app.get("/api/zones", (_req, res) => res.json(state.zones));
app.get("/api/villages", (_req, res) => res.json(state.villages));
app.get("/api/events", (_req, res) => res.json(events.slice(-20).reverse()));

app.post("/api/alerts", (req, res) => {
  const event = {
    id: `AL-${Date.now()}`,
    createdAt: new Date().toISOString(),
    zone: req.body?.zone || "BK-01",
    severity: req.body?.severity || "HIGH",
    channels: ["SMS", "CELL_BROADCAST", "SIREN"],
    message: "HimSentry test evacuation broadcast queued."
  };
  events.push(event);
  res.status(201).json(event);
});

/* Tiny simulation endpoint: lets a demo operator change a zone risk without a database. */
app.post("/api/simulate", (req, res) => {
  const zone = state.zones.find(z => z.id === req.body?.zone);
  if (!zone) return res.status(404).json({ error: "Unknown zone" });
  zone.risk = Math.max(0, Math.min(100, Number(req.body?.risk ?? zone.risk)));
  zone.signal = req.body?.signal || zone.signal;
  state.status.updated = new Date().toISOString();
  res.json(zone);
});

const dist = path.join(__dirname, "dist");
app.use(express.static(dist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(dist, "index.html"));
});

app.listen(PORT, () => {
  console.log(`HimSentry server running on http://localhost:${PORT}`);
});
