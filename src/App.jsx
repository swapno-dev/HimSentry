import React, { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

const API = "/api";

const FALLBACK = {
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

function fmtAgo(iso) {
  const sec = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  return sec < 5 ? "just now" : `${sec}s ago`;
}

function RiskPill({ risk }) {
  const label = risk >= 75 ? "CRITICAL" : risk >= 50 ? "HIGH" : risk >= 30 ? "WATCH" : "LOW";
  return <span className={`pill ${label.toLowerCase()}`}>{label} · {risk}%</span>;
}

function MiniMap({ zones, selected, onSelect }) {
  const points = [
    { x: 18, y: 25, label: "BK", id: "BK-01" },
    { x: 43, y: 42, label: "TR", id: "TR-02" },
    { x: 68, y: 66, label: "LV", id: "TR-03" }
  ];
  return (
    <div className="map">
      <div className="map-grid" />
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="river">
        <path d="M7,10 C25,23 24,34 39,39 C55,45 53,61 68,67 C81,72 80,86 96,94" />
      </svg>
      <div className="mountain m1" /><div className="mountain m2" /><div className="mountain m3" />
      {points.map(p => {
        const z = zones.find(x => x.id === p.id);
        const active = selected === p.id;
        return (
          <button key={p.id} className={`map-dot ${active ? "active" : ""} ${z?.risk >= 75 ? "danger" : ""}`}
            style={{ left: `${p.x}%`, top: `${p.y}%` }} onClick={() => onSelect(p.id)}>
            <span>{p.label}</span>
          </button>
        );
      })}
      <div className="map-label label-a">Rasuwa</div>
      <div className="map-label label-b">Trishuli</div>
      <div className="map-label label-c">Nuwakot</div>
      <div className="map-legend"><i /> source zone <i className="yellow" /> watch zone</div>
    </div>
  );
}

function Countdown({ minutes }) {
  const [seconds, setSeconds] = useState(Math.max(0, minutes * 60));
  useEffect(() => {
    setSeconds(Math.max(0, minutes * 60));
  }, [minutes]);
  useEffect(() => {
    const id = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const mm = Math.floor(seconds / 60);
  const ss = String(seconds % 60).padStart(2, "0");
  return <strong className="countdown">{mm}:{ss}</strong>;
}

export default function App() {
  const [data, setData] = useState(FALLBACK);
  const [selected, setSelected] = useState("BK-01");
  const [tab, setTab] = useState("command");
  const [notice, setNotice] = useState("");
  const [qr, setQr] = useState("");

  const load = async () => {
    try {
      const r = await fetch(`${API}/dashboard`);
      if (!r.ok) throw new Error("API unavailable");
      setData(await r.json());
    } catch {
      setData(FALLBACK);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const selectedZone = data.zones.find(z => z.id === selected) || data.zones[0];
  const affected = useMemo(() => data.villages.filter(v => v.zone === selectedZone?.id), [data, selectedZone]);

  const generateQR = async () => {
    const url = window.location.href;
    const img = await QRCode.toDataURL(url, { width: 300, margin: 2, color: { dark: "#071820", light: "#ffffff" } });
    setQr(img);
  };

  const sendAlert = async () => {
    setNotice("Broadcast queued to SMS · cell broadcast · siren operators");
    try {
      await fetch(`${API}/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zone: selectedZone.id, severity: selectedZone.risk >= 75 ? "CRITICAL" : "HIGH" })
      });
    } catch {}
    setTimeout(() => setNotice(""), 4500);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark">H</div><div><b>HIMSENTRY</b><span>source-to-village flood intelligence</span></div></div>
        <div className="top-actions">
          <span className="live"><i /> SYSTEM {data.status?.system || "ONLINE"}</span>
          <button className="ghost" onClick={generateQR}>QR / SHARE</button>
        </div>
      </header>

      <nav className="nav">
        {[
          ["command", "Command Center"], ["signals", "Signal Fusion"], ["villages", "Village Impact"], ["about", "Why HimSentry"]
        ].map(([id, label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>)}
        <span className="nav-spacer" />
        <span className="timestamp">LIVE · {fmtAgo(data.status?.updated || new Date().toISOString())}</span>
      </nav>

      {notice && <div className="toast">{notice}</div>}

      {tab === "command" && (
        <main>
          <section className="hero">
            <div>
              <p className="eyebrow">EARLY WARNING, REBUILT</p>
              <h1>Watch the glacier.<br /><em>Know the impact.</em><br />Move people.</h1>
              <p className="hero-copy">HimSentry detects upstream change, matches it to pre-computed flood scenarios, and gives every village a zone-wise countdown and evacuation route.</p>
              <div className="hero-actions"><button className="primary" onClick={sendAlert}>Trigger test alert ↗</button><button className="secondary" onClick={() => setTab("signals")}>Inspect signals</button></div>
            </div>
            <div className="hero-stats">
              <div><b>9m</b><span>Trishuli rise<br />in 30 minutes*</span></div>
              <div><b>3</b><span>detection layers<br />working together</span></div>
              <div><b>∞</b><span>pre-computed<br />impact scenarios</span></div>
            </div>
          </section>

          <section className="section-head"><div><p className="eyebrow">01 · DETECT</p><h2>Where is the signal?</h2></div><span>Free Sentinel imagery · open seismic data · solar radar</span></section>
          <section className="dashboard-grid">
            <MiniMap zones={data.zones} selected={selected} onSelect={setSelected} />
            <div className="signal-panel">
              <div className="panel-title"><span>UPSTREAM SIGNALS</span><small>auto-fused</small></div>
              {[
                ["Satellite", "Glacier velocity", selectedZone.risk >= 60 ? "ACCELERATING" : "STABLE", "↑ 18%"],
                ["Satellite", "Lake growth", selectedZone.risk >= 60 ? "RISING" : "NORMAL", selectedZone.risk >= 60 ? "↑ 11%" : "—"],
                ["Seismic", "Collapse trigger", selectedZone.risk >= 75 ? "DETECTED" : "CLEAR", selectedZone.risk >= 75 ? "0.84 g" : "0.00 g"],
                ["River radar", "Upstream level", selectedZone.risk >= 50 ? "RISING" : "NORMAL", selectedZone.risk >= 50 ? "+0.42 m" : "+0.03 m"]
              ].map((s, i) => <div className="signal" key={i}><div className={`signal-icon i${i}`} /> <div><b>{s[0]}</b><span>{s[1]}</span></div><strong>{s[2]}</strong><small>{s[3]}</small></div>)}
              <div className="model-note">● MATCHED TO SCENARIO <b>#{selectedZone.id}-17</b> · confidence 91%</div>
            </div>
          </section>

          <section className="section-head predict"><div><p className="eyebrow">02 · PREDICT</p><h2>How long until water arrives?</h2></div><span>HEC-RAS scenarios pre-computed for each source zone</span></section>
          <section className="impact-row">
            <div className="eta-card critical"><div><span>SELECTED SOURCE</span><b>{selectedZone.name}</b><small>{selectedZone.region} · {selectedZone.signal}</small></div><div className="eta"><span>EARLIEST ETA</span><Countdown minutes={selectedZone.eta} /><small>minutes</small></div></div>
            {affected.map(v => <div className="village-card" key={v.id}><div><span>{v.status}</span><b>{v.name}</b><small>{v.people.toLocaleString()} people · {v.depth}m depth</small></div><div><Countdown minutes={v.eta} /><small>route: {v.route}</small></div></div>)}
          </section>

          <section className="act-grid">
            <div className="act-copy"><p className="eyebrow">03 · ACT</p><h2>Turn minutes into movement.</h2><p>Every zone gets a countdown, a route uphill and away from the river, and a delivery channel for operators and communities.</p><button className="primary" onClick={sendAlert}>Broadcast evacuation alert</button></div>
            <div className="route-card"><div className="route-top"><span>RECOMMENDED EVACUATION</span><b>↑ {affected[0]?.route || "Ridge Route A"}</b></div><div className="route-line"><div className="route-node start">RIVER</div><div className="route-arrow">→ → →</div><div className="route-node safe">SAFE RIDGE</div></div><div className="route-meta"><span>Elevation gain <b>+184m</b></span><span>Distance <b>1.8 km</b></span><span>Vehicle access <b>NO</b></span></div></div>
          </section>
        </main>
      )}

      {tab === "signals" && (
        <main className="page">
          <p className="eyebrow">SIGNAL FUSION</p><h1 className="page-title">Three independent clues.<br /><em>One actionable picture.</em></h1>
          <div className="big-grid">{data.zones.map(z => <div className="zone-card" key={z.id} onClick={() => { setSelected(z.id); setTab("command"); }}><div className="zone-head"><span>{z.id}</span><RiskPill risk={z.risk} /></div><h3>{z.name}</h3><p>{z.region}</p><div className="bar"><i style={{ width: `${z.risk}%` }} /></div><div className="zone-foot"><span>{z.signal}</span><b>{z.eta} min ETA</b></div></div>)}</div>
          <div className="explain"><div><span>DETECT</span><b>Source-side evidence</b><p>Glacier speed, lake growth, water colour, seismic triggers and upstream radar levels.</p></div><div><span>PREDICT</span><b>Scenario matching</b><p>Hundreds of HEC-RAS scenarios are prepared in advance; live signals select the closest one in seconds.</p></div><div><span>ACT</span><b>Zone-specific action</b><p>Countdowns, uphill evacuation routes, SMS, cell broadcast, sirens and an operator dashboard.</p></div></div>
        </main>
      )}

      {tab === "villages" && (
        <main className="page"><p className="eyebrow">VILLAGE IMPACT</p><h1 className="page-title">Every minute has<br /><em>a destination.</em></h1>
          <div className="table-card"><div className="table-row header"><span>VILLAGE</span><span>ZONE</span><span>ETA</span><span>DEPTH</span><span>PEOPLE</span><span>ACTION</span></div>{data.villages.map(v => <div className="table-row" key={v.id}><b>{v.name}</b><span>{v.zone}</span><strong><Countdown minutes={v.eta} /></strong><span>{v.depth} m</span><span>{v.people.toLocaleString()}</span><RiskPill risk={v.status === "EVACUATE" ? 86 : v.status === "READY" ? 58 : 30} /></div>)}</div>
          <div className="route-banner"><div><p className="eyebrow">ROUTE ENGINE</p><h2>Uphill. Away from the river.<br />Feasible for the zone.</h2></div><div className="route-mini">RIVER <span>→</span> RIDGE <span>→</span> SAFE ZONE</div></div>
        </main>
      )}

      {tab === "about" && (
        <main className="page about"><p className="eyebrow">WHY HIMSENTRY</p><h1 className="page-title">The glacier gives signals.<br /><em>We make them useful.</em></h1>
          <div className="problem"><div><b>1,410+</b><span>reported deaths in Nepal's August 2026 flood*</span></div><div><b>$4–7B</b><span>estimated economic loss*</span></div><div><b>30+</b><span>hydropower projects in the Trishuli basin</span></div></div>
          <div className="three"><div><span>01</span><h2>Detect</h2><p>Watch where floods start—not only the downstream gauge.</p></div><div><span>02</span><h2>Predict</h2><p>Match live signals to pre-computed HEC-RAS flood scenarios.</p></div><div><span>03</span><h2>Act</h2><p>Give every village a time-to-flood and a safe route.</p></div></div>
          <p className="source-note">*Figures and framing are taken from the supplied HimSentry Executive Summary. See the PPT sources for the cited reports and publications. Prototype data shown here is illustrative.</p>
        </main>
      )}

      {qr && <div className="modal" onClick={() => setQr("")}><div className="qr-card" onClick={e => e.stopPropagation()}><button className="close" onClick={() => setQr("")}>×</button><p className="eyebrow">OPEN ON MOBILE</p><h2>Scan to launch HimSentry</h2><img src={qr} alt="QR code for this deployed HimSentry website" /><code>{window.location.href}</code><small>Deploy this project, then use the QR / SHARE button again to generate the live link.</small></div></div>}

      <footer><span>HIMSENTRY · FLOOD INTELLIGENCE PROTOTYPE</span><span>DETECT · PREDICT · ACT</span><span>Bhote Koshi–Trishuli pilot corridor</span></footer>
    </div>
  );
}
