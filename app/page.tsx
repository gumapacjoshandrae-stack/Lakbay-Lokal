"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Destination = {
  id: string;
  name: string;
  island: string;
  category: string;
  mood: string;
  summary: string;
  officialUrl: string;
  mapQuery: string;
};
type EventRow = {
  id: string; attempted_email: string; event_type: string; ip_address: string | null;
  city: string | null; region: string | null; country: string | null;
  user_agent: string; created_at: string;
};
type AccountNotification = {
  id: string; event_type: string; ip_address: string | null; city: string | null;
  region: string | null; country: string | null; user_agent: string; created_at: string;
};
type Session = { user: { email: string; isAdmin: boolean } | null; configured: boolean };

const categories = ["All places", "Island days", "Coast & sea", "Nature", "Heritage"];

export default function Home() {
  const [places, setPlaces] = useState<Destination[]>([]);
  const [feedNote, setFeedNote] = useState("Gathering a few good places to begin…");
  const [category, setCategory] = useState("All places");
  const [search, setSearch] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [eventsError, setEventsError] = useState("");
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [notifications, setNotifications] = useState<AccountNotification[]>([]);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alertToast, setAlertToast] = useState<AccountNotification | null>(null);
  const latestNotificationId = useRef<string | null>(null);

  async function loadPlaces() {
    try {
      const response = await fetch("/api/places", { cache: "no-store" });
      const data = await response.json() as { places?: Destination[] };
      if (response.ok && Array.isArray(data.places)) {
        setPlaces(data.places);
        setFeedNote("A pocket guide to Cebu, Bohol & nearby islands");
      } else setFeedNote("The guide is taking a short breather.");
    } catch { setFeedNote("The guide is taking a short breather."); }
  }
  async function loadSession() {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      setSession(await response.json());
    } catch { setSession({ configured: false, user: null }); }
  }
  async function loadEvents() {
    try {
      const response = await fetch("/api/admin/events", { cache: "no-store" });
      const data = await response.json() as { events?: EventRow[]; error?: string };
      if (!response.ok) throw new Error(data.error || "Could not retrieve sign-in activity.");
      setEvents(Array.isArray(data.events) ? data.events : []);
      setEventsError("");
      setEventsLoaded(true);
    } catch (error) {
      setEventsError(error instanceof Error ? error.message : "Could not retrieve sign-in activity.");
      setEventsLoaded(true);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPlaces();
      void loadSession();
      const verified = new URLSearchParams(window.location.search).get("verified");
      if (verified) {
        setMessage(verified === "1" ? "Your email is verified. You can now sign in." : "That verification link could not be completed. Sign in if the account is already verified, or request a new link.");
        setAuthOpen(true);
        window.history.replaceState({}, "", window.location.pathname);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!session?.user?.email) {
      latestNotificationId.current = null;
      return;
    }
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/account/notifications", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json() as { notifications?: AccountNotification[] };
        if (!active) return;
        const rows = data.notifications ?? [];
        const newest = rows[0];
        if (newest && latestNotificationId.current && newest.id !== latestNotificationId.current) setAlertToast(newest);
        if (newest) latestNotificationId.current = newest.id;
        setNotifications(rows);
      } catch { /* Keep the last successfully loaded alerts visible. */ }
    };
    void refresh();
    const timer = window.setInterval(refresh, 12_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [session?.user?.email]);
  useEffect(() => {
    if (!adminOpen || !session?.user?.isAdmin) return;
    void loadEvents();
    const timer = window.setInterval(() => { void loadEvents(); }, 8_000);
    return () => window.clearInterval(timer);
  }, [adminOpen, session?.user?.isAdmin]);
  useEffect(() => {
    if (!alertToast) return;
    const timer = window.setTimeout(() => setAlertToast(null), 9_000);
    return () => window.clearTimeout(timer);
  }, [alertToast]);

  const visiblePlaces = useMemo(() => places.filter((place) => {
    const matchesCategory = category === "All places" || place.category === category;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || `${place.name} ${place.island} ${place.mood} ${place.summary}`.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  }), [places, category, search]);
  const dateToday = new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date());

  function openAuth() { setMode("signin"); setMessage(""); setAuthOpen(true); }
  async function submitAuth(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const endpoint = mode === "signin" ? "/api/auth/login" : "/api/auth/signup";
      const response = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      setMessage(data.message || data.error || "Request completed.");
      if (response.ok && mode === "signin") {
        const me = await fetch("/api/auth/me", { cache: "no-store" }).then((r) => r.json());
        setSession(me);
        if (me.user) window.setTimeout(() => setAuthOpen(false), 900);
      } else if (response.ok) setMode("signin");
    } catch { setMessage("The account service could not be reached. Please try again."); }
    finally { setBusy(false); }
  }
  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession((current) => current ? { ...current, user: null } : current);
    setNotifications([]); latestNotificationId.current = null; setAdminOpen(false);
  }
  function dateLabel(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", month: "short", day: "numeric", year: "numeric" }).format(date);
  }

  return <main className="lakbay-site">
    <div className="topline"><span>FIELD GUIDE NO. 01</span><span>{dateToday}</span><span>CEBU · BOHOL · THE VISAYAN SEA</span></div>
    <header className="masthead">
      <Link className="brand" href="/" aria-label="Lakbay Lokal home"><span className="brand-mark"><CompassMark/></span><span className="brand-name">LAKBAY <b>LOKAL</b><small>GO SLOW. LOOK CLOSER.</small></span></Link>
      <nav className="main-nav" aria-label="Main navigation"><a href="#places">Places</a><a href="#routes">Easy routes</a><a href="#field-notes">Before you go</a></nav>
      <div className="account-actions">{session?.user ? <>
        <span className="account-name">{session.user.email}</span>
        <button className="account-link" onClick={() => setAlertsOpen(true)}>My alerts <span className="count-pill">{notifications.length}</span></button>
        {session.user.isAdmin && <button className="admin-link" onClick={() => setAdminOpen(!adminOpen)}>Admin desk</button>}
        <button className="sign-in-button" onClick={signOut}>Sign out</button>
      </> : <button className="sign-in-button" onClick={openAuth}>Reader sign in <span>↗</span></button>}</div>
    </header>

    <div className="guide-strip"><span className="strip-mark">✳</span><span>{feedNote}</span><a href="#places">Start wandering ↓</a></div>

    {adminOpen && session?.user?.isAdmin && <section className="admin-panel" id="admin-desk">
      <div className="panel-heading"><div><span className="eyebrow">PRIVATE ADMIN DESK</span><h2>Sign-in activity</h2><small>All reader accounts · refreshes every eight seconds</small></div><div className="panel-actions"><button className="plain-button" onClick={() => void loadEvents()}>Refresh ↻</button><button className="plain-button" onClick={() => setAdminOpen(false)}>Close ×</button></div></div>
      {eventsError ? <p className="empty-copy" role="alert">{eventsError}</p> : !eventsLoaded ? <p className="empty-copy">Loading activity…</p> : events.length === 0 ? <p className="empty-copy">No failed sign-in attempts have been recorded.</p> : <div className="event-list">{events.map((item) => <article className="event-row" key={item.id}>
        <div><strong>{item.event_type === "locked" ? "Account paused · 3 failed attempts" : item.event_type === "blocked" ? "Attempt blocked during cooldown" : "Failed password attempt"}</strong><span>{item.attempted_email}</span><small>{[item.city, item.region, item.country].filter(Boolean).join(", ") || "Location unavailable"} · {item.ip_address || "IP unavailable"}</small><small>{item.user_agent}</small></div><time>{dateLabel(item.created_at)}</time>
      </article>)}</div>}
      <p className="privacy-note">IP location is approximate. Browser details can be inaccurate or spoofed. Websites cannot read MAC addresses.</p>
    </section>}

    <section className="hero">
      <div className="hero-copy"><span className="eyebrow">A LITTLE MAP FOR THE LONG WAY ROUND</span><h1>Find your<br/>island <em>pace.</em></h1><p>Salt air, old stone, quiet roads, one more stop for merienda. Start with a place and leave room for the detours.</p><a className="hero-cta" href="#places">Pick a place <b>↓</b></a><div className="hero-caption"><span className="signal-dot"/>Made for curious days around Central Visayas</div></div>
      <div className="map-panel"><IslandMap/><div className="map-label map-label-cebu">CEBU</div><div className="map-label map-label-bohol">BOHOL</div><div className="map-label map-label-si">SIQUIJOR</div><div className="map-stamp"><span>VISAYAN</span><b>ISLAND<br/>TIME</b><small>10° N · 124° E</small></div><div className="map-note">A loose map, a good starting point.</div></div>
      <div className="hero-footer"><span>01 / THE CENTRAL VISAYAS FIELD GUIDE</span><span>NO RUSH · NO CHECKLIST</span></div>
    </section>

    <section className="places-section" id="places">
      <div className="section-heading"><div><span className="eyebrow">PICK YOUR KIND OF DAY</span><h2>Somewhere worth taking the slow road.</h2></div><label className="search-field"><span>⌕</span><input aria-label="Search places" placeholder="Find an island or town…" value={search} onChange={(e) => setSearch(e.target.value)}/></label></div>
      <div className="filter-row">{categories.map((item) => <button key={item} className={category === item ? "filter-chip active" : "filter-chip"} onClick={() => setCategory(item)}>{item}</button>)}</div>
      <div className="destination-grid">{visiblePlaces.map((place, index) => <DestinationCard key={place.id} place={place} index={index}/>)}</div>
      {visiblePlaces.length === 0 && <p className="empty-copy">No places match that search. Try another island or category.</p>}
    </section>

    <section className="route-section" id="routes"><div className="route-intro"><span className="eyebrow">THREE SOFT STARTS</span><h2>Easy routes for your first wander.</h2><p>Use these as a sketch, not a schedule. Check transport, opening hours, and local guidance before setting out.</p></div>
      <div className="route-cards"><article className="route-card route-card-one"><span>01 / CITY STROLL</span><h3>Old Cebu, on foot</h3><p>Begin with Cebu’s historic core, give the heritage stops time, then find a table for something slow and local.</p><a href="https://www.cebu.gov.ph/history/" target="_blank" rel="noopener noreferrer">See Cebu’s heritage trail ↗</a></article><article className="route-card route-card-two"><span>02 / RIVER TO HILLS</span><h3>Bohol, inland way</h3><p>Pair a gentle Loboc morning with the landscapes around Carmen. Leave the crossing and road time some breathing room.</p><a href="https://tourism.bohol.gov.ph/visitbohol-loboc/" target="_blank" rel="noopener noreferrer">Browse Bohol’s local guides ↗</a></article><article className="route-card route-card-three"><span>03 / SEA AIR</span><h3>North Cebu, island days</h3><p>Make the ferry crossing part of the journey. Bantayan rewards an unhurried stay and a little curiosity beyond the beach.</p><a href="https://tourism.cebu.gov.ph/explore/bantayan/" target="_blank" rel="noopener noreferrer">Plan with Bantayan Tourism ↗</a></article></div>
    </section>

    <section className="field-notes" id="field-notes"><div className="note-compass"><CompassMark/></div><div><span className="eyebrow">A NOTE FROM THE FIELD</span><h2>Let the place set the pace.</h2><p>Schedules, sea conditions, prices, and access can change. Use the local tourism links on each place card to check details, and ask locally before heading somewhere remote.</p></div><a href="https://philippines.travel/" target="_blank" rel="noopener noreferrer">More official travel info ↗</a></section>

    <footer className="site-footer"><Link className="brand footer-brand" href="/"><span className="brand-mark"><CompassMark/></span><span className="brand-name">LAKBAY <b>LOKAL</b></span></Link><span>A small independent guide · Central Visayas, Philippines</span><button onClick={() => session?.user ? setAlertsOpen(true) : openAuth()}>Account security</button></footer>

    {authOpen && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setAuthOpen(false); }}><section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button className="dialog-close" onClick={() => setAuthOpen(false)} aria-label="Close">×</button><span className="eyebrow">YOUR LAKBAY LOKAL ACCOUNT</span><h2 id="auth-title">{mode === "signin" ? "Welcome back." : "Come wander with us."}</h2><p className="dialog-copy">{mode === "signin" ? "Sign in to keep your account and security alerts close." : "Create a reader account with email verification."}</p>
      {!session?.configured ? <div className="setup-callout"><b>Reader accounts are getting ready.</b><br/>The guide is open to everyone. Connect Supabase using DEPLOY.md to enable accounts, sign-in protection, and private alerts.</div> : <><form onSubmit={submitAuth}><label>Email address<input required type="email" autoComplete="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password<input required type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={mode === "signup" ? 10 : 1} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "signup" ? "At least 10 characters" : "Your password"}/></label><button className="submit-button" disabled={busy}>{busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create reader account"}</button></form>{message && <div className="form-message" role="status">{message}</div>}<p className="switch-mode">{mode === "signin" ? "New around here?" : "Already have an account?"} <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }}>{mode === "signin" ? "Create an account" : "Sign in"}</button></p><p className="dialog-footnote">Three failed password attempts pause sign-in for five minutes. In-site security alerts refresh while you are signed in.</p></>}</section></div>}

    {alertsOpen && session?.user && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setAlertsOpen(false); }}><section className="account-dialog alerts-dialog" role="dialog" aria-modal="true" aria-labelledby="alerts-title"><button className="dialog-close" onClick={() => setAlertsOpen(false)} aria-label="Close">×</button><span className="eyebrow">JUST FOR YOU</span><h2 id="alerts-title">My account alerts</h2><p className="dialog-copy">Recent sign-in attempts for {session.user.email}. This list only shows activity for this account.</p>{session.user.isAdmin && <button className="admin-alert-link" onClick={() => { setAlertsOpen(false); setAdminOpen(true); }}>Open Admin desk · all reader accounts →</button>}{notifications.length ? <div className="alert-list">{notifications.map((item) => <article className="alert-row" key={item.id}><strong>{item.event_type === "locked" ? "Sign-in paused after three failed attempts" : item.event_type === "blocked" ? "Attempt blocked during the five-minute pause" : "A password attempt failed"}</strong><time>{dateLabel(item.created_at)}</time><span>{[item.city, item.region, item.country].filter(Boolean).join(", ") || "Approximate location unavailable"} · {item.ip_address || "IP unavailable"}</span><small>{item.user_agent}</small></article>)}</div> : <p className="empty-alerts">No failed sign-in attempts have been recorded for this account.</p>}<p className="dialog-footnote">Alerts stay inside Lakbay Lokal. If you are signed out during an attempt, they will appear here after you sign in. Location and browser hints can be inaccurate; websites cannot read MAC addresses.</p></section></div>}
    {alertToast && <button className="alert-toast" onClick={() => { setAlertsOpen(true); setAlertToast(null); }}><span>New account alert</span>{alertToast.event_type === "locked" ? "Sign-in paused after repeated failures." : "A failed password attempt was recorded."}<b>See what happened →</b></button>}
  </main>;
}

