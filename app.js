
// iOS scroll-jump prevention when keyboard opens
(function() {
  var lastScrollY = 0;
  document.addEventListener('focusin', function(e) {
    if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) {
      lastScrollY = window.scrollY;
    }
  });
  document.addEventListener('focusout', function() {
    window.scrollTo(0, lastScrollY);
  });
  
  // Lock body scroll when modal is open
  var observer = new MutationObserver(function() {
    var hasModal = document.querySelector('[style*="position: fixed"][style*="z-index: 2"]') ||
                   document.querySelector('[style*="position:fixed"][style*="z-index:2"]');
    document.body.style.overflow = hasModal ? 'hidden' : '';
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();

const { useState, useEffect, useRef } = React;
const SUPABASE_URL = "https://tcyyiynqwzxwvfxiydaq.supabase.co";
const SUPABASE_KEY = "sb_publishable_NsELZZQvV15rdpW4hJnGmw_iHPYFeQq";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
async function dbLadeMitarbeiter() {
  try {
    const { data } = await sb.from("bh_mitarbeiter").select("data").order("id").limit(1);
    return data?.[0]?.data || INIT_MA;
  } catch {
    return INIT_MA;
  }
}
async function dbSpeichereMitarbeiter(liste) {
  try {
    const { data } = await sb.from("bh_mitarbeiter").select("id").limit(1);
    if (data?.length) {
      await sb.from("bh_mitarbeiter").update({ data: liste, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", data[0].id);
    } else {
      await sb.from("bh_mitarbeiter").insert({ data: liste });
    }
  } catch (e) {
    console.log("MA speichern:", e);
  }
}
async function dbLadeFaelle() {
  try {
    const { data } = await sb.from("bh_faelle").select("data").order("updated_at", { ascending: false });
    return data?.map((r) => r.data) || [];
  } catch {
    return [];
  }
}
async function dbSpeichereFall(fall) {
  try {
    const { data } = await sb.from("bh_faelle").select("id").eq("fall_id", String(fall.id)).limit(1);
    if (data?.length) {
      await sb.from("bh_faelle").update({ data: fall, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("fall_id", String(fall.id));
    } else {
      await sb.from("bh_faelle").insert({ fall_id: String(fall.id), data: fall });
    }
  } catch (e) {
    console.log("Fall speichern:", e);
  }
}
async function dbLoescheFall(fallId) {
  try {
    await sb.from("bh_faelle").delete().eq("fall_id", String(fallId));
  } catch {
  }
}
async function dbLadeAktivitaeten() {
  try {
    const { data } = await sb.from("bh_aktivitaeten").select("data").order("created_at", { ascending: false }).limit(50);
    return data?.map((r) => r.data) || [];
  } catch {
    return [];
  }
}
async function dbSpeichereAktivitaet(eintrag) {
  try {
    await sb.from("bh_aktivitaeten").insert({ data: eintrag });
  } catch {
  }
}
async function dbLoescheAktivitaet(ts) {
  try {
    await sb.from("bh_aktivitaeten").delete().eq("data->ts", ts);
  } catch {
  }
}
async function dbLoescheAlleAktivitaeten() {
  try {
    await sb.from("bh_aktivitaeten").delete().neq("id", 0);
  } catch {
  }
}
const TEAMS = [
  { id: "buero", label: "B\xFCro", icon: "\u{1F5C2}", farbe: "#6B7FD4" },
  { id: "technik", label: "Technik", icon: "\u{1F690}", farbe: "#4FA87A" }
];
const ROLLEN = {
  buero: ["Gesch\xE4ftsf\xFChrer/in", "Prokurist/in", "Berater/in", "B\xFCroleitung", "Sachbearbeitung", "Kundenbetreuung", "Buchhaltung", "Sonstiges"],
  technik: ["Gesch\xE4ftsf\xFChrer/in", "Prokurist/in", "Berater/in", "Bestatter/in", "Fahrer/in", "\xDCberf\xFChrung", "Aufbahrungs-Fachkraft", "Sonstiges"]
};
const AVATAR_FARBEN = ["#4FA87A", "#D46B6B", "#6B7FD4", "#C5A55A", "#7AAFCC", "#9E7AC5", "#CC9A5A", "#5AAA8A"];
const ZUSTAND_OPT = ["Gut", "Normal", "Beeintr\xE4chtigt", "Stark beeintr\xE4chtigt"];
const UEBERFUEHRT = ["Direkt", "Klinik", "Altenheim", "Unfallort", "Ausland", "Sonstiges"];
const VERBLEIB_SCH = ["Bei Verstorbenen", "Familie \xFCbergeben", "Depot Bestattungshaus", "Sonstiges"];
const VERBLEIB_WERT = ["Familie \xFCbergeben", "Depot Bestattungshaus", "Polizei \xFCbergeben", "Sonstiges"];
const SCHRITTE_DEF = [
  { id: "s1", titel: "Erstgespr\xE4ch mit Familie", gruppe: "Aufnahme", team: "buero" },
  { id: "s2", titel: "\xDCberf\xFChrung durchgef\xFChrt", gruppe: "Aufnahme", team: "technik" },
  { id: "s3", titel: "Zustandsdokumentation erstellt", gruppe: "Aufnahme", team: "technik" },
  { id: "s4", titel: "Aufbahrung vorbereitet", gruppe: "Vorbereitung", team: "technik" },
  { id: "s5", titel: "Sterbeurkunde beantragt", gruppe: "Beh\xF6rden", team: "buero" },
  { id: "s6", titel: "Sarg / Urne bestellt", gruppe: "Vorbereitung", team: "buero" },
  { id: "s7", titel: "Trauerfeier geplant", gruppe: "Feier", team: "buero" },
  { id: "s8", titel: "Friedhof koordiniert", gruppe: "Feier", team: "buero" },
  { id: "s9", titel: "Trauerfeier durchgef\xFChrt", gruppe: "Feier", team: "technik" },
  { id: "s10", titel: "Bestattung abgeschlossen", gruppe: "Abschluss", team: "technik" },
  { id: "s11", titel: "Nachbetreuung Familie", gruppe: "Abschluss", team: "buero" },
  { id: "s12", titel: "Akte geschlossen", gruppe: "Abschluss", team: "buero" }
];
const INIT_MA = [
  { id: 1, name: "Maria Hoffmann", rolle: "Bestatter/in", team: "technik", farbe: "#4FA87A", kuerzel: "MH", email: "" },
  { id: 2, name: "Thomas Braun", rolle: "Fahrer/in", team: "technik", farbe: "#D46B6B", kuerzel: "TB", email: "" },
  { id: 3, name: "Sandra Klein", rolle: "Sachbearbeitung", team: "buero", farbe: "#6B7FD4", kuerzel: "SK", email: "" },
  { id: 4, name: "Klaus M\xFCller", rolle: "Bestatter/in", team: "technik", farbe: "#C5A55A", kuerzel: "KM", email: "" }
];
const tagNr = () => (/* @__PURE__ */ new Date()).toLocaleDateString("de-DE");
const uhrzeit = () => (/* @__PURE__ */ new Date()).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
const kuerzel = (n) => n.trim().split(/\s+/).map((w) => w[0] || "").join("").toUpperCase().slice(0, 2) || "??";
const leerSchritte = () => SCHRITTE_DEF.map((s) => ({ ...s, status: "offen", verantw: null, notiz: "", vonId: null, amDatum: null }));
const leerDoku = () => ({
  uDatum: "",
  uZeit: "",
  uArt: "Direkt",
  uVon: "",
  uDurch: [],
  zustand: "Normal",
  besonderheiten: "",
  zustandsFoto: null,
  schmuck: [],
  kleidungDa: false,
  kleidungText: "",
  kleidungFamilie: false,
  wertgegenstaende: [],
  hinweise: "",
  // Einsargungsbericht
  eins: {
    abholDatum: "",
    abholZeit: "",
    abholOrt: "",
    zielOrt: "",
    friedhof: "",
    mitTrage: null,
    // true/false/null
    fahrer: "",
    beifahrer: "",
    artDesTodes: "natuerlich",
    // "natuerlich"|"kripofall"|"sonstiges"
    artDesTodesSonstiges: "",
    zustandVerst: "",
    abschiedMoeglich: null,
    gegenstaendeSchmuck: "",
    massnahmen: {
      grundversorgung: false,
      hygienisch: false,
      thanatopraktisch: false,
      ankleidungPersoenlich: false,
      ankleidungSterbegewand: false,
      kosmetisch: false
    },
    bemerkungen: "",
    sargmodell: "",
    sargkreuz: null,
    sargkreuzWelches: "",
    deckengarnitur: null,
    deckengarniturWelche: "",
    besondereWuensche: "",
    sargVerschlossen: false,
    abschlussOrt: "",
    abschlussDatum: "",
    abschlussUnterschrift: ""
  }
});
const leerFall = (id) => ({ id, name: "", geb: "", tod: tagNr(), ort: "", verantw: null, status: "offen", doku: leerDoku(), schritte: leerSchritte(), notizen: [], dokumente: [] });
function offenePunkte(fall) {
  if (!fall) return 0;
  const d = fall.doku || {};
  let n = fall.schritte.filter((s) => s.status !== "abgeschlossen").length;
  if (!d.uDatum) n++;
  if (!d.uZeit) n++;
  if (!d.uVon) n++;
  if (!d.uDurch || d.uDurch.length === 0) n++;
  if (!d.besonderheiten) n++;
  if (!d.kleidungDa) n++;
  else if (!d.kleidungText) n++;
  if (!d.hinweise) n++;
  return n;
}
function Avatar({ k, farbe, size = 40 }) {
  return /* @__PURE__ */ React.createElement("div", { style: { width: size, height: size, borderRadius: "50%", background: farbe, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 800, flexShrink: 0, fontFamily: "Georgia,serif" } }, k);
}
function WarnChip({ n }) {
  if (!n) return null;
  return /* @__PURE__ */ React.createElement("span", { style: { background: "#FF9500", color: "#fff", borderRadius: 10, padding: "2px 8px", fontSize: 11, fontWeight: 700 } }, "\u26A0 ", n);
}
function Btn({ label, icon, onClick, color = "#C5A55A", textColor = "#1C1A17", full, small, outline, danger }) {
  const bg = danger ? "#D44" : outline ? "transparent" : color;
  const border = outline ? `2px solid ${color}` : danger ? "2px solid #D44" : "none";
  const col = outline ? color : danger ? "#D44" : textColor;
  return /* @__PURE__ */ React.createElement("button", { onClick, style: {
    width: full ? "100%" : void 0,
    background: bg,
    border,
    borderRadius: 12,
    padding: small ? "10px 16px" : "14px 20px",
    color: col,
    cursor: "pointer",
    fontSize: small ? 14 : 16,
    fontWeight: 700,
    fontFamily: "Georgia,serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    WebkitTapHighlightColor: "transparent"
  } }, icon && /* @__PURE__ */ React.createElement("span", { style: { fontSize: small ? 16 : 20 } }, icon), label);
}
function Feld({ label, value, onChange, placeholder, typ = "text", warn }) {
  return /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { color: "#AAA", fontSize: 12, marginBottom: 5, display: "flex", gap: 6, alignItems: "center" } }, label, warn && !value && /* @__PURE__ */ React.createElement("span", { style: { color: "#FF9500", fontSize: 11 } }, "\u26A0 fehlt")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: typ,
      value,
      onChange: (e) => onChange(e.target.value),
      placeholder: placeholder || label,
      style: { width: "100%", boxSizing: "border-box", background: "#2A2825", border: `1px solid ${warn && !value ? "#FF9500" : "rgba(255,255,255,.15)"}`, borderRadius: 10, padding: "13px 14px", color: "#F0EAE0", fontSize: 16, outline: "none", fontFamily: "Georgia,serif", WebkitAppearance: "none" }
    }
  ));
}
function Textarea({ label, value, onChange, placeholder, warn }) {
  return /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { color: "#AAA", fontSize: 12, marginBottom: 5, display: "flex", gap: 6, alignItems: "center" } }, label, warn && !value && /* @__PURE__ */ React.createElement("span", { style: { color: "#FF9500", fontSize: 11 } }, "\u26A0 fehlt")), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      value,
      onChange: (e) => onChange(e.target.value),
      placeholder: placeholder || label,
      rows: 3,
      style: { width: "100%", boxSizing: "border-box", background: "#2A2825", border: `1px solid ${warn && !value ? "#FF9500" : "rgba(255,255,255,.15)"}`, borderRadius: 10, padding: "13px 14px", color: "#F0EAE0", fontSize: 16, outline: "none", resize: "none", fontFamily: "Georgia,serif" }
    }
  ));
}
function Auswahl({ label, value, onChange, optionen }) {
  return /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { color: "#AAA", fontSize: 12, marginBottom: 5 } }, label), /* @__PURE__ */ React.createElement(
    "select",
    {
      value,
      onChange: (e) => onChange(e.target.value),
      style: { width: "100%", boxSizing: "border-box", background: "#2A2825", border: "1px solid rgba(255,255,255,.15)", borderRadius: 10, padding: "13px 14px", color: "#F0EAE0", fontSize: 16, outline: "none", fontFamily: "Georgia,serif", WebkitAppearance: "none" }
    },
    optionen.map((o) => /* @__PURE__ */ React.createElement("option", { key: o, value: o }, o))
  ));
}
function Toggle({ label, checked, onChange }) {
  return /* @__PURE__ */ React.createElement("div", { onClick: () => onChange(!checked), style: { display: "flex", alignItems: "center", gap: 14, padding: "14px 0", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,.07)" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 50, height: 30, borderRadius: 15, background: checked ? "#4FA87A" : "rgba(255,255,255,.15)", position: "relative", flexShrink: 0, transition: "background .2s" } }, /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: 3, left: checked ? 23 : 3, width: 24, height: 24, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.3)" } })), /* @__PURE__ */ React.createElement("span", { style: { color: "#F0EAE0", fontSize: 16 } }, label));
}
function MAWahl({ value, onChange, mitarbeiter, label }) {
  return /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { color: "#AAA", fontSize: 12, marginBottom: 8 } }, label), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { onClick: () => onChange(null), style: { padding: "8px 14px", borderRadius: 20, border: `2px solid ${value === null ? "#C5A55A" : "rgba(255,255,255,.15)"}`, color: value === null ? "#C5A55A" : "#888", cursor: "pointer", fontSize: 14, fontWeight: 600 } }, "Niemand"), mitarbeiter.map((m) => /* @__PURE__ */ React.createElement("div", { key: m.id, onClick: () => onChange(m.id), style: { display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 20, border: `2px solid ${value === m.id ? m.farbe : "rgba(255,255,255,.15)"}`, background: value === m.id ? `${m.farbe}25` : "transparent", cursor: "pointer", transition: "all .15s" } }, /* @__PURE__ */ React.createElement(Avatar, { k: m.kuerzel, farbe: m.farbe, size: 24 }), /* @__PURE__ */ React.createElement("span", { style: { color: value === m.id ? "#F0EAE0" : "#888", fontSize: 14, fontWeight: 600 } }, m.name.split(" ")[0])))));
}
function Sheet({ onClose, children, titel }) {
  return /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }, onClick: onClose }, /* @__PURE__ */ React.createElement("div", { onClick: (e) => e.stopPropagation(), style: { background: "#1E1C19", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 600, maxHeight: "92vh", display: "flex", flexDirection: "column", paddingBottom: "env(safe-area-inset-bottom)" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 40, height: 4, background: "rgba(255,255,255,.2)", borderRadius: 2, margin: "16px auto 0" } }), titel && /* @__PURE__ */ React.createElement("div", { style: { padding: "14px 20px 0", borderBottom: "1px solid rgba(255,255,255,.08)", paddingBottom: 14 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#C5A55A", fontWeight: 700, fontSize: 18, fontFamily: "Georgia,serif" } }, titel)), /* @__PURE__ */ React.createElement("div", { style: { overflowY: "auto", flex: 1, padding: "16px 20px 20px", WebkitOverflowScrolling: "touch" } }, children)));
}
function SchrittKarte({ schritt, mitarbeiter, onToggle, onNotiz, onVerantw }) {
  const [offen, setOffen] = useState(false);
  const erledigt = schritt.status === "abgeschlossen";
  const inArbeit = schritt.status === "in_bearbeitung";
  const verantw = mitarbeiter.find((m) => m.id === schritt.verantw);
  const team = TEAMS.find((t) => t.id === schritt.team);
  return /* @__PURE__ */ React.createElement("div", { style: { background: erledigt ? "rgba(79,168,122,.1)" : "#2A2825", border: `2px solid ${erledigt ? "#4FA87A" : inArbeit ? "#C5A55A" : "rgba(255,255,255,.1)"}`, borderRadius: 14, marginBottom: 10, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }, onClick: () => setOffen((o) => !o) }, /* @__PURE__ */ React.createElement("div", { onClick: (e) => {
    e.stopPropagation();
    onToggle();
  }, style: { width: 36, height: 36, borderRadius: "50%", border: `3px solid ${erledigt ? "#4FA87A" : inArbeit ? "#C5A55A" : "rgba(255,255,255,.3)"}`, background: erledigt ? "#4FA87A" : inArbeit ? "rgba(197,165,90,.2)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s" } }, erledigt && /* @__PURE__ */ React.createElement("span", { style: { color: "#fff", fontSize: 18, lineHeight: 1 } }, "\u2713"), inArbeit && /* @__PURE__ */ React.createElement("span", { style: { color: "#C5A55A", fontSize: 12 } }, "\u25CF")), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { color: erledigt ? "#6BA874" : "#F0EAE0", fontSize: 16, fontWeight: 700, textDecoration: erledigt ? "line-through" : "none", marginBottom: 3 } }, schritt.titel), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: team?.farbe || "#666", fontWeight: 600 } }, team?.icon, " ", team?.label), verantw && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#888" } }, "\xB7 ", verantw.name.split(" ")[0]))), /* @__PURE__ */ React.createElement("span", { style: { color: "#555", fontSize: 14, padding: "4px 8px" } }, offen ? "\u25B2" : "\u25BC")), erledigt && schritt.vonId && (() => {
    const v = mitarbeiter.find((m) => m.id === schritt.vonId);
    return v ? /* @__PURE__ */ React.createElement("div", { style: { padding: "0 16px 10px", color: "#4FA87A", fontSize: 12, display: "flex", gap: 6, alignItems: "center" } }, /* @__PURE__ */ React.createElement(Avatar, { k: v.kuerzel, farbe: v.farbe, size: 18 }), v.name, " \xB7 ", schritt.amDatum) : null;
  })(), offen && /* @__PURE__ */ React.createElement("div", { style: { padding: "0 16px 16px", borderTop: "1px solid rgba(255,255,255,.08)" } }, /* @__PURE__ */ React.createElement(MAWahl, { value: schritt.verantw, onChange: onVerantw, mitarbeiter, label: "Zust\xE4ndig" }), /* @__PURE__ */ React.createElement("div", { style: { color: "#AAA", fontSize: 12, marginBottom: 6 } }, "Anmerkung"), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      value: schritt.notiz,
      onChange: (e) => onNotiz(e.target.value),
      placeholder: "z. B. Hinweis f\xFCr Kollegen \u2026",
      rows: 2,
      style: { width: "100%", boxSizing: "border-box", background: "#1A1816", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, padding: "12px", color: "#C8C0B0", fontSize: 15, outline: "none", resize: "none", fontFamily: "Georgia,serif" }
    }
  )));
}
function ZustandsFoto({ foto, onChange }) {
  const ref = useRef(null);
  const [voll, setVoll] = useState(false);
  const lade = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => onChange(ev.target.result);
    r.readAsDataURL(f);
  };
  return /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { color: "#AAA", fontSize: 12, marginBottom: 8 } }, "Zustandsfoto ", /* @__PURE__ */ React.createElement("span", { style: { color: "#555", fontSize: 11 } }, "(optional)")), /* @__PURE__ */ React.createElement("input", { ref, type: "file", accept: "image/*", capture: "environment", onChange: lade, style: { display: "none" } }), !foto ? /* @__PURE__ */ React.createElement("div", { onClick: () => ref.current?.click(), style: { border: "2px dashed rgba(255,255,255,.15)", borderRadius: 12, padding: "24px", textAlign: "center", cursor: "pointer" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 32, marginBottom: 6 } }, "\u{1F4F7}"), /* @__PURE__ */ React.createElement("div", { style: { color: "#666", fontSize: 14 } }, "Foto aufnehmen oder ausw\xE4hlen")) : /* @__PURE__ */ React.createElement("div", { style: { position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,.15)" } }, /* @__PURE__ */ React.createElement("img", { src: foto, alt: "", onClick: () => setVoll(true), style: { width: "100%", maxHeight: 200, objectFit: "cover", display: "block", cursor: "pointer" } }), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: 8, right: 8, display: "flex", gap: 6 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => ref.current?.click(), style: { background: "rgba(0,0,0,.65)", border: "none", borderRadius: 8, padding: "8px 12px", color: "#fff", cursor: "pointer", fontSize: 13, backdropFilter: "blur(4px)" } }, "\u{1F504} Ersetzen"), /* @__PURE__ */ React.createElement("button", { onClick: () => onChange(null), style: { background: "rgba(180,0,0,.7)", border: "none", borderRadius: 8, padding: "8px 12px", color: "#fff", cursor: "pointer", fontSize: 13 } }, "\u{1F5D1}"))), voll && foto && /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,.95)", zIndex: 900, display: "flex", flexDirection: "column" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "14px 16px", display: "flex", gap: 10, background: "rgba(20,18,14,.98)", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setVoll(false), style: { background: "rgba(255,255,255,.1)", border: "none", borderRadius: 8, padding: "10px 16px", color: "#fff", cursor: "pointer", fontSize: 15, fontFamily: "Georgia,serif" } }, "\u2190 Zur\xFCck"), /* @__PURE__ */ React.createElement("a", { href: foto, download: "zustandsfoto.jpg", style: { background: "rgba(197,165,90,.2)", border: "none", borderRadius: 8, padding: "10px 16px", color: "#C5A55A", textDecoration: "none", fontSize: 15, fontFamily: "Georgia,serif" } }, "\u2B07 Download")), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 } }, /* @__PURE__ */ React.createElement("img", { src: foto, alt: "", style: { maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8 } }))));
}
function Dokumente({ liste, onChange, aktiverUser, mitarbeiter, fallName }) {
  const kamRef = useRef(null);
  const datRef = useRef(null);
  const [vorschau, setVorschau] = useState(null);
  const [loeschId, setLoeschId] = useState(null);
  const sichereListe = Array.isArray(liste) ? liste : [];
  const addFiles = (files) => {
    if (!files?.length) return;
    const fileArr = Array.from(files);
    let pending = fileArr.length;
    const neueItems = [];
    fileArr.forEach((f) => {
      const r = new FileReader();
      r.onload = (e) => {
        neueItems.push({ id: Date.now() + Math.random(), name: f.name.replace(/\.[^.]+$/, ""), dateiName: f.name, dateiTyp: f.type, dateiGroesse: f.size, dateiUrl: e.target.result, vonId: aktiverUser, am: `${tagNr()} ${uhrzeit()}` });
        pending--;
        if (pending === 0) onChange([...sichereListe, ...neueItems]);
      };
      r.readAsDataURL(f);
    });
  };
  const del = (id) => {
    onChange(sichereListe.filter((d) => d.id !== id));
    setLoeschId(null);
  };
  const fmtBytes = (b) => b < 1024 ? `${b}B` : b < 1048576 ? `${(b / 1024).toFixed(0)}KB` : `${(b / 1048576).toFixed(1)}MB`;
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("input", { ref: kamRef, type: "file", accept: "image/*", capture: "environment", multiple: true, onChange: (e) => addFiles(e.target.files), style: { display: "none" } }), /* @__PURE__ */ React.createElement("input", { ref: datRef, type: "file", accept: "*/*", multiple: true, onChange: (e) => addFiles(e.target.files), style: { display: "none" } }), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 } }, /* @__PURE__ */ React.createElement("div", { onClick: () => kamRef.current?.click(), style: { background: "rgba(91,158,201,.12)", border: "2px dashed rgba(91,158,201,.4)", borderRadius: 14, padding: "20px 12px", textAlign: "center", cursor: "pointer" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 34, marginBottom: 6 } }, "\u{1F4F7}"), /* @__PURE__ */ React.createElement("div", { style: { color: "#5B9EC9", fontWeight: 700, fontSize: 15 } }, "Scannen"), /* @__PURE__ */ React.createElement("div", { style: { color: "#667", fontSize: 12, marginTop: 3 } }, "Kamera / Foto")), /* @__PURE__ */ React.createElement("div", { onClick: () => datRef.current?.click(), style: { background: "rgba(197,165,90,.1)", border: "2px dashed rgba(197,165,90,.4)", borderRadius: 14, padding: "20px 12px", textAlign: "center", cursor: "pointer" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 34, marginBottom: 6 } }, "\u{1F4CE}"), /* @__PURE__ */ React.createElement("div", { style: { color: "#C5A55A", fontWeight: 700, fontSize: 15 } }, "Datei"), /* @__PURE__ */ React.createElement("div", { style: { color: "#667", fontSize: 12, marginTop: 3 } }, "PDF, Word \u2026"))), sichereListe.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "30px 0", color: "#555" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 40, marginBottom: 8 } }, "\u{1F4C2}"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14 } }, "Noch keine Dokumente")), sichereListe.map((d) => {
    const istBild = d.dateiTyp?.startsWith("image/");
    return /* @__PURE__ */ React.createElement("div", { key: d.id, style: { background: "#2A2825", border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, marginBottom: 10, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, padding: "14px" } }, istBild && d.dateiUrl ? /* @__PURE__ */ React.createElement("img", { src: d.dateiUrl, alt: "", style: { width: 52, height: 52, objectFit: "cover", borderRadius: 8, flexShrink: 0 } }) : /* @__PURE__ */ React.createElement("div", { style: { width: 52, height: 52, background: "rgba(255,255,255,.06)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 26 } }, d.dateiTyp === "application/pdf" ? "\u{1F4C4}" : istBild ? "\u{1F5BC}" : "\u{1F4CE}"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { color: "#F0EAE0", fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, d.name || d.dateiName), /* @__PURE__ */ React.createElement("div", { style: { color: "#666", fontSize: 12, marginTop: 3 } }, d.dateiName, " \xB7 ", fmtBytes(d.dateiGroesse || 0)), /* @__PURE__ */ React.createElement("div", { style: { color: "#555", fontSize: 11 } }, d.am)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 } }, d.dateiUrl && /* @__PURE__ */ React.createElement("button", { onClick: () => setVorschau(d), style: { background: "rgba(197,165,90,.15)", border: "none", borderRadius: 8, padding: "7px 10px", color: "#C5A55A", cursor: "pointer", fontSize: 16 } }, "\u{1F441}"), loeschId === d.id ? /* @__PURE__ */ React.createElement("button", { onClick: () => del(d.id), style: { background: "rgba(200,0,0,.8)", border: "none", borderRadius: 8, padding: "7px 10px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 } }, "L\xF6schen?") : /* @__PURE__ */ React.createElement("button", { onClick: () => setLoeschId(d.id), style: { background: "rgba(255,80,80,.1)", border: "none", borderRadius: 8, padding: "7px 10px", color: "#ff6b6b", cursor: "pointer", fontSize: 16 } }, "\u{1F5D1}"))));
  }), vorschau && /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,.96)", zIndex: 900, display: "flex", flexDirection: "column" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "14px 16px", display: "flex", gap: 10, background: "rgba(20,18,14,.98)", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setVorschau(null), style: { background: "rgba(255,255,255,.1)", border: "none", borderRadius: 8, padding: "10px 16px", color: "#fff", cursor: "pointer", fontSize: 15, fontFamily: "Georgia,serif" } }, "\u2190 Zur\xFCck"), /* @__PURE__ */ React.createElement("span", { style: { flex: 1, color: "#E8E0D0", alignSelf: "center", fontWeight: 700 } }, vorschau.name), vorschau.dateiUrl && /* @__PURE__ */ React.createElement("a", { href: vorschau.dateiUrl, download: vorschau.dateiName, style: { background: "rgba(197,165,90,.2)", border: "none", borderRadius: 8, padding: "10px 16px", color: "#C5A55A", textDecoration: "none", fontSize: 15 } }, "\u2B07")), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: 12 } }, vorschau.dateiTyp?.startsWith("image/") ? /* @__PURE__ */ React.createElement("img", { src: vorschau.dateiUrl, alt: "", style: { maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8 } }) : vorschau.dateiTyp === "application/pdf" ? /* @__PURE__ */ React.createElement("iframe", { src: vorschau.dateiUrl, style: { width: "100%", height: "100%", border: "none" }, title: vorschau.name }) : /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", color: "#666" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 60, marginBottom: 12 } }, "\u{1F4CE}"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, color: "#AAA", marginBottom: 16 } }, vorschau.dateiName), /* @__PURE__ */ React.createElement("a", { href: vorschau.dateiUrl, download: vorschau.dateiName, style: { display: "inline-block", background: "#C5A55A", color: "#1C1A17", borderRadius: 10, padding: "13px 28px", textDecoration: "none", fontWeight: 700, fontSize: 16 } }, "\u2B07 Herunterladen")))));
}
function Drucken({ fall, mitarbeiter, onClose }) {
  const drucken = () => {
    const w = window.open("", "_blank");
    if (!w) {
      alert("Bitte Pop-ups erlauben und nochmal tippen.");
      return;
    }
    const el = document.getElementById("druckblatt");
    if (!el) return;
    w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Fallakte</title><style>body{margin:0;padding:16mm 18mm;font-family:Georgia,serif;font-size:10.5pt;color:#1a1a1a}table{border-collapse:collapse}@page{size:A4;margin:0}</style></head><body>' + el.innerHTML + "</body></html>");
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 600);
  };
  const vw = mitarbeiter.find((m) => m.id === fall.verantw);
  const d = fall.doku || {};
  const abg = fall.schritte.filter((s2) => s2.status === "abgeschlossen").length;
  const printCSS = `@media print{body *{visibility:hidden!important}#druckblatt,#druckblatt *{visibility:visible!important}#druckblatt{position:fixed!important;inset:0!important;background:white!important;z-index:9999!important;padding:16mm 18mm!important;font-family:Georgia,serif!important;color:#1a1a1a!important;font-size:10.5pt!important}.no-print{display:none!important}@page{size:A4;margin:0}}`;
  const s = { sec: { marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid #ddd" }, h: { fontSize: 11, fontWeight: 700, color: "#5A3A10", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }, grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 8 }, lbl: { color: "#888", fontSize: 10, marginBottom: 2 }, val: { color: "#1a1a1a", fontWeight: 600, fontSize: 11 } };
  return /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,.88)", zIndex: 700, overflow: "auto" } }, /* @__PURE__ */ React.createElement("style", null, printCSS), /* @__PURE__ */ React.createElement("div", { className: "no-print", style: { position: "sticky", top: 0, background: "rgba(20,18,14,.97)", borderBottom: "1px solid rgba(197,165,90,.2)", padding: "12px 16px", display: "flex", gap: 10 } }, /* @__PURE__ */ React.createElement("button", { onClick: onClose, style: { background: "rgba(255,255,255,.1)", border: "none", borderRadius: 8, padding: "10px 16px", color: "#fff", cursor: "pointer", fontSize: 15, fontFamily: "Georgia,serif" } }, "\u2190 Zur\xFCck"), /* @__PURE__ */ React.createElement("span", { style: { flex: 1, color: "#888", alignSelf: "center", fontSize: 13 } }, "Druckvorschau A4"), /* @__PURE__ */ React.createElement("button", { onClick: drucken, style: { background: "#C5A55A", border: "none", borderRadius: 8, padding: "10px 20px", color: "#1C1A17", cursor: "pointer", fontWeight: 700, fontSize: 15, fontFamily: "Georgia,serif" } }, "\u{1F5A8} Drucken / PDF")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "center", padding: "20px 12px 40px" } }, /* @__PURE__ */ React.createElement("div", { id: "druckblatt", style: { width: "210mm", maxWidth: "100%", background: "white", padding: "16mm 18mm", boxShadow: "0 4px 40px rgba(0,0,0,.5)", fontFamily: "Georgia,serif", color: "#1a1a1a", fontSize: "10.5pt", boxSizing: "border-box" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid #8B6030" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 20, fontWeight: 700, color: "#3D2200" } }, "\u269C Bestattungshaus \u2014 Fallakte"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#888", marginTop: 3 } }, "Interne Dokumentation \xB7 vertraulich")), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right", fontSize: 10, color: "#888" } }, /* @__PURE__ */ React.createElement("div", null, "Erstellt: ", tagNr()), /* @__PURE__ */ React.createElement("div", null, "Fall-ID: #", fall.id), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 6, padding: "3px 8px", background: fall.status === "abgeschlossen" ? "#e6f9ee" : fall.status === "in_bearbeitung" ? "#e8f0fc" : "#fdf5e6", borderRadius: 4, color: fall.status === "abgeschlossen" ? "#2a7a3a" : fall.status === "in_bearbeitung" ? "#1a4a8a" : "#7a5a10", fontWeight: 700, fontSize: 10 } }, fall.status === "abgeschlossen" ? "\u2713 ABGESCHLOSSEN" : fall.status === "in_bearbeitung" ? "\u27F3 IN BEARBEITUNG" : "\u25CB OFFEN"))), /* @__PURE__ */ React.createElement("div", { style: s.sec }, /* @__PURE__ */ React.createElement("div", { style: s.h }, "\u{1F464} Verstorbene/r"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 700, marginBottom: 8 } }, fall.name), /* @__PURE__ */ React.createElement("div", { style: s.grid }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Geburtsdatum"), /* @__PURE__ */ React.createElement("div", { style: s.val }, fall.geb || "\u2014")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Sterbedatum"), /* @__PURE__ */ React.createElement("div", { style: s.val }, fall.tod)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Sterbeort"), /* @__PURE__ */ React.createElement("div", { style: s.val }, fall.ort || "\u2014")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Verantwortlich"), /* @__PURE__ */ React.createElement("div", { style: s.val }, vw ? `${vw.name} (${vw.rolle})` : "\u2014")))), /* @__PURE__ */ React.createElement("div", { style: s.sec }, /* @__PURE__ */ React.createElement("div", { style: s.h }, "\u{1F690} \xDCberf\xFChrung"), /* @__PURE__ */ React.createElement("div", { style: s.grid }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Datum"), /* @__PURE__ */ React.createElement("div", { style: s.val }, d.uDatum || "\u2014")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Uhrzeit"), /* @__PURE__ */ React.createElement("div", { style: s.val }, d.uZeit || "\u2014")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Art"), /* @__PURE__ */ React.createElement("div", { style: s.val }, d.uArt || "\u2014")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Von (Ort)"), /* @__PURE__ */ React.createElement("div", { style: s.val }, d.uVon || "\u2014")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Durchgef\xFChrt von"), /* @__PURE__ */ React.createElement("div", { style: s.val }, (d.uDurch || []).map((id) => mitarbeiter.find((m) => m.id === id)?.name).filter(Boolean).join(", ") || "\u2014")))), /* @__PURE__ */ React.createElement("div", { style: s.sec }, /* @__PURE__ */ React.createElement("div", { style: s.h }, "\u{1F4CB} Zustand"), /* @__PURE__ */ React.createElement("div", { style: s.grid }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Allgemeiner Zustand"), /* @__PURE__ */ React.createElement("div", { style: s.val }, d.zustand || "\u2014"))), d.besonderheiten && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Besonderheiten / Verletzungen"), /* @__PURE__ */ React.createElement("div", { style: s.val }, d.besonderheiten)), d.zustandsFoto && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8 } }, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Zustandsfoto"), /* @__PURE__ */ React.createElement("img", { src: d.zustandsFoto, alt: "Zustandsfoto", style: { maxWidth: "100%", maxHeight: 180, objectFit: "contain", borderRadius: 6, border: "1px solid #ddd", marginTop: 4 } }))), d.schmuck?.length > 0 && /* @__PURE__ */ React.createElement("div", { style: s.sec }, /* @__PURE__ */ React.createElement("div", { style: s.h }, "\u{1F48D} Schmuck"), /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 10 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "#f5ede0" } }, ["Bezeichnung", "Material", "Verbleib"].map((h) => /* @__PURE__ */ React.createElement("th", { key: h, style: { padding: "3px 7px", textAlign: "left", color: "#5A3A10" } }, h)))), /* @__PURE__ */ React.createElement("tbody", null, d.schmuck.map((sc, i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderBottom: "1px solid #eee" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "3px 7px" } }, sc.bezeichnung), /* @__PURE__ */ React.createElement("td", { style: { padding: "3px 7px" } }, sc.material), /* @__PURE__ */ React.createElement("td", { style: { padding: "3px 7px" } }, sc.verbleib)))))), d.kleidungDa && /* @__PURE__ */ React.createElement("div", { style: s.sec }, /* @__PURE__ */ React.createElement("div", { style: s.h }, "\u{1F454} Kleidung"), /* @__PURE__ */ React.createElement("div", { style: s.val }, d.kleidungText || "\u2014"), d.kleidungFamilie && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#666", marginTop: 3 } }, "Von Familie mitgebracht")), d.wertgegenstaende?.length > 0 && /* @__PURE__ */ React.createElement("div", { style: s.sec }, /* @__PURE__ */ React.createElement("div", { style: s.h }, "\u{1F5DD} Wertgegenst\xE4nde"), /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 10 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "#f5ede0" } }, ["Gegenstand", "Verbleib"].map((h) => /* @__PURE__ */ React.createElement("th", { key: h, style: { padding: "3px 7px", textAlign: "left", color: "#5A3A10" } }, h)))), /* @__PURE__ */ React.createElement("tbody", null, d.wertgegenstaende.map((w, i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderBottom: "1px solid #eee" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "3px 7px" } }, w.bezeichnung), /* @__PURE__ */ React.createElement("td", { style: { padding: "3px 7px" } }, w.verbleib)))))), d.hinweise && /* @__PURE__ */ React.createElement("div", { style: s.sec }, /* @__PURE__ */ React.createElement("div", { style: s.h }, "\u{1F4DD} Hinweise"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, lineHeight: 1.6, whiteSpace: "pre-wrap" } }, d.hinweise)), /* @__PURE__ */ React.createElement("div", { style: s.sec }, /* @__PURE__ */ React.createElement("div", { style: { ...s.h, display: "flex", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", null, "\u2713 Arbeitsschritte"), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 400, color: "#888" } }, abg, "/", fall.schritte.length, " erledigt")), /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 9.5 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "#f5ede0" } }, ["Schritt", "Status", "Erledigt von", "Am"].map((h) => /* @__PURE__ */ React.createElement("th", { key: h, style: { padding: "3px 6px", textAlign: "left", color: "#5A3A10" } }, h)))), /* @__PURE__ */ React.createElement("tbody", null, fall.schritte.map((sc, i) => {
    const ev = mitarbeiter.find((m) => m.id === sc.vonId);
    return /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderBottom: "1px solid #eee", background: sc.status === "abgeschlossen" ? "#efffee" : "white" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "3px 6px" } }, sc.titel), /* @__PURE__ */ React.createElement("td", { style: { padding: "3px 6px", color: sc.status === "abgeschlossen" ? "#2a7a3a" : sc.status === "in_bearbeitung" ? "#1a4a8a" : "#888" } }, sc.status === "abgeschlossen" ? "\u2713" : sc.status === "in_bearbeitung" ? "\u27F3" : "\u25CB"), /* @__PURE__ */ React.createElement("td", { style: { padding: "3px 6px" } }, ev?.name || "\u2014"), /* @__PURE__ */ React.createElement("td", { style: { padding: "3px 6px" } }, sc.amDatum || "\u2014"));
  })))), fall.dokumente?.length > 0 && /* @__PURE__ */ React.createElement("div", { style: s.sec }, /* @__PURE__ */ React.createElement("div", { style: s.h }, "\u{1F4C2} Dokumente (", fall.dokumente.length, ")"), fall.dokumente.map((dok, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { fontSize: 10, padding: "2px 0", borderBottom: "1px solid #f0f0f0" } }, "\xB7 ", dok.name || dok.dateiName, " \xB7 ", dok.am))), (() => {
    const ei = fall.doku?.eins || {};
    const m = ei.massnahmen || {};
    const aktMassnahmen = [ei.massnahmen?.grundversorgung && "Grundversorgung", ei.massnahmen?.hygienisch && "Hygienische Versorgung", ei.massnahmen?.thanatopraktisch && "Thanatopraktische Ma\xDFnahmen", ei.massnahmen?.ankleidungPersoenlich && "Ankleidung (pers\xF6nliche Kleidung)", ei.massnahmen?.ankleidungSterbegewand && "Ankleidung (Sterbegewand)", ei.massnahmen?.kosmetisch && "Kosmetische Versorgung"].filter(Boolean);
    return (ei.abholDatum || ei.abholOrt || ei.sargmodell) && /* @__PURE__ */ React.createElement("div", { style: { ...s.sec, marginTop: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { ...s.h, fontSize: 13, background: "#f5ede0", padding: "5px 8px", borderRadius: 4, marginBottom: 10 } }, "\u26B0 EINSARGUNGSBERICHT"), /* @__PURE__ */ React.createElement("div", { style: s.grid }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Datum Abholung"), /* @__PURE__ */ React.createElement("div", { style: s.val }, ei.abholDatum || "\u2014")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Uhrzeit"), /* @__PURE__ */ React.createElement("div", { style: s.val }, ei.abholZeit || "\u2014")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Ort der Abholung"), /* @__PURE__ */ React.createElement("div", { style: s.val }, ei.abholOrt || "\u2014")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Zielort"), /* @__PURE__ */ React.createElement("div", { style: s.val }, ei.zielOrt || "\u2014")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Friedhof"), /* @__PURE__ */ React.createElement("div", { style: s.val }, ei.friedhof || "\u2014")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Abholung mit Trage"), /* @__PURE__ */ React.createElement("div", { style: s.val }, ei.mitTrage === true ? "Ja" : ei.mitTrage === false ? "Nein" : "\u2014")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Fahrer"), /* @__PURE__ */ React.createElement("div", { style: s.val }, ei.fahrer || "\u2014")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Beifahrer"), /* @__PURE__ */ React.createElement("div", { style: s.val }, ei.beifahrer || "\u2014"))), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 6 } }, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Art des Todes"), /* @__PURE__ */ React.createElement("div", { style: s.val }, ei.artDesTodes === "natuerlich" ? "Nat\xFCrlicher Tod" : ei.artDesTodes === "kripofall" ? "Kripofall" : `Sonstiges: ${ei.artDesTodesSonstiges || ""}`)), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 6 } }, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Zustand des Verstorbenen"), /* @__PURE__ */ React.createElement("div", { style: s.val }, ei.zustandVerst || "\u2014")), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 6 } }, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Abschiednahme m\xF6glich"), /* @__PURE__ */ React.createElement("div", { style: s.val }, ei.abschiedMoeglich === true ? "Ja" : ei.abschiedMoeglich === false ? "Nein" : "\u2014")), ei.gegenstaendeSchmuck && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 6 } }, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Pers\xF6nliche Gegenst\xE4nde / Schmuck"), /* @__PURE__ */ React.createElement("div", { style: s.val }, ei.gegenstaendeSchmuck)), aktMassnahmen.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 6 } }, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Durchgef\xFChrte Ma\xDFnahmen"), /* @__PURE__ */ React.createElement("div", { style: s.val }, aktMassnahmen.join(", "))), ei.bemerkungen && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 6 } }, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Bemerkungen"), /* @__PURE__ */ React.createElement("div", { style: s.val }, ei.bemerkungen)), /* @__PURE__ */ React.createElement("div", { style: s.grid }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Sargmodell"), /* @__PURE__ */ React.createElement("div", { style: s.val }, ei.sargmodell || "\u2014")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Sargkreuz"), /* @__PURE__ */ React.createElement("div", { style: s.val }, ei.sargkreuz === true ? `Ja (${ei.sargkreuzWelches || ""})` : ei.sargkreuz === false ? "Nein" : "\u2014")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Deckengarnitur"), /* @__PURE__ */ React.createElement("div", { style: s.val }, ei.deckengarnitur === true ? `Ja (${ei.deckengarniturWelche || ""})` : ei.deckengarnitur === false ? "Nein" : "\u2014"))), ei.besondereWuensche && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 6 } }, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Besondere W\xFCnsche / Beigaben"), /* @__PURE__ */ React.createElement("div", { style: s.val }, ei.besondereWuensche)), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, padding: "8px", background: "#f9f3ea", borderRadius: 4, fontSize: 10, color: "#444", fontStyle: "italic" } }, "Die Einsargung wurde ordnungsgem\xE4\xDF und w\xFCrdevoll durchgef\xFChrt. Die verstorbene Person wurde entsprechend den gesetzlichen Vorschriften sowie den W\xFCnschen der Angeh\xF6rigen eingesargt."), ei.sargVerschlossen && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 6, fontSize: 10, color: "#2a7a3a", fontWeight: 700 } }, "\u2611 Sarg verschlossen und zur weiteren \xDCberf\xFChrung / Aufbahrung vorbereitet."), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Ort"), /* @__PURE__ */ React.createElement("div", { style: s.val }, ei.abschlussOrt || "\u2014")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Datum"), /* @__PURE__ */ React.createElement("div", { style: s.val }, ei.abschlussDatum || "\u2014")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: s.lbl }, "Unterschrift"), /* @__PURE__ */ React.createElement("div", { style: { ...s.val, borderBottom: "1px solid #aaa", paddingBottom: 12 } }, ei.abschlussUnterschrift || ""))));
  })(), fall.notizen?.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { ...s.sec, border: "none" } }, /* @__PURE__ */ React.createElement("div", { style: s.h }, "\u{1F4AC} Notizen"), fall.notizen.map((n, i) => {
    const v = mitarbeiter.find((m) => m.id === n.vonId);
    return /* @__PURE__ */ React.createElement("div", { key: i, style: { marginBottom: 6, padding: "6px 8px", background: "#fafafa", borderLeft: "3px solid #C5A55A" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9, color: "#888", marginBottom: 2 } }, v?.name || "?", " \xB7 ", n.zeit), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, lineHeight: 1.5 } }, n.text));
  })), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 20, paddingTop: 14, borderTop: "1px solid #ccc", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { borderBottom: "1px solid #aaa", paddingBottom: 24, marginBottom: 4 } }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9, color: "#888" } }, "Unterschrift Verantwortliche/r")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { borderBottom: "1px solid #aaa", paddingBottom: 24, marginBottom: 4 } }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9, color: "#888" } }, "Datum & Stempel"))))));
}
function JaNein({ value, onChange, label }) {
  return /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 14 } }, label && /* @__PURE__ */ React.createElement("div", { style: { color: "#AAA", fontSize: 12, marginBottom: 8 } }, label), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, [{ v: true, l: "Ja" }, { v: false, l: "Nein" }].map((opt) => /* @__PURE__ */ React.createElement("div", { key: String(opt.v), onClick: () => onChange(opt.v), style: { flex: 1, textAlign: "center", padding: "11px", borderRadius: 10, border: `2px solid ${value === opt.v ? "#C5A55A" : "rgba(255,255,255,.15)"}`, background: value === opt.v ? "rgba(197,165,90,.15)" : "transparent", cursor: "pointer", color: value === opt.v ? "#C5A55A" : "#888", fontWeight: 700, fontSize: 15 } }, opt.l))));
}
function ChkBox({ label, checked, onChange }) {
  return /* @__PURE__ */ React.createElement("div", { onClick: () => onChange(!checked), style: { display: "flex", alignItems: "center", gap: 12, padding: "12px 0", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,.06)" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 26, height: 26, borderRadius: 7, border: `2px solid ${checked ? "#4FA87A" : "rgba(255,255,255,.25)"}`, background: checked ? "#4FA87A" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s" } }, checked && /* @__PURE__ */ React.createElement("span", { style: { color: "#fff", fontSize: 15, lineHeight: 1 } }, "\u2713")), /* @__PURE__ */ React.createElement("span", { style: { color: "#E8E0D0", fontSize: 15 } }, label));
}
function DokuFormular({ fall, d, mitarbeiter, updateDoku }) {
  const ei = d.eins || {};
  const setEi = (upd) => updateDoku(fall.id, { eins: { ...d.eins || {}, ...upd } });
  const setMa = (upd) => setEi({ massnahmen: { ...ei.massnahmen || {}, ...upd } });
  const ids = Array.isArray(d.uDurch) ? d.uDurch : d.uDurch ? [d.uDurch] : [];
  const sync = (neueIds, neuFahrer, neuBeifahrer) => {
    updateDoku(fall.id, { uDurch: neueIds, eins: { ...d.eins || {}, fahrer: neuFahrer, beifahrer: neuBeifahrer } });
  };
  const toggle = (id) => {
    const neu = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
    const namen = neu.map((i) => mitarbeiter.find((m) => m.id === i)?.name || "").filter(Boolean);
    sync(neu, namen[0] || "", namen[1] || "");
  };
  const loeschFahrer = () => {
    const neu = ids.slice(1);
    const namen = neu.map((i) => mitarbeiter.find((m) => m.id === i)?.name || "").filter(Boolean);
    sync(neu, namen[0] || "", namen[1] || "");
  };
  const loeschBeifahrer = () => {
    const neu = ids.length > 1 ? [ids[0]] : ids;
    const namen = neu.map((i) => mitarbeiter.find((m) => m.id === i)?.name || "").filter(Boolean);
    sync(neu, namen[0] || "", "");
  };
  const allesLoeschen = () => sync([], "", "");
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { background: "#2A2825", borderRadius: 16, padding: "16px", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { color: "#C5A55A", fontWeight: 700, fontSize: 16, marginBottom: 14 } }, "\u{1F690} Abholung & \xDCberf\xFChrung"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } }, /* @__PURE__ */ React.createElement(Feld, { label: "Datum", value: ei.abholDatum || d.uDatum || "", onChange: (v) => updateDoku(fall.id, { uDatum: v, eins: { ...d.eins || {}, abholDatum: v } }), placeholder: "TT.MM.JJJJ", warn: true }), /* @__PURE__ */ React.createElement(Feld, { label: "Uhrzeit", value: ei.abholZeit || d.uZeit || "", onChange: (v) => updateDoku(fall.id, { uZeit: v, eins: { ...d.eins || {}, abholZeit: v } }), placeholder: "HH:MM", warn: true })), /* @__PURE__ */ React.createElement(Feld, { label: "Ort der Abholung", value: ei.abholOrt || d.uVon || "", onChange: (v) => updateDoku(fall.id, { uVon: v, eins: { ...d.eins || {}, abholOrt: v } }), placeholder: "z. B. Klinik, Wohnung \u2026", warn: true }), /* @__PURE__ */ React.createElement(Feld, { label: "Zielort", value: ei.zielOrt || "", onChange: (v) => setEi({ zielOrt: v }), placeholder: "z. B. Aufbahrungsraum" }), /* @__PURE__ */ React.createElement(Feld, { label: "Friedhof", value: ei.friedhof || "", onChange: (v) => setEi({ friedhof: v }), placeholder: "Friedhof" }), /* @__PURE__ */ React.createElement(Auswahl, { label: "Art der \xDCberf\xFChrung", value: d.uArt, onChange: (v) => updateDoku(fall.id, { uArt: v }), optionen: UEBERFUEHRT }), /* @__PURE__ */ React.createElement(JaNein, { label: "Abholung mit Trage", value: ei.mitTrage, onChange: (v) => setEi({ mitTrage: v }) }), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { color: "#AAA", fontSize: 12 } }, "Team \u2014 1. Klick = Fahrer \xB7 2. Klick = Beifahrer"), ids.length > 0 && /* @__PURE__ */ React.createElement("button", { onClick: allesLoeschen, style: { background: "rgba(255,80,80,.15)", border: "1px solid rgba(255,80,80,.3)", borderRadius: 8, padding: "5px 12px", color: "#ff6b6b", cursor: "pointer", fontSize: 12, fontFamily: "Georgia,serif" } }, "\u2715 Alle l\xF6schen")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 } }, mitarbeiter.map((m) => {
    const pos = ids.indexOf(m.id);
    const aktiv = pos >= 0;
    const posLabel = pos === 0 ? "\u{1F697} Fahrer" : pos === 1 ? "\u{1F464} Beifahrer" : `#${pos + 1}`;
    return /* @__PURE__ */ React.createElement("div", { key: m.id, onClick: () => toggle(m.id), style: { display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 12, border: `2px solid ${aktiv ? m.farbe : "rgba(255,255,255,.15)"}`, background: aktiv ? `${m.farbe}22` : "#1E1C19", cursor: "pointer", transition: "all .15s", position: "relative" } }, /* @__PURE__ */ React.createElement(Avatar, { k: m.kuerzel, farbe: m.farbe, size: 28 }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { color: aktiv ? "#F0EAE0" : "#888", fontSize: 14, fontWeight: 700, lineHeight: 1.2 } }, m.name.split(" ")[0]), /* @__PURE__ */ React.createElement("div", { style: { color: aktiv ? m.farbe : "#555", fontSize: 11, fontWeight: 700, marginTop: 2 } }, aktiv ? posLabel : m.rolle)), aktiv && /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: -6, right: -6, background: m.farbe, color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 } }, pos + 1));
  })), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { color: "#AAA", fontSize: 12, marginBottom: 6 } }, "\u{1F697} Fahrer"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, alignItems: "center" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      value: ei.fahrer || "",
      onChange: (e) => updateDoku(fall.id, { eins: { ...d.eins || {}, fahrer: e.target.value } }),
      placeholder: "Name \u2026",
      style: { flex: 1, background: "#2A2825", border: `1px solid ${ei.fahrer ? "rgba(197,165,90,.4)" : "rgba(255,255,255,.15)"}`, borderRadius: 10, padding: "12px", color: "#F0EAE0", fontSize: 15, outline: "none", fontFamily: "Georgia,serif" }
    }
  ), ei.fahrer && /* @__PURE__ */ React.createElement("button", { onClick: loeschFahrer, style: { background: "rgba(255,80,80,.15)", border: "1px solid rgba(255,80,80,.3)", borderRadius: 10, width: 38, height: 42, color: "#ff6b6b", cursor: "pointer", fontSize: 18, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" } }, "\u2715"))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { color: "#AAA", fontSize: 12, marginBottom: 6 } }, "\u{1F464} Beifahrer"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, alignItems: "center" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      value: ei.beifahrer || "",
      onChange: (e) => updateDoku(fall.id, { eins: { ...d.eins || {}, beifahrer: e.target.value } }),
      placeholder: "Name \u2026",
      style: { flex: 1, background: "#2A2825", border: `1px solid ${ei.beifahrer ? "rgba(197,165,90,.4)" : "rgba(255,255,255,.15)"}`, borderRadius: 10, padding: "12px", color: "#F0EAE0", fontSize: 15, outline: "none", fontFamily: "Georgia,serif" }
    }
  ), ei.beifahrer && /* @__PURE__ */ React.createElement("button", { onClick: loeschBeifahrer, style: { background: "rgba(255,80,80,.15)", border: "1px solid rgba(255,80,80,.3)", borderRadius: 10, width: 38, height: 42, color: "#ff6b6b", cursor: "pointer", fontSize: 18, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" } }, "\u2715")))))), /* @__PURE__ */ React.createElement("div", { style: { background: "#2A2825", borderRadius: 16, padding: "16px", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { color: "#C5A55A", fontWeight: 700, fontSize: 16, marginBottom: 14 } }, "\u{1F464} Verstorbene Person"), /* @__PURE__ */ React.createElement("div", { style: { color: "#AAA", fontSize: 12, marginBottom: 8 } }, "Art des Todes"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 } }, [{ v: "natuerlich", l: "Nat\xFCrlicher Tod" }, { v: "kripofall", l: "Kripofall" }, { v: "sonstiges", l: "Sonstiges" }].map((opt) => /* @__PURE__ */ React.createElement("div", { key: opt.v, onClick: () => setEi({ artDesTodes: opt.v }), style: { padding: "9px 16px", borderRadius: 10, border: `2px solid ${(ei.artDesTodes || "natuerlich") === opt.v ? "#C5A55A" : "rgba(255,255,255,.15)"}`, background: (ei.artDesTodes || "natuerlich") === opt.v ? "rgba(197,165,90,.15)" : "transparent", cursor: "pointer", color: (ei.artDesTodes || "natuerlich") === opt.v ? "#C5A55A" : "#888", fontWeight: 600, fontSize: 14 } }, opt.l))), (ei.artDesTodes || "natuerlich") === "sonstiges" && /* @__PURE__ */ React.createElement(Feld, { label: "Details", value: ei.artDesTodesSonstiges || "", onChange: (v) => setEi({ artDesTodesSonstiges: v }), placeholder: "Details \u2026" })), /* @__PURE__ */ React.createElement("div", { style: { background: "#2A2825", borderRadius: 16, padding: "16px", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { color: "#C5A55A", fontWeight: 700, fontSize: 16, marginBottom: 14 } }, "\u{1F4CB} Zustand bei \xDCbernahme"), /* @__PURE__ */ React.createElement(Auswahl, { label: "Allgemeiner Zustand", value: d.zustand, onChange: (v) => updateDoku(fall.id, { zustand: v }), optionen: ZUSTAND_OPT }), /* @__PURE__ */ React.createElement(Feld, { label: "Zustand (Beschreibung)", value: ei.zustandVerst || d.besonderheiten || "", onChange: (v) => updateDoku(fall.id, { besonderheiten: v, eins: { ...d.eins || {}, zustandVerst: v } }), placeholder: "z. B. gut erhalten, Verletzungen \u2026", warn: true }), /* @__PURE__ */ React.createElement(JaNein, { label: "Abschiednahme m\xF6glich", value: ei.abschiedMoeglich, onChange: (v) => setEi({ abschiedMoeglich: v }) }), /* @__PURE__ */ React.createElement(ZustandsFoto, { foto: d.zustandsFoto, onChange: (v) => updateDoku(fall.id, { zustandsFoto: v }) })), /* @__PURE__ */ React.createElement("div", { style: { background: "#2A2825", borderRadius: 16, padding: "16px", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { color: "#C5A55A", fontWeight: 700, fontSize: 16, marginBottom: 14 } }, "\u{1F48D} Schmuck & Pers\xF6nliche Gegenst\xE4nde"), d.schmuck.map((sc, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { background: "#1E1C19", borderRadius: 12, padding: "12px", marginBottom: 10, position: "relative" } }, /* @__PURE__ */ React.createElement("button", { onClick: () => updateDoku(fall.id, { schmuck: d.schmuck.filter((_, j) => j !== i) }), style: { position: "absolute", top: 8, right: 8, background: "rgba(200,0,0,.7)", border: "none", borderRadius: 6, width: 28, height: 28, color: "#fff", cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" } }, "\xD7"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 } }, /* @__PURE__ */ React.createElement(Feld, { label: "Bezeichnung", value: sc.bezeichnung, onChange: (v) => {
    const a = [...d.schmuck];
    a[i] = { ...a[i], bezeichnung: v };
    updateDoku(fall.id, { schmuck: a });
  }, placeholder: "z. B. Ehering" }), /* @__PURE__ */ React.createElement(Feld, { label: "Material", value: sc.material, onChange: (v) => {
    const a = [...d.schmuck];
    a[i] = { ...a[i], material: v };
    updateDoku(fall.id, { schmuck: a });
  }, placeholder: "z. B. Gold 585" })), /* @__PURE__ */ React.createElement(Auswahl, { label: "Verbleib", value: sc.verbleib || VERBLEIB_SCH[0], onChange: (v) => {
    const a = [...d.schmuck];
    a[i] = { ...a[i], verbleib: v };
    updateDoku(fall.id, { schmuck: a });
  }, optionen: VERBLEIB_SCH }))), /* @__PURE__ */ React.createElement(Btn, { label: "Schmuckst\xFCck hinzuf\xFCgen", icon: "\uFF0B", onClick: () => updateDoku(fall.id, { schmuck: [...d.schmuck, { bezeichnung: "", material: "", verbleib: VERBLEIB_SCH[0] }] }), full: true, outline: true, color: "#C5A55A" }), /* @__PURE__ */ React.createElement("div", { style: { height: 14 } }), /* @__PURE__ */ React.createElement(Textarea, { label: "Weitere Gegenst\xE4nde (Freitext)", value: ei.gegenstaendeSchmuck || "", onChange: (v) => setEi({ gegenstaendeSchmuck: v }), placeholder: "z. B. Schl\xFCssel, Brille, Geldb\xF6rse \u2026", rows: 2 })), /* @__PURE__ */ React.createElement("div", { style: { background: "#2A2825", borderRadius: 16, padding: "16px", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { color: "#C5A55A", fontWeight: 700, fontSize: 16, marginBottom: 14 } }, "\u{1F454} Kleidung"), /* @__PURE__ */ React.createElement(Toggle, { label: "Kleidung vorhanden", checked: d.kleidungDa, onChange: (v) => updateDoku(fall.id, { kleidungDa: v }) }), d.kleidungDa && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { height: 12 } }), /* @__PURE__ */ React.createElement(Textarea, { label: "Beschreibung", value: d.kleidungText, onChange: (v) => updateDoku(fall.id, { kleidungText: v }), placeholder: "z. B. Dunkelblauer Anzug, wei\xDFes Hemd \u2026", warn: true }), /* @__PURE__ */ React.createElement(Toggle, { label: "Von Familie mitgebracht", checked: d.kleidungFamilie, onChange: (v) => updateDoku(fall.id, { kleidungFamilie: v }) }))), /* @__PURE__ */ React.createElement("div", { style: { background: "#2A2825", borderRadius: 16, padding: "16px", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { color: "#C5A55A", fontWeight: 700, fontSize: 16, marginBottom: 14 } }, "\u{1F5DD} Wertgegenst\xE4nde"), d.wertgegenstaende.map((w, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { background: "#1E1C19", borderRadius: 12, padding: "12px", marginBottom: 10, position: "relative" } }, /* @__PURE__ */ React.createElement("button", { onClick: () => updateDoku(fall.id, { wertgegenstaende: d.wertgegenstaende.filter((_, j) => j !== i) }), style: { position: "absolute", top: 8, right: 8, background: "rgba(200,0,0,.7)", border: "none", borderRadius: 6, width: 28, height: 28, color: "#fff", cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" } }, "\xD7"), /* @__PURE__ */ React.createElement(Feld, { label: "Bezeichnung", value: w.bezeichnung, onChange: (v) => {
    const a = [...d.wertgegenstaende];
    a[i] = { ...a[i], bezeichnung: v };
    updateDoku(fall.id, { wertgegenstaende: a });
  }, placeholder: "z. B. Geldb\xF6rse, Schl\xFCssel" }), /* @__PURE__ */ React.createElement(Auswahl, { label: "Verbleib", value: w.verbleib || VERBLEIB_WERT[0], onChange: (v) => {
    const a = [...d.wertgegenstaende];
    a[i] = { ...a[i], verbleib: v };
    updateDoku(fall.id, { wertgegenstaende: a });
  }, optionen: VERBLEIB_WERT }))), /* @__PURE__ */ React.createElement(Btn, { label: "Gegenstand hinzuf\xFCgen", icon: "\uFF0B", onClick: () => updateDoku(fall.id, { wertgegenstaende: [...d.wertgegenstaende, { bezeichnung: "", verbleib: VERBLEIB_WERT[0] }] }), full: true, outline: true, color: "#C5A55A" })), /* @__PURE__ */ React.createElement("div", { style: { background: "#2A2825", borderRadius: 16, padding: "16px", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { color: "#C5A55A", fontWeight: 700, fontSize: 16, marginBottom: 4 } }, "\u{1F9E4} Hygienische Ma\xDFnahmen"), /* @__PURE__ */ React.createElement(ChkBox, { label: "Grundversorgung durchgef\xFChrt", checked: !!ei.massnahmen?.grundversorgung, onChange: (v) => setMa({ grundversorgung: v }) }), /* @__PURE__ */ React.createElement(ChkBox, { label: "Hygienische Versorgung durchgef\xFChrt", checked: !!ei.massnahmen?.hygienisch, onChange: (v) => setMa({ hygienisch: v }) }), /* @__PURE__ */ React.createElement(ChkBox, { label: "Thanatopraktische Ma\xDFnahmen durchgef\xFChrt", checked: !!ei.massnahmen?.thanatopraktisch, onChange: (v) => setMa({ thanatopraktisch: v }) }), /* @__PURE__ */ React.createElement(ChkBox, { label: "Ankleidung mit pers\xF6nlicher Kleidung", checked: !!ei.massnahmen?.ankleidungPersoenlich, onChange: (v) => setMa({ ankleidungPersoenlich: v }) }), /* @__PURE__ */ React.createElement(ChkBox, { label: "Ankleidung mit Sterbegewand", checked: !!ei.massnahmen?.ankleidungSterbegewand, onChange: (v) => setMa({ ankleidungSterbegewand: v }) }), /* @__PURE__ */ React.createElement(ChkBox, { label: "Kosmetische Versorgung erfolgt", checked: !!ei.massnahmen?.kosmetisch, onChange: (v) => setMa({ kosmetisch: v }) }), /* @__PURE__ */ React.createElement("div", { style: { height: 10 } }), /* @__PURE__ */ React.createElement(Feld, { label: "Bemerkungen zu Ma\xDFnahmen", value: ei.bemerkungen || "", onChange: (v) => setEi({ bemerkungen: v }), placeholder: "Weitere Anmerkungen \u2026" })), /* @__PURE__ */ React.createElement("div", { style: { background: "#2A2825", borderRadius: 16, padding: "16px", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { color: "#C5A55A", fontWeight: 700, fontSize: 16, marginBottom: 14 } }, "\u26B0 Angaben zum Sarg"), /* @__PURE__ */ React.createElement(Feld, { label: "Sargmodell", value: ei.sargmodell || "", onChange: (v) => setEi({ sargmodell: v }), placeholder: "Modellbezeichnung" }), /* @__PURE__ */ React.createElement(JaNein, { label: "Sargkreuz", value: ei.sargkreuz, onChange: (v) => setEi({ sargkreuz: v }) }), ei.sargkreuz && /* @__PURE__ */ React.createElement(Feld, { label: "Sargkreuz \u2014 welches", value: ei.sargkreuzWelches || "", onChange: (v) => setEi({ sargkreuzWelches: v }), placeholder: "Bezeichnung" }), /* @__PURE__ */ React.createElement(JaNein, { label: "Deckengarnitur", value: ei.deckengarnitur, onChange: (v) => setEi({ deckengarnitur: v }) }), ei.deckengarnitur && /* @__PURE__ */ React.createElement(Feld, { label: "Deckengarnitur \u2014 welche", value: ei.deckengarniturWelche || "", onChange: (v) => setEi({ deckengarniturWelche: v }), placeholder: "Bezeichnung" })), /* @__PURE__ */ React.createElement("div", { style: { background: "#2A2825", borderRadius: 16, padding: "16px", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { color: "#C5A55A", fontWeight: 700, fontSize: 16, marginBottom: 14 } }, "\u{1F4DD} Durchf\xFChrung & Abschluss"), /* @__PURE__ */ React.createElement(Textarea, { label: "Besondere W\xFCnsche / Beigaben", value: ei.besondereWuensche || "", onChange: (v) => setEi({ besondereWuensche: v }), placeholder: "z. B. Blumen, Fotos \u2026", rows: 2 }), /* @__PURE__ */ React.createElement(Textarea, { label: "Allgemeine Hinweise f\xFCr das Team", value: d.hinweise, onChange: (v) => updateDoku(fall.id, { hinweise: v }), placeholder: "Wichtige Hinweise \u2026", warn: true }), /* @__PURE__ */ React.createElement("div", { style: { background: "rgba(197,165,90,.07)", border: "1px solid rgba(197,165,90,.2)", borderRadius: 10, padding: "12px", marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { color: "#C8C0A0", fontSize: 13, lineHeight: 1.6, fontStyle: "italic" } }, "Die Einsargung wurde ordnungsgem\xE4\xDF und w\xFCrdevoll durchgef\xFChrt. Die verstorbene Person wurde entsprechend den gesetzlichen Vorschriften sowie den W\xFCnschen der Angeh\xF6rigen eingesargt.")), /* @__PURE__ */ React.createElement("div", { onClick: () => setEi({ sargVerschlossen: !ei.sargVerschlossen }), style: { display: "flex", alignItems: "center", gap: 12, padding: "14px", background: ei.sargVerschlossen ? "rgba(79,168,122,.1)" : "rgba(255,255,255,.04)", border: `2px solid ${ei.sargVerschlossen ? "#4FA87A" : "rgba(255,255,255,.15)"}`, borderRadius: 12, cursor: "pointer", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 26, height: 26, borderRadius: 7, border: `2px solid ${ei.sargVerschlossen ? "#4FA87A" : "rgba(255,255,255,.3)"}`, background: ei.sargVerschlossen ? "#4FA87A" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, ei.sargVerschlossen && /* @__PURE__ */ React.createElement("span", { style: { color: "#fff", fontSize: 15 } }, "\u2713")), /* @__PURE__ */ React.createElement("span", { style: { color: "#E8E0D0", fontSize: 14, fontWeight: 600, lineHeight: 1.4 } }, "Sarg verschlossen und zur weiteren \xDCberf\xFChrung / Aufbahrung vorbereitet")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } }, /* @__PURE__ */ React.createElement(Feld, { label: "Ort", value: ei.abschlussOrt || "", onChange: (v) => setEi({ abschlussOrt: v }), placeholder: "Ort" }), /* @__PURE__ */ React.createElement(Feld, { label: "Datum", value: ei.abschlussDatum || "", onChange: (v) => setEi({ abschlussDatum: v }), placeholder: "TT.MM.JJJJ" })), /* @__PURE__ */ React.createElement(Feld, { label: "Unterschrift Mitarbeiter", value: ei.abschlussUnterschrift || "", onChange: (v) => setEi({ abschlussUnterschrift: v }), placeholder: "Name des Mitarbeiters" })));
}
function StatusChip({ status }) {
  const cfg = { offen: { bg: "rgba(160,128,80,.2)", c: "#C5A55A", l: "Offen" }, in_bearbeitung: { bg: "rgba(91,158,201,.2)", c: "#5B9EC9", l: "In Bearbeitung" }, abgeschlossen: { bg: "rgba(79,168,122,.2)", c: "#4FA87A", l: "Erledigt" } };
  const x = cfg[status] || cfg.offen;
  return /* @__PURE__ */ React.createElement("span", { style: { background: x.bg, color: x.c, borderRadius: 12, padding: "4px 12px", fontSize: 12, fontWeight: 700 } }, x.l);
}
function Dashboard({ faelle, mitarbeiter, ich, meineOffenen, setAktivId, setFallTab, setSeite, setNeuFallSheet }) {
  const CARD = { background: "#1E1C19", borderRadius: 16, padding: "16px" };
  return /* @__PURE__ */ React.createElement("div", { style: { padding: "16px 16px 100px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 24, padding: "14px 16px", background: "#1E1C19", borderRadius: 16 } }, ich && /* @__PURE__ */ React.createElement(Avatar, { k: ich.kuerzel, farbe: ich.farbe, size: 48 }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { color: "#F0EAE0", fontWeight: 700, fontSize: 17 } }, "Hallo, ", ich?.name.split(" ")[0]), /* @__PURE__ */ React.createElement("div", { style: { color: "#666", fontSize: 13 } }, ich?.rolle, " \xB7 ", TEAMS.find((t) => t.id === ich?.team)?.label)), meineOffenen.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginLeft: "auto", background: "#FF9500", color: "#fff", borderRadius: 12, padding: "4px 10px", fontSize: 13, fontWeight: 700 } }, meineOffenen.length, " offen")), meineOffenen.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 24 } }, /* @__PURE__ */ React.createElement("div", { style: { color: "#888", fontSize: 12, letterSpacing: 1, marginBottom: 10 } }, "MEINE OFFENEN AUFGABEN"), meineOffenen.map((s, i) => /* @__PURE__ */ React.createElement("div", { key: i, onClick: () => {
    setAktivId(s.fallId);
    setFallTab("schritte");
    setSeite("fall");
  }, style: { ...CARD, marginBottom: 8, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", border: "1px solid rgba(255,165,0,.25)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22 } }, "\u26A0\uFE0F"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { color: "#F0EAE0", fontWeight: 700, fontSize: 15 } }, s.titel), /* @__PURE__ */ React.createElement("div", { style: { color: "#888", fontSize: 13, marginTop: 2 } }, "Fall: ", s.fallName)), /* @__PURE__ */ React.createElement("div", { style: { color: "#555", fontSize: 18 } }, "\u203A")))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { color: "#888", fontSize: 12, letterSpacing: 1 } }, "ALLE F\xC4LLE (", faelle.length, ")"), /* @__PURE__ */ React.createElement("button", { onClick: () => setNeuFallSheet(true), style: { background: "#C5A55A", color: "#1C1A17", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "Georgia,serif" } }, "\uFF0B Neuer Fall")), faelle.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { ...CARD, textAlign: "center", padding: "40px 20px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 40, marginBottom: 10 } }, "\u{1F4CB}"), /* @__PURE__ */ React.createElement("div", { style: { color: "#666", fontSize: 15, marginBottom: 16 } }, "Noch keine F\xE4lle angelegt"), /* @__PURE__ */ React.createElement(Btn, { label: "Ersten Fall anlegen", icon: "\uFF0B", onClick: () => setNeuFallSheet(true), full: true })), faelle.map((f) => {
    const abg = f.schritte.filter((s) => s.status === "abgeschlossen").length;
    const proz = Math.round(abg / f.schritte.length * 100);
    const vw = mitarbeiter.find((m) => m.id === f.verantw);
    const warn = offenePunkte(f);
    return /* @__PURE__ */ React.createElement("div", { key: f.id, onClick: () => {
      setAktivId(f.id);
      setFallTab("schritte");
      setSeite("fall");
    }, style: { ...CARD, marginBottom: 12, cursor: "pointer", border: `1px solid ${warn > 0 ? "rgba(255,149,0,.3)" : "rgba(255,255,255,.08)"}` } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, marginRight: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#F0EAE0", fontWeight: 700, fontSize: 16 } }, f.name), warn > 0 && /* @__PURE__ */ React.createElement(WarnChip, { n: warn })), /* @__PURE__ */ React.createElement("div", { style: { color: "#666", fontSize: 13 } }, "\u2020 ", f.tod, f.ort && ` \xB7 ${f.ort}`)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 } }, /* @__PURE__ */ React.createElement(StatusChip, { status: f.status }), vw && /* @__PURE__ */ React.createElement(Avatar, { k: vw.kuerzel, farbe: vw.farbe, size: 28 }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, height: 8, background: "rgba(255,255,255,.1)", borderRadius: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { width: `${proz}%`, height: "100%", background: proz === 100 ? "#4FA87A" : "#C5A55A", borderRadius: 4, transition: "width .4s" } })), /* @__PURE__ */ React.createElement("span", { style: { color: "#888", fontSize: 13, minWidth: 36 } }, abg, "/", f.schritte.length)));
  }));
}
function NotizListe({ notizen, mitarbeiter, ichId, fallId, updateFall, CARD }) {
  const [loeschIdx, setLoeschIdx] = useState(null);
  if (!notizen || notizen.length === 0) return null;
  return notizen.map((n, i) => {
    const v = mitarbeiter.find((m) => m.id === n.vonId);
    const kannLoeschen = n.vonId === ichId;
    return /* @__PURE__ */ React.createElement("div", { key: i, style: { ...CARD, marginBottom: 10, border: `1px solid ${loeschIdx === i ? "rgba(255,80,80,.4)" : "rgba(255,255,255,.08)"}` } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 } }, v && /* @__PURE__ */ React.createElement(Avatar, { k: v.kuerzel, farbe: v.farbe, size: 32 }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { color: "#F0EAE0", fontWeight: 700, fontSize: 14 } }, v?.name || "?"), /* @__PURE__ */ React.createElement("div", { style: { color: "#555", fontSize: 12 } }, n.zeit)), kannLoeschen && (loeschIdx === i ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexShrink: 0 } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          updateFall(fallId, { notizen: notizen.filter((_, j) => j !== i) });
          setLoeschIdx(null);
        },
        style: { background: "rgba(200,0,0,.85)", border: "none", borderRadius: 8, padding: "8px 14px", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700 }
      },
      "L\xF6schen"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setLoeschIdx(null),
        style: { background: "rgba(255,255,255,.1)", border: "none", borderRadius: 8, padding: "8px 12px", color: "#888", cursor: "pointer", fontSize: 14 }
      },
      "\u2715"
    )) : /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setLoeschIdx(i),
        style: { background: "rgba(255,80,80,.12)", border: "1px solid rgba(255,80,80,.25)", borderRadius: 8, padding: "8px 12px", color: "#ff6b6b", cursor: "pointer", fontSize: 16, flexShrink: 0 }
      },
      "\u{1F5D1}"
    ))), /* @__PURE__ */ React.createElement("div", { style: { color: "#C8C0B0", fontSize: 15, lineHeight: 1.5 } }, n.text));
  });
}
function FallDetail({ fall, faelle, mitarbeiter, ichId, fallTab, setFallTab, notizText, setNotizText, updateFall, updateDoku, toggleSchritt, setDruckAnsicht, setLoeschFallId, addAktivitaet }) {
  const CARD = { background: "#1E1C19", borderRadius: 16, padding: "16px" };
  if (!fall) return /* @__PURE__ */ React.createElement("div", { style: { padding: 20, color: "#666", textAlign: "center" } }, "Kein Fall ausgew\xE4hlt");
  const d = fall.doku || leerDoku();
  const warn = offenePunkte(fall);
  const vw = mitarbeiter.find((m) => m.id === fall.verantw);
  return /* @__PURE__ */ React.createElement("div", { style: { paddingBottom: 100 } }, /* @__PURE__ */ React.createElement("div", { style: { ...CARD, margin: "16px 16px 0", border: `1px solid ${warn > 0 ? "rgba(255,149,0,.3)" : "rgba(255,255,255,.08)"}` } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { color: "#F0EAE0", fontWeight: 700, fontSize: 20, marginBottom: 4 } }, fall.name), /* @__PURE__ */ React.createElement("div", { style: { color: "#777", fontSize: 13 } }, "* ", fall.geb || "\u2014", " \xB7 \u2020 ", fall.tod, fall.ort && ` \xB7 ${fall.ort}`), vw && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginTop: 8 } }, /* @__PURE__ */ React.createElement(Avatar, { k: vw.kuerzel, farbe: vw.farbe, size: 24 }), /* @__PURE__ */ React.createElement("span", { style: { color: "#888", fontSize: 13 } }, vw.name))), /* @__PURE__ */ React.createElement(StatusChip, { status: fall.status })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: warn > 0 ? 10 : 0 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, height: 10, background: "rgba(255,255,255,.1)", borderRadius: 5 } }, /* @__PURE__ */ React.createElement("div", { style: { width: `${Math.round(fall.schritte.filter((s) => s.status === "abgeschlossen").length / fall.schritte.length * 100)}%`, height: "100%", background: "#4FA87A", borderRadius: 5, transition: "width .4s" } })), /* @__PURE__ */ React.createElement("span", { style: { color: "#888", fontSize: 14, minWidth: 50 } }, fall.schritte.filter((s) => s.status === "abgeschlossen").length, "/", fall.schritte.length)), warn > 0 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, background: "rgba(255,149,0,.1)", border: "1px solid rgba(255,149,0,.3)", borderRadius: 10, padding: "10px 12px" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18 } }, "\u26A0\uFE0F"), /* @__PURE__ */ React.createElement("span", { style: { color: "#FF9500", fontWeight: 700, fontSize: 14 } }, warn, " offene Punkte"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", overflowX: "auto", padding: "12px 16px 0", gap: 8, WebkitOverflowScrolling: "touch" } }, [
    { key: "schritte", label: "\u2713 Schritte", warn: fall.schritte.filter((s) => s.status !== "abgeschlossen").length },
    { key: "doku", label: "\u{1F4CB} Dokumentation", warn: offenePunkte(fall) - fall.schritte.filter((s) => s.status !== "abgeschlossen").length },
    { key: "dokumente", label: "\u{1F4C2} Dokumente", warn: 0 },
    { key: "notizen", label: "\u{1F4AC} Notizen", warn: 0 }
  ].map((t) => /* @__PURE__ */ React.createElement("button", { key: t.key, onClick: () => setFallTab(t.key), style: { background: fallTab === t.key ? "#C5A55A" : "#2A2825", color: fallTab === t.key ? "#1C1A17" : "#888", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6, flexShrink: 0, fontFamily: "Georgia,serif" } }, t.label, t.warn > 0 && /* @__PURE__ */ React.createElement("span", { style: { background: fallTab === t.key ? "rgba(0,0,0,.2)" : "#FF9500", color: "#fff", borderRadius: 8, padding: "1px 6px", fontSize: 11, fontWeight: 700 } }, t.warn)))), /* @__PURE__ */ React.createElement("div", { style: { padding: "14px 16px" } }, fallTab === "schritte" && fall.schritte.map((s) => /* @__PURE__ */ React.createElement(
    SchrittKarte,
    {
      key: s.id,
      schritt: s,
      mitarbeiter,
      onToggle: () => toggleSchritt(fall.id, s.id),
      onNotiz: (v) => updateFall(fall.id, { schritte: fall.schritte.map((x) => x.id !== s.id ? x : { ...x, notiz: v }) }),
      onVerantw: (v) => updateFall(fall.id, { schritte: fall.schritte.map((x) => x.id !== s.id ? x : { ...x, verantw: v }) })
    }
  )), fallTab === "doku" && /* @__PURE__ */ React.createElement(DokuFormular, { fall, d, mitarbeiter, updateDoku }), fallTab === "dokumente" && /* @__PURE__ */ React.createElement(Dokumente, { liste: fall.dokumente || [], onChange: (dok) => updateFall(fall.id, { dokumente: dok }), aktiverUser: ichId, mitarbeiter, fallName: fall.name }), fallTab === "notizen" && /* @__PURE__ */ React.createElement("div", null, (fall.notizen || []).length === 0 && /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "30px 0", color: "#555", fontSize: 15 } }, "Noch keine Notizen"), /* @__PURE__ */ React.createElement(NotizListe, { notizen: fall.notizen || [], mitarbeiter, ichId, fallId: fall.id, updateFall, CARD }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 12 } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      value: notizText,
      onChange: (e) => setNotizText(e.target.value),
      onKeyDown: (e) => {
        if (e.key === "Enter" && notizText.trim()) {
          updateFall(fall.id, { notizen: [...fall.notizen || [], { text: notizText.trim(), vonId: ichId, zeit: `${tagNr()} ${uhrzeit()}` }] });
          addAktivitaet(`Neue Notiz: "${notizText.trim().slice(0, 40)}"`, fall.name, "\u{1F4AC}");
          setNotizText("");
        }
      },
      placeholder: "Nachricht ans Team \u2026",
      style: { flex: 1, background: "#2A2825", border: "1px solid rgba(255,255,255,.15)", borderRadius: 12, padding: "14px 16px", color: "#F0EAE0", fontSize: 16, outline: "none", fontFamily: "Georgia,serif" }
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        if (notizText.trim()) {
          updateFall(fall.id, { notizen: [...fall.notizen || [], { text: notizText.trim(), vonId: ichId, zeit: `${tagNr()} ${uhrzeit()}` }] });
          addAktivitaet(`Neue Notiz: "${notizText.trim().slice(0, 40)}"`, fall.name, "\u{1F4AC}");
          setNotizText("");
        }
      },
      style: { background: "#C5A55A", border: "none", borderRadius: 12, padding: "14px 20px", color: "#1C1A17", cursor: "pointer", fontWeight: 700, fontSize: 18 }
    },
    "\u2192"
  )))));
}
function TeamSeite({ mitarbeiter, setMA, ichId, setIchId, faelle, setNeuMASheet }) {
  const CARD = { background: "#1E1C19", borderRadius: 16, padding: "16px" };
  return /* @__PURE__ */ React.createElement("div", { style: { padding: "16px 16px 100px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { color: "#888", fontSize: 12, letterSpacing: 1 } }, "MITARBEITER (", mitarbeiter.length, ")"), /* @__PURE__ */ React.createElement(Btn, { label: "\uFF0B Hinzuf\xFCgen", onClick: () => setNeuMASheet(true), small: true })), TEAMS.map((team) => {
    const tm = mitarbeiter.filter((m) => m.team === team.id);
    return /* @__PURE__ */ React.createElement("div", { key: team.id, style: { marginBottom: 24 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10, padding: "8px 0", borderBottom: `2px solid ${team.farbe}40` } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 20 } }, team.icon), /* @__PURE__ */ React.createElement("span", { style: { color: team.farbe, fontWeight: 700, fontSize: 16 } }, team.label), /* @__PURE__ */ React.createElement("span", { style: { color: "#555", fontSize: 13 } }, "(", tm.length, ")")), tm.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { color: "#555", fontSize: 14, textAlign: "center", padding: "16px 0" } }, "Noch niemand"), tm.map((m) => /* @__PURE__ */ React.createElement(TeamMitarbeiterKarte, { key: m.id, m, mitarbeiter, setMA, ichId, setIchId, faelle })));
  }));
}
function TeamMitarbeiterKarte({ m, mitarbeiter, setMA, ichId, setIchId, faelle }) {
  const CARD = { background: "#1E1C19", borderRadius: 16, padding: "16px" };
  const [bestaetige, setBestaetige] = useState(false);
  const [editEmail, setEditEmail] = useState(false);
  const [emailVal, setEmailVal] = useState(m.email || "");
  useEffect(() => setEmailVal(m.email || ""), [m.email]);
  const aufg = faelle.flatMap((f) => f.schritte.filter((s) => s.verantw === m.id && s.status !== "abgeschlossen")).length;
  const faelleAnz = faelle.filter((f) => f.verantw === m.id).length;
  return /* @__PURE__ */ React.createElement("div", { style: { ...CARD, marginBottom: 10, display: "flex", alignItems: "center", gap: 14, border: "1px solid rgba(255,255,255,.08)" } }, /* @__PURE__ */ React.createElement(Avatar, { k: m.kuerzel, farbe: m.farbe, size: 48 }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { color: "#F0EAE0", fontWeight: 700, fontSize: 16 } }, m.name), /* @__PURE__ */ React.createElement("div", { style: { color: "#777", fontSize: 13 } }, m.rolle), m.email ? /* @__PURE__ */ React.createElement("div", { style: { color: "#5B9EC9", fontSize: 12, marginTop: 2 } }, "\u2709 ", m.email) : /* @__PURE__ */ React.createElement("div", { style: { color: "#555", fontSize: 12, marginTop: 2, fontStyle: "italic" } }, "Keine E-Mail hinterlegt"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, marginTop: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#C5A55A", fontSize: 12 } }, faelleAnz, " F\xE4lle"), /* @__PURE__ */ React.createElement("span", { style: { color: "#5B9EC9", fontSize: 12 } }, aufg, " Aufgaben"))), editEmail ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6, minWidth: 160 } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      value: emailVal,
      onChange: (e) => setEmailVal(e.target.value),
      placeholder: "name@firma.de",
      type: "email",
      style: { background: "#1A1816", border: "1px solid rgba(91,158,201,.4)", borderRadius: 8, padding: "8px 10px", color: "#F0EAE0", fontSize: 14, outline: "none", fontFamily: "Georgia,serif" }
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => {
    setMA((p) => p.map((x) => x.id === m.id ? { ...x, email: emailVal } : x));
    setEditEmail(false);
  }, style: { flex: 1, background: "rgba(79,168,122,.8)", border: "none", borderRadius: 7, padding: "7px", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 } }, "\u2713"), /* @__PURE__ */ React.createElement("button", { onClick: () => {
    setEmailVal(m.email || "");
    setEditEmail(false);
  }, style: { background: "rgba(255,255,255,.1)", border: "none", borderRadius: 7, padding: "7px 10px", color: "#888", cursor: "pointer", fontSize: 13 } }, "\u2715"))) : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => {
    setEmailVal(m.email || "");
    setEditEmail(true);
  }, style: { background: "rgba(91,158,201,.12)", border: "1px solid rgba(91,158,201,.3)", borderRadius: 8, padding: "8px 12px", color: "#5B9EC9", cursor: "pointer", fontSize: 14 } }, "\u2709"), bestaetige ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => {
    setMA((p) => p.filter((x) => x.id !== m.id));
    if (ichId === m.id) setIchId(mitarbeiter.filter((x) => x.id !== m.id)[0]?.id || null);
    setBestaetige(false);
  }, style: { background: "rgba(200,0,0,.8)", border: "none", borderRadius: 7, padding: "6px 8px", color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 700 } }, "L\xF6schen"), /* @__PURE__ */ React.createElement("button", { onClick: () => setBestaetige(false), style: { background: "rgba(255,255,255,.08)", border: "none", borderRadius: 7, padding: "6px 8px", color: "#888", cursor: "pointer", fontSize: 12 } }, "\u2715")) : /* @__PURE__ */ React.createElement("button", { onClick: () => setBestaetige(true), style: { background: "rgba(255,80,80,.1)", border: "1px solid rgba(255,80,80,.2)", borderRadius: 8, padding: "8px 12px", color: "#ff6b6b", cursor: "pointer", fontSize: 16 } }, "\u{1F5D1}")));
}
function BottomNav({ seite, setSeite }) {
  return /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 640, background: "rgba(19,17,14,.97)", borderTop: "1px solid rgba(197,165,90,.2)", display: "flex", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom)", backdropFilter: "blur(16px)" } }, [{ key: "dashboard", icon: "\u{1F3E0}", label: "Start" }, { key: "team", icon: "\u{1F465}", label: "Team" }].map((t) => /* @__PURE__ */ React.createElement("button", { key: t.key, onClick: () => setSeite(t.key), style: { flex: 1, background: "transparent", border: "none", padding: "12px 4px 10px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, position: "relative" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 22, lineHeight: 1 } }, t.icon), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: seite === t.key ? "#C5A55A" : "#555", fontFamily: "Georgia,serif", fontWeight: seite === t.key ? 700 : 400 } }, t.label), seite === t.key && /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 28, height: 3, background: "#C5A55A", borderRadius: 2 } }))));
}
function App() {
  const [mitarbeiter, setMA] = useState(INIT_MA);
  const [ichId, setIchId] = useState(INIT_MA[0].id);
  const [faelle, setFaelle] = useState([]);
  const [aktivId, setAktivId] = useState(null);
  const [geladen, setGeladen] = useState(false);
  const [seite, setSeite] = useState("dashboard");
  const [fallTab, setFallTab] = useState("schritte");
  const [neuFallSheet, setNeuFallSheet] = useState(false);
  const [neuMASheet, setNeuMASheet] = useState(false);
  const [userSheet, setUserSheet] = useState(false);
  const [druckAnsicht, setDruckAnsicht] = useState(false);
  const [loeschFallId, setLoeschFallId] = useState(null);
  const [nf, setNF] = useState({ name: "", geb: "", tod: tagNr(), ort: "", verantw: null });
  const [nma, setNMA] = useState({ name: "", rolle: "", team: "technik", farbe: AVATAR_FARBEN[0], email: "" });
  const [notizText, setNotizText] = useState("");
  const [neueBenachrichtigungen, setNeueBenachrichtigungen] = useState([]);
  const [benachrichtigungenSheet, setBenachrichtigungenSheet] = useState(false);
  const [alleBenachrichtigungen, setAlleBenachrichtigungen] = useState([]);
  const [zuletzt, setZuletzt] = useState(Date.now());
  const gesehenRef = useRef(/* @__PURE__ */ new Set());
  useEffect(() => {
    (async () => {
      try {
        const [ma, faelleData, akts] = await Promise.all([
          dbLadeMitarbeiter(),
          dbLadeFaelle(),
          dbLadeAktivitaeten()
        ]);
        setMA(ma);
        setFaelle(faelleData);
        setAktivId(faelleData[0]?.id || null);
        setAlleBenachrichtigungen(akts);
        const letzterUser = localStorage.getItem("bh_ich");
        if (letzterUser && ma.find((m) => m.id === parseInt(letzterUser))) {
          setIchId(parseInt(letzterUser));
        } else if (ma.length > 0) {
          setIchId(ma[0].id);
        }
      } catch (e) {
        console.log("Lade-Fehler:", e);
      }
      setGeladen(true);
    })();
  }, []);
  const prevMA = useRef(null);
  useEffect(() => {
    if (!geladen) return;
    if (JSON.stringify(prevMA.current) === JSON.stringify(mitarbeiter)) return;
    prevMA.current = mitarbeiter;
    dbSpeichereMitarbeiter(mitarbeiter);
  }, [mitarbeiter, geladen]);
  useEffect(() => {
    if (ichId) localStorage.setItem("bh_ich", String(ichId));
  }, [ichId]);
  useEffect(() => {
    if (!geladen) return;
    const interval = setInterval(async () => {
      try {
        const [akts, faelleData] = await Promise.all([
          dbLadeAktivitaeten(),
          dbLadeFaelle()
        ]);
        setAlleBenachrichtigungen(akts);
        setFaelle(faelleData);
        const neu = akts.filter((a) => a.ts > zuletzt && a.vonId !== ichId && !gesehenRef.current.has(a.ts));
        if (neu.length > 0) setNeueBenachrichtigungen((p) => [...neu, ...p].slice(0, 20));
      } catch {
      }
    }, 15e3);
    return () => clearInterval(interval);
  }, [geladen, ichId, zuletzt]);
  const benachrichtigungenGesehen = () => {
    alleBenachrichtigungen.forEach((a) => gesehenRef.current.add(a.ts));
    setNeueBenachrichtigungen([]);
    setZuletzt(Date.now());
    setBenachrichtigungenSheet(true);
  };
  const addAktivitaet = (text, fallName, icon = "\u{1F4CC}") => {
    const eintrag = { ts: Date.now(), text, fallName: fallName || "", icon, vonId: ichId, vonName: mitarbeiter.find((m) => m.id === ichId)?.name || "?", zeit: `${tagNr()} ${uhrzeit()}` };
    dbSpeichereAktivitaet(eintrag);
    setAlleBenachrichtigungen((p) => [eintrag, ...p].slice(0, 50));
    setNeueBenachrichtigungen((p) => [eintrag, ...p].slice(0, 20));
  };
  const fall = faelle.find((f) => f.id === aktivId) || null;
  const ich = mitarbeiter.find((m) => m.id === ichId) || mitarbeiter[0];
  const meineOffenen = faelle.flatMap((f) => f.schritte.filter((s) => s.verantw === ichId && s.status !== "abgeschlossen").map((s) => ({ ...s, fallName: f.name, fallId: f.id })));
  const updateFall = (id, upd) => setFaelle((p) => {
    const neu = p.map((f) => {
      if (f.id !== id) return f;
      const m = { ...f, ...upd };
      const abg = m.schritte.filter((s) => s.status === "abgeschlossen").length;
      m.status = abg === 0 ? "offen" : abg === m.schritte.length ? "abgeschlossen" : "in_bearbeitung";
      return m;
    });
    const geaendert = neu.find((f) => f.id === id);
    if (geaendert) dbSpeichereFall(geaendert);
    return neu;
  });
  const updateDoku = (id, upd) => updateFall(id, { doku: { ...faelle.find((f) => f.id === id)?.doku || leerDoku(), ...upd } });
  const toggleSchritt = (fallId, schrittId) => {
    const f = faelle.find((x) => x.id === fallId);
    if (!f) return;
    const next = { offen: "in_bearbeitung", in_bearbeitung: "abgeschlossen", abgeschlossen: "offen" };
    const schritt = f.schritte.find((s) => s.id === schrittId);
    const neuerStatus = next[schritt?.status || "offen"];
    updateFall(fallId, { schritte: f.schritte.map((s) => {
      if (s.id !== schrittId) return s;
      const n = next[s.status];
      return { ...s, status: n, vonId: n === "abgeschlossen" ? ichId : null, amDatum: n === "abgeschlossen" ? `${tagNr()} ${uhrzeit()}` : null };
    }) });
    if (neuerStatus === "abgeschlossen") addAktivitaet(`Schritt erledigt: ${schritt?.titel}`, f.name, "\u2705");
    else if (neuerStatus === "in_bearbeitung") addAktivitaet(`Schritt gestartet: ${schritt?.titel}`, f.name, "\u{1F504}");
  };
  const fallAnlegen = async () => {
    if (!nf.name.trim()) return;
    const id = Date.now();
    const neu = { ...leerFall(id), ...nf, name: nf.name.trim() };
    await dbSpeichereFall(neu);
    setFaelle((p) => [neu, ...p]);
    setAktivId(id);
    setNF({ name: "", geb: "", tod: tagNr(), ort: "", verantw: null });
    setNeuFallSheet(false);
    setFallTab("schritte");
    setSeite("fall");
    addAktivitaet(`Neuer Fall angelegt: ${nf.name.trim()}`, nf.name.trim(), "\u{1F4CB}");
  };
  const maAnlegen = () => {
    if (!nma.name.trim()) return;
    const id = Date.now();
    const rolle = nma.rolle || ROLLEN[nma.team][0];
    setMA((p) => [...p, { id, name: nma.name.trim(), rolle, team: nma.team, farbe: nma.farbe, kuerzel: kuerzel(nma.name), email: nma.email || "" }]);
    setNMA({ name: "", rolle: "", team: "technik", farbe: AVATAR_FARBEN[0], email: "" });
    setNeuMASheet(false);
  };
  const fallLoeschen = async (id) => {
    await dbLoescheFall(id);
    const rest = faelle.filter((f) => f.id !== id);
    setFaelle(rest);
    setAktivId(rest[0]?.id || null);
    setLoeschFallId(null);
    setSeite("dashboard");
  };
  if (!geladen) return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", background: "#13110E", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Georgia,serif", color: "#E8E0D0" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 40, marginBottom: 14 } }, "\u269C"), /* @__PURE__ */ React.createElement("div", { style: { color: "#C5A55A", fontSize: 18, fontWeight: 700, marginBottom: 6 } }, "Bestattungshaus"), /* @__PURE__ */ React.createElement("div", { style: { color: "#555", fontSize: 14 } }, "Wird geladen \u2026"));
  const BG = "#13110E";
  const CARD = { background: "#1E1C19", borderRadius: 16, padding: "16px" };
  return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", background: BG, fontFamily: "Georgia,serif", color: "#F0EAE0", maxWidth: 640, margin: "0 auto", position: "relative" } }, /* @__PURE__ */ React.createElement("div", { style: { position: "sticky", top: 0, zIndex: 50, background: "rgba(19,17,14,.97)", borderBottom: "1px solid rgba(197,165,90,.2)", backdropFilter: "blur(12px)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", height: 56, padding: "0 16px", gap: 12 } }, seite !== "dashboard" && /* @__PURE__ */ React.createElement("button", { onClick: () => setSeite("dashboard"), style: { background: "transparent", border: "none", color: "#C5A55A", cursor: "pointer", fontSize: 16, padding: "8px 4px", fontFamily: "Georgia,serif" } }, "\u2039 Zur\xFCck"), /* @__PURE__ */ React.createElement("span", { style: { flex: 1, color: "#C5A55A", fontWeight: 700, fontSize: 17, letterSpacing: 0.3 } }, seite === "dashboard" ? "\u269C Bestattungshaus" : seite === "fall" && fall ? fall.name : seite === "team" ? "\u{1F465} Team" : "\u269C"), seite === "fall" && fall && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { onClick: () => setDruckAnsicht(true), style: { background: "rgba(91,158,201,.15)", border: "none", borderRadius: 8, padding: "8px 12px", color: "#5B9EC9", cursor: "pointer", fontSize: 16 } }, "\u{1F5A8}"), /* @__PURE__ */ React.createElement("button", { onClick: () => setLoeschFallId(fall.id), style: { background: "rgba(255,80,80,.12)", border: "none", borderRadius: 8, padding: "8px 12px", color: "#ff6b6b", cursor: "pointer", fontSize: 16 } }, "\u{1F5D1}")), /* @__PURE__ */ React.createElement("div", { onClick: benachrichtigungenGesehen, style: { position: "relative", cursor: "pointer", padding: "4px" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 22 } }, "\u{1F514}"), neueBenachrichtigungen.length > 0 && /* @__PURE__ */ React.createElement("span", { style: { position: "absolute", top: 0, right: 0, background: "#FF3B30", color: "#fff", borderRadius: 10, minWidth: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, padding: "0 4px" } }, neueBenachrichtigungen.length)), /* @__PURE__ */ React.createElement("div", { onClick: () => setUserSheet(true), style: { cursor: "pointer" } }, ich && /* @__PURE__ */ React.createElement(Avatar, { k: ich.kuerzel, farbe: ich.farbe, size: 34 })))), neueBenachrichtigungen.length > 0 && !benachrichtigungenSheet && /* @__PURE__ */ React.createElement("div", { onClick: benachrichtigungenGesehen, style: { position: "fixed", top: 64, left: "50%", transform: "translateX(-50%)", zIndex: 200, width: "calc(100% - 32px)", maxWidth: 580, background: "#2D2A24", border: "1px solid rgba(197,165,90,.4)", borderRadius: 14, padding: "12px 16px", cursor: "pointer", boxShadow: "0 4px 24px rgba(0,0,0,.6)", display: "flex", alignItems: "center", gap: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 24, flexShrink: 0 } }, neueBenachrichtigungen[0].icon), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { color: "#F0EAE0", fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, neueBenachrichtigungen[0].vonName), /* @__PURE__ */ React.createElement("div", { style: { color: "#AAA", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, neueBenachrichtigungen[0].text)), neueBenachrichtigungen.length > 1 && /* @__PURE__ */ React.createElement("span", { style: { background: "#FF9500", color: "#fff", borderRadius: 10, padding: "2px 8px", fontSize: 12, fontWeight: 700 } }, "+", neueBenachrichtigungen.length - 1)), seite === "dashboard" && /* @__PURE__ */ React.createElement(Dashboard, { faelle, mitarbeiter, ich, meineOffenen, setAktivId, setFallTab, setSeite, setNeuFallSheet }), seite === "fall" && /* @__PURE__ */ React.createElement(FallDetail, { fall, faelle, mitarbeiter, ichId, fallTab, setFallTab, notizText, setNotizText, updateFall, updateDoku, toggleSchritt, setDruckAnsicht, setLoeschFallId, addAktivitaet }), seite === "team" && /* @__PURE__ */ React.createElement(TeamSeite, { mitarbeiter, setMA, ichId, setIchId, faelle, setNeuMASheet }), /* @__PURE__ */ React.createElement(BottomNav, { seite, setSeite }), neuFallSheet && /* @__PURE__ */ React.createElement(Sheet, { titel: "Neuer Fall", onClose: () => setNeuFallSheet(false) }, /* @__PURE__ */ React.createElement(Feld, { label: "Name der/des Verstorbenen *", value: nf.name, onChange: (v) => setNF((p) => ({ ...p, name: v })), placeholder: "Vor- und Nachname" }), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } }, /* @__PURE__ */ React.createElement(Feld, { label: "Geburtsdatum", value: nf.geb, onChange: (v) => setNF((p) => ({ ...p, geb: v })), placeholder: "TT.MM.JJJJ" }), /* @__PURE__ */ React.createElement(Feld, { label: "Sterbedatum", value: nf.tod, onChange: (v) => setNF((p) => ({ ...p, tod: v })), placeholder: "TT.MM.JJJJ" })), /* @__PURE__ */ React.createElement(Feld, { label: "Sterbeort", value: nf.ort, onChange: (v) => setNF((p) => ({ ...p, ort: v })), placeholder: "z. B. Zuhause, Klinik \u2026" }), /* @__PURE__ */ React.createElement(MAWahl, { label: "Hauptverantwortlich", value: nf.verantw, onChange: (v) => setNF((p) => ({ ...p, verantw: v })), mitarbeiter }), /* @__PURE__ */ React.createElement("div", { style: { height: 16 } }), /* @__PURE__ */ React.createElement(Btn, { label: "Fall anlegen", icon: "\u2713", onClick: fallAnlegen, full: true, color: nf.name.trim() ? "#4FA87A" : "#444", textColor: "#fff" })), neuMASheet && /* @__PURE__ */ React.createElement(Sheet, { titel: "Mitarbeiter hinzuf\xFCgen", onClose: () => setNeuMASheet(false) }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 } }, TEAMS.map((t) => /* @__PURE__ */ React.createElement("div", { key: t.id, onClick: () => setNMA((p) => ({ ...p, team: t.id, rolle: "" })), style: { background: nma.team === t.id ? `${t.farbe}25` : "#2A2825", border: `2px solid ${nma.team === t.id ? t.farbe : "rgba(255,255,255,.1)"}`, borderRadius: 12, padding: "14px", textAlign: "center", cursor: "pointer" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 26, marginBottom: 4 } }, t.icon), /* @__PURE__ */ React.createElement("div", { style: { color: nma.team === t.id ? t.farbe : "#888", fontWeight: 700, fontSize: 15 } }, t.label)))), /* @__PURE__ */ React.createElement(Feld, { label: "Name *", value: nma.name, onChange: (v) => setNMA((p) => ({ ...p, name: v })), placeholder: "Vor- und Nachname" }), /* @__PURE__ */ React.createElement(Auswahl, { label: "Rolle", value: nma.rolle || ROLLEN[nma.team][0], onChange: (v) => setNMA((p) => ({ ...p, rolle: v })), optionen: ROLLEN[nma.team] }), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { color: "#AAA", fontSize: 12, marginBottom: 8 } }, "Farbe"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" } }, AVATAR_FARBEN.map((f) => /* @__PURE__ */ React.createElement("div", { key: f, onClick: () => setNMA((p) => ({ ...p, farbe: f })), style: { width: 38, height: 38, borderRadius: "50%", background: f, cursor: "pointer", border: nma.farbe === f ? "3px solid #fff" : "3px solid transparent" } })))), nma.name && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#2A2825", borderRadius: 12, marginBottom: 16 } }, /* @__PURE__ */ React.createElement(Avatar, { k: kuerzel(nma.name), farbe: nma.farbe, size: 44 }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { color: "#F0EAE0", fontWeight: 700, fontSize: 15 } }, nma.name), /* @__PURE__ */ React.createElement("div", { style: { color: "#888", fontSize: 13 } }, nma.rolle || ROLLEN[nma.team][0], " \xB7 ", TEAMS.find((t) => t.id === nma.team)?.label))), /* @__PURE__ */ React.createElement(Btn, { label: "Hinzuf\xFCgen", icon: "\u2713", onClick: maAnlegen, full: true, color: nma.name.trim() ? "#4FA87A" : "#444", textColor: "#fff" })), userSheet && /* @__PURE__ */ React.createElement(Sheet, { titel: "Angemeldet als", onClose: () => setUserSheet(false) }, mitarbeiter.map((m) => /* @__PURE__ */ React.createElement("div", { key: m.id, onClick: () => {
    setIchId(m.id);
    setUserSheet(false);
  }, style: { display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: ichId === m.id ? "rgba(197,165,90,.1)" : "#2A2825", border: `2px solid ${ichId === m.id ? "#C5A55A" : "rgba(255,255,255,.08)"}`, borderRadius: 14, marginBottom: 10, cursor: "pointer" } }, /* @__PURE__ */ React.createElement(Avatar, { k: m.kuerzel, farbe: m.farbe, size: 46 }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { color: "#F0EAE0", fontWeight: 700, fontSize: 16 } }, m.name), /* @__PURE__ */ React.createElement("div", { style: { color: "#777", fontSize: 13 } }, m.rolle, " \xB7 ", TEAMS.find((t) => t.id === m.team)?.label)), ichId === m.id && /* @__PURE__ */ React.createElement("span", { style: { color: "#C5A55A", fontSize: 22 } }, "\u2713"))), /* @__PURE__ */ React.createElement("div", { style: { height: 8 } }), /* @__PURE__ */ React.createElement(Btn, { label: "Team verwalten", icon: "\u2699", onClick: () => {
    setUserSheet(false);
    setSeite("team");
  }, full: true, outline: true, color: "#C5A55A" })), benachrichtigungenSheet && /* @__PURE__ */ React.createElement(Sheet, { titel: "\u{1F514} Aktivit\xE4ten", onClose: () => setBenachrichtigungenSheet(false) }, alleBenachrichtigungen.length > 0 && /* @__PURE__ */ React.createElement("button", { onClick: async () => {
    await dbLoescheAlleAktivitaeten();
    setAlleBenachrichtigungen([]);
  }, style: { width: "100%", background: "rgba(255,80,80,.1)", border: "1px solid rgba(255,80,80,.25)", borderRadius: 10, padding: "11px", color: "#ff6b6b", cursor: "pointer", fontSize: 14, fontFamily: "Georgia,serif", marginBottom: 14 } }, "\u{1F5D1} Alle Aktivit\xE4ten l\xF6schen"), alleBenachrichtigungen.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "40px 0", color: "#555" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 40, marginBottom: 10 } }, "\u{1F514}"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14 } }, "Noch keine Aktivit\xE4ten")), alleBenachrichtigungen.map((a, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", gap: 12, padding: "14px", background: a.ts > zuletzt ? "rgba(197,165,90,.08)" : "#2A2825", border: `1px solid ${a.ts > zuletzt ? "rgba(197,165,90,.3)" : "rgba(255,255,255,.08)"}`, borderRadius: 14, marginBottom: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 24, flexShrink: 0 } }, a.icon), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#F0EAE0", fontWeight: 700, fontSize: 14 } }, a.vonName), a.ts > zuletzt && /* @__PURE__ */ React.createElement("span", { style: { background: "#FF9500", color: "#fff", borderRadius: 8, padding: "1px 7px", fontSize: 10, fontWeight: 700, marginLeft: 8 } }, "NEU")), /* @__PURE__ */ React.createElement("div", { style: { color: "#C8C0B0", fontSize: 14, marginBottom: 4 } }, a.text), a.fallName && /* @__PURE__ */ React.createElement("div", { style: { color: "#666", fontSize: 12 } }, "\u{1F4CB} ", a.fallName), /* @__PURE__ */ React.createElement("div", { style: { color: "#555", fontSize: 11, marginTop: 4 } }, a.zeit)), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: async () => {
        await dbLoescheAktivitaet(a.ts);
        setAlleBenachrichtigungen((p) => p.filter((_, j) => j !== i));
      },
      style: { background: "rgba(255,80,80,.1)", border: "none", borderRadius: 8, padding: "6px 10px", color: "#ff6b6b", cursor: "pointer", fontSize: 18, flexShrink: 0, alignSelf: "flex-start" }
    },
    "\u{1F5D1}"
  )))), loeschFallId && /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { background: "#1E1C19", border: "1px solid rgba(255,80,80,.3)", borderRadius: 18, padding: "28px 24px", maxWidth: 340, width: "100%", textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 40, marginBottom: 12 } }, "\u{1F5D1}"), /* @__PURE__ */ React.createElement("div", { style: { color: "#F0EAE0", fontWeight: 700, fontSize: 18, marginBottom: 8 } }, "Fall l\xF6schen?"), /* @__PURE__ */ React.createElement("div", { style: { color: "#888", fontSize: 14, marginBottom: 24, lineHeight: 1.6 } }, "\u201E", faelle.find((f) => f.id === loeschFallId)?.name, '" wird unwiderruflich gel\xF6scht.'), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10 } }, /* @__PURE__ */ React.createElement(Btn, { label: "Abbrechen", onClick: () => setLoeschFallId(null), full: true, outline: true, color: "#666" }), /* @__PURE__ */ React.createElement(Btn, { label: "L\xF6schen", onClick: () => fallLoeschen(loeschFallId), full: true, danger: true })))), druckAnsicht && fall && /* @__PURE__ */ React.createElement(Drucken, { fall, mitarbeiter, onClose: () => setDruckAnsicht(false) }));
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
setTimeout(function() {
  var s = document.getElementById('splash');
  if(s){s.style.opacity='0';s.style.transition='opacity .5s';setTimeout(function(){if(s)s.remove();},600);}
}, 300);