function CompassMark() {
  return <svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="1.6"/><path d="m24.8 13.2-3.5 9.3-9.3 4.3 3.7-9.6 9.1-4Z" fill="currentColor"/><circle cx="20" cy="20" r="2" fill="#f5ead5"/><path d="M20 1v5M20 34v5M1 20h5M34 20h5" stroke="currentColor" strokeWidth="1.5"/></svg>;
}

function IslandMap() {
  return <svg className="island-map" viewBox="0 0 760 500" role="img" aria-label="Illustrated map of the islands and sea around Cebu and Bohol">
    <rect width="760" height="500" rx="16" fill="#dce8d7"/>
    <path d="M0 73c98 17 143 7 223-19s154-34 232-2 172 49 305 19v429H0Z" fill="#d3e0d2"/>
    <path d="M40 50c98 24 140 7 211-12s154-21 229 8 168 45 260 28" fill="none" stroke="#c0d1c2" strokeWidth="2" strokeDasharray="4 10"/>
    <path d="M132 74c-16 42-28 91-29 137s12 96 3 143-1 84 17 98 38-1 40-26-8-53 4-83 18-65 10-102 1-74 17-111 23-67 10-91-50-1-72 35Z" fill="#7c9a71" stroke="#526f59" strokeWidth="3"/>
    <path d="M395 297c-38-17-91-19-134-8s-57 28-38 42 64 18 109 10 100-14 115-25-14-8-52-19Z" fill="#809c6d" stroke="#526f59" strokeWidth="3"/>
    <path d="M508 370c-17-8-46-9-63 0s-16 21 3 27 42 5 61-2 15-17-1-25Z" fill="#829d70" stroke="#526f59" strokeWidth="2.5"/>
    <path d="M190 281c66-37 125-41 183-26 52 14 102 50 164 101" fill="none" stroke="#bd5839" strokeWidth="4" strokeLinecap="round" strokeDasharray="2 12"/>
    <path d="M155 245c9 38 15 78 8 111M308 302c34 1 63-4 90-17" fill="none" stroke="#bd5839" strokeWidth="2" strokeDasharray="3 9"/>
    <g fill="#f2ead8" stroke="#bd5839" strokeWidth="3"><circle cx="188" cy="282" r="9"/><circle cx="365" cy="257" r="9"/><circle cx="536" cy="361" r="9"/></g>
    <g fill="#49604f" fontFamily="Arial,sans-serif" fontWeight="700" letterSpacing="3"><text x="74" y="45" fontSize="13">A POCKET MAP OF CENTRAL VISAYAS</text><text x="79" y="257" fontSize="16">CEBU</text><text x="303" y="354" fontSize="14">BOHOL</text><text x="524" y="414" fontSize="10">SIQUIJOR</text><text x="614" y="140" fontSize="11" letterSpacing="2">VISAYAN SEA</text></g>
    <g fill="#f7f3e8" opacity=".75"><path d="M553 65q27-11 54 0t54 0 54 0"/><path d="M573 82q18-8 36 0t36 0 36 0"/><path d="M35 445q22-9 44 0t44 0 44 0"/></g>
  </svg>;
}

function DestinationCard({ place, index }: { place: Destination; index: number }) {
  return <article className={`destination-card destination-card-${index % 4}`}>
    <div className={`destination-art art-${place.id}`}><span className="art-coordinate">{place.island} / VISAYAS</span><span className="art-number">{String(index + 1).padStart(2, "0")}</span><div className="art-sun"/><div className="art-land land-one"/><div className="art-land land-two"/><span className="art-kind">{place.category}</span></div>
    <div className="destination-copy"><div className="destination-meta"><span>{place.island}</span><span>{place.mood}</span></div><h3>{place.name}</h3><p>{place.summary}</p><div className="destination-links"><a href={place.officialUrl} target="_blank" rel="noopener noreferrer">Local guide ↗</a><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.mapQuery)}`} target="_blank" rel="noopener noreferrer">Open map ↗</a></div></div>
  </article>;
}
