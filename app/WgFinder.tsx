"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Profile = {
  id: string;
  name: string;
  age: number;
  gender: string;
  city: string;
  district: string;
  moveIn: string;
  housing: string;
  about: string;
  lookingFor: string;
  preferredGender: string;
  dislikes: string;
  important: string;
  accessibility: string;
  contactName: string;
  contactType: string;
  contactValue: string;
  imageKey: string | null;
  createdAt: string;
};

type ApiProfile = Record<string, unknown>;
type View = "search" | "create" | "saved";

const demoProfiles: Profile[] = [
  {
    id: "demo-lena", name: "Lena", age: 28, gender: "Frau", city: "München", district: "Pasing",
    moveIn: "Ab Oktober 2026", housing: "Ich suche eine Wohnung", about: "Ich mag Musik, Kochen und Spaziergänge.",
    lookingFor: "Du bist freundlich. Du bist ungefähr in meinem Alter.", preferredGender: "Alle",
    dislikes: "Sehr laute Musik in der Nacht.", important: "Wir sprechen über den Haushalt. Jede Person hat Zeit für sich.",
    accessibility: "Aufzug wichtig", contactName: "Wohnberatung Beispiel", contactType: "E-Mail",
    contactValue: "beratung@beispiel.de", imageKey: null, createdAt: "2026-08-18T10:00:00.000Z",
  },
  {
    id: "demo-tobias", name: "Tobias", age: 34, gender: "Mann", city: "München", district: "Giesing",
    moveIn: "Ab sofort", housing: "Ich habe eine Wohnung", about: "Ich mag Fußball, Tiere und Brettspiele.",
    lookingFor: "Du bist ruhig und magst Tiere.", preferredGender: "Mann", dislikes: "Rauchen in der Wohnung.",
    important: "Wir kochen manchmal zusammen. Mein Hund wohnt mit uns.", accessibility: "Stufen sind in Ordnung",
    contactName: "Wohnberatung Beispiel", contactType: "Telefon", contactValue: "0123 456789", imageKey: null,
    createdAt: "2026-08-14T10:00:00.000Z",
  },
  {
    id: "demo-samira", name: "Samira", age: 25, gender: "Frau", city: "Augsburg", district: "Innenstadt",
    moveIn: "Ab November 2026", housing: "Ich suche eine Wohnung", about: "Ich male gern. Ich mag Cafés und Serien.",
    lookingFor: "Du bist offen und zuverlässig.", preferredGender: "Frau", dislikes: "Streit und Unordnung.",
    important: "Ein ruhiges Zuhause. Ein Plan für Putzen und Einkaufen.", accessibility: "Rollstuhl-gerecht",
    contactName: "EUTB Beispiel", contactType: "E-Mail", contactValue: "kontakt@beispiel.de", imageKey: null,
    createdAt: "2026-08-10T10:00:00.000Z",
  },
];

function normalize(row: ApiProfile): Profile {
  const value = (camel: string, snake: string) => row[camel] ?? row[snake] ?? "";
  return {
    id: String(row.id), name: String(row.name), age: Number(row.age), gender: String(row.gender),
    city: String(row.city), district: String(row.district ?? ""), moveIn: String(value("moveIn", "move_in")),
    housing: String(row.housing ?? ""), about: String(row.about), lookingFor: String(value("lookingFor", "looking_for")),
    preferredGender: String(value("preferredGender", "preferred_gender")), dislikes: String(row.dislikes ?? ""),
    important: String(row.important ?? ""), accessibility: String(row.accessibility ?? ""),
    contactName: String(value("contactName", "contact_name")), contactType: String(value("contactType", "contact_type")),
    contactValue: String(value("contactValue", "contact_value")), imageKey: value("imageKey", "image_key") ? String(value("imageKey", "image_key")) : null,
    createdAt: String(value("createdAt", "created_at")),
  };
}

function readIds(key: string) {
  try { return JSON.parse(localStorage.getItem(key) || "[]") as string[]; } catch { return []; }
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("de-DE").format(new Date(value));
}

function avatarColor(name: string) {
  const colors = ["#ffe2a9", "#cfe9ff", "#daf1d1", "#f6d8ed", "#e1ddff"];
  return colors[name.charCodeAt(0) % colors.length];
}

export default function WgFinder() {
  const [view, setView] = useState<View>("search");
  const [profiles, setProfiles] = useState<Profile[]>(demoProfiles);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("Alle Orte");
  const [gender, setGender] = useState("Alle");
  const [access, setAccess] = useState("Alle");
  const [housing, setHousing] = useState("Alle");
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setFavorites(readIds("wg-favorites"));
    setHidden(readIds("wg-hidden"));
    try { setNotes(JSON.parse(localStorage.getItem("wg-notes") || "{}")); } catch { setNotes({}); }
    fetch("/api/profiles")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((rows: ApiProfile[]) => setProfiles(rows.map(normalize)))
      .catch(() => setProfiles(demoProfiles))
      .finally(() => setLoading(false));
  }, []);

  const cities = useMemo(() => ["Alle Orte", ...Array.from(new Set(profiles.map((p) => p.city))).sort()], [profiles]);
  const visible = useMemo(() => profiles.filter((profile) => {
    const text = `${profile.name} ${profile.city} ${profile.district} ${profile.about} ${profile.lookingFor}`.toLowerCase();
    const accessFits = access === "Alle" || (access === "Rollstuhl-gerecht" ? profile.accessibility.includes("Rollstuhl") : profile.accessibility.includes("Aufzug"));
    return !hidden.includes(profile.id) && (!query || text.includes(query.toLowerCase())) &&
      (city === "Alle Orte" || profile.city === city) && (gender === "Alle" || profile.gender === gender) &&
      (housing === "Alle" || profile.housing === housing) && accessFits;
  }), [profiles, hidden, query, city, gender, housing, access]);

  const saved = profiles.filter((profile) => favorites.includes(profile.id) && !hidden.includes(profile.id));
  const activeFilters = [city !== "Alle Orte", gender !== "Alle", access !== "Alle", housing !== "Alle"].filter(Boolean).length;

  function toggleFavorite(id: string) {
    const next = favorites.includes(id) ? favorites.filter((item) => item !== id) : [...favorites, id];
    setFavorites(next);
    localStorage.setItem("wg-favorites", JSON.stringify(next));
  }

  function hideProfile(id: string) {
    const next = [...new Set([...hidden, id])];
    setHidden(next);
    localStorage.setItem("wg-hidden", JSON.stringify(next));
    setSelected(null);
  }

  function saveNote(id: string, text: string) {
    const next = { ...notes, [id]: text };
    setNotes(next);
    localStorage.setItem("wg-notes", JSON.stringify(next));
  }

  function resetFilters() {
    setCity("Alle Orte"); setGender("Alle"); setAccess("Alle"); setHousing("Alle"); setQuery("");
  }

  return (
    <main>
      <a className="skip-link" href="#inhalt">Zum Inhalt</a>
      <header className="site-header">
        <button className="brand" onClick={() => setView("search")} aria-label="WG-Finder Startseite">
          <span className="brand-mark" aria-hidden="true">🏠</span>
          <span>WG-Finder</span>
        </button>
        <nav aria-label="Haupt-Menü">
          <NavButton active={view === "search"} onClick={() => setView("search")} icon="🔎">Suchen</NavButton>
          <NavButton active={view === "create"} onClick={() => setView("create")} icon="✏️">Steckbrief machen</NavButton>
          <NavButton active={view === "saved"} onClick={() => setView("saved")} icon="⭐">Gespeichert</NavButton>
        </nav>
      </header>

      <div id="inhalt" className="page-shell">
        {view === "search" && (
          <section aria-labelledby="search-title">
            <div className="hero">
              <div>
                <p className="eyebrow">🏠 Zusammen wohnen</p>
                <h1 id="search-title">Finde eine Person für deine WG.</h1>
                <div className="hero-actions">
                  <button className="primary" onClick={() => document.getElementById("suche")?.focus()}>🔎 Personen ansehen</button>
                  <button className="secondary" onClick={() => setView("create")}>✏️ Steckbrief machen</button>
                </div>
              </div>
              <img src="/wg-gemeinsam.jpg" alt="Drei Personen spielen gemeinsam in einer Wohnung." />
            </div>

            <div className="search-row">
              <label className="search-box" htmlFor="suche">
                <span aria-hidden="true">🔎</span>
                <span className="sr-only">Suchen</span>
                <input id="suche" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, Ort oder Hobby" />
              </label>
              <button className="filter-button" onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters}>
                ⚙️ Filter {activeFilters > 0 && <span className="count">{activeFilters}</span>}
              </button>
            </div>

            {showFilters && (
              <div className="filter-panel">
                <Select label="📍 Ort" value={city} onChange={setCity} options={cities} />
                <Select label="👤 Person" value={gender} onChange={setGender} options={["Alle", "Frau", "Mann", "Divers"]} />
                <Select label="♿ Barriere-Freiheit" value={access} onChange={setAccess} options={["Alle", "Rollstuhl-gerecht", "Aufzug wichtig"]} />
                <Select label="🔑 Wohnung" value={housing} onChange={setHousing} options={["Alle", "Ich habe eine Wohnung", "Ich suche eine Wohnung"]} />
                <button className="text-button" onClick={resetFilters}>↺ Filter löschen</button>
              </div>
            )}

            <div className="result-heading">
              <h2>{loading ? "Steckbriefe werden geladen ..." : `${visible.length} Steckbriefe`}</h2>
              <span>Neue zuerst</span>
            </div>
            {visible.length > 0 ? (
              <div className="profile-grid">
                {visible.map((profile) => (
                  <ProfileCard key={profile.id} profile={profile} favorite={favorites.includes(profile.id)} onFavorite={() => toggleFavorite(profile.id)} onOpen={() => setSelected(profile)} />
                ))}
              </div>
            ) : (
              <Empty title="Keine Person gefunden." action="Filter löschen" onAction={resetFilters} />
            )}
          </section>
        )}

        {view === "saved" && (
          <section aria-labelledby="saved-title">
            <div className="simple-title">
              <p className="eyebrow">⭐ Nur auf diesem Gerät</p>
              <h1 id="saved-title">Gespeicherte Steckbriefe</h1>
            </div>
            {saved.length > 0 ? (
              <div className="profile-grid">
                {saved.map((profile) => <ProfileCard key={profile.id} profile={profile} favorite onFavorite={() => toggleFavorite(profile.id)} onOpen={() => setSelected(profile)} />)}
              </div>
            ) : (
              <Empty title="Noch nichts gespeichert." action="Personen suchen" onAction={() => setView("search")} />
            )}
          </section>
        )}

        {view === "create" && <CreateProfile onCreated={(profile) => { setProfiles((items) => [profile, ...items]); setSelected(profile); setView("search"); }} />}
      </div>

      {selected && (
        <ProfileDialog
          profile={selected}
          favorite={favorites.includes(selected.id)}
          note={notes[selected.id] || ""}
          onNote={(text) => saveNote(selected.id, text)}
          onFavorite={() => toggleFavorite(selected.id)}
          onHide={() => hideProfile(selected.id)}
          onClose={() => setSelected(null)}
        />
      )}
    </main>
  );
}

function NavButton({ active, icon, onClick, children }: { active: boolean; icon: string; onClick: () => void; children: React.ReactNode }) {
  return <button className={active ? "nav-button active" : "nav-button"} onClick={onClick}><span aria-hidden="true">{icon}</span>{children}</button>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label className="select-field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}

function ProfileCard({ profile, favorite, onFavorite, onOpen }: { profile: Profile; favorite: boolean; onFavorite: () => void; onOpen: () => void }) {
  return (
    <article className="profile-card">
      <button className="heart-button" onClick={onFavorite} aria-label={favorite ? `${profile.name} nicht mehr speichern` : `${profile.name} speichern`} aria-pressed={favorite}>{favorite ? "★" : "☆"}</button>
      <button className="card-main" onClick={onOpen} aria-label={`Steckbrief von ${profile.name} öffnen`}>
        <Avatar profile={profile} />
        <div className="card-content">
          <div className="name-row"><h3>{profile.name}, {profile.age}</h3><span>{profile.gender}</span></div>
          <p className="place">📍 {profile.city}{profile.district ? ` · ${profile.district}` : ""}</p>
          <p className="card-about">{profile.about}</p>
          <div className="tag-row">
            {profile.accessibility && <span>♿ {profile.accessibility}</span>}
            <span>🔑 {profile.housing === "Ich habe eine Wohnung" ? "Wohnung da" : "Sucht Wohnung"}</span>
          </div>
        </div>
      </button>
      <button className="open-button" onClick={onOpen}>Steckbrief ansehen <span aria-hidden="true">→</span></button>
    </article>
  );
}

function Avatar({ profile, large = false }: { profile: Profile; large?: boolean }) {
  if (profile.imageKey) return <img className={large ? "avatar large" : "avatar"} src={`/api/bilder/${profile.imageKey}`} alt={`Foto von ${profile.name}`} />;
  return <div className={large ? "avatar large avatar-letter" : "avatar avatar-letter"} style={{ background: avatarColor(profile.name) }} aria-label={`Kein Foto von ${profile.name}`}>{profile.name.slice(0, 1)}</div>;
}

function Empty({ title, action, onAction }: { title: string; action: string; onAction: () => void }) {
  return <div className="empty"><img src="/mitbewohner-finden.jpg" alt="Lupe mit zwei Personen." /><h2>{title}</h2><button className="secondary" onClick={onAction}>{action}</button></div>;
}

function ProfileDialog({ profile, favorite, note, onNote, onFavorite, onHide, onClose }: { profile: Profile; favorite: boolean; note: string; onNote: (text: string) => void; onFavorite: () => void; onHide: () => void; onClose: () => void }) {
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function speak() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const text = `${profile.name}, ${profile.age} Jahre. ${profile.about} Gesucht: ${profile.lookingFor}. Wichtig: ${profile.important}.`;
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="profile-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-title">
        <div className="dialog-top">
          <button className="close-button" onClick={onClose} aria-label="Steckbrief schließen">← Zurück</button>
          <div className="dialog-tools">
            <button onClick={speak}>🔊 Vorlesen</button>
            <button onClick={onFavorite} aria-pressed={favorite}>{favorite ? "★ Gespeichert" : "☆ Speichern"}</button>
            <button onClick={() => window.print()}>🖨️ PDF</button>
          </div>
        </div>
        <div className="profile-head">
          <Avatar profile={profile} large />
          <div><p className="eyebrow">Ich suche eine Mitbewohner:in</p><h2 id="profile-title">{profile.name}, {profile.age}</h2><p>📍 {profile.city}{profile.district ? ` · ${profile.district}` : ""}</p><p>📅 {profile.moveIn}</p></div>
        </div>
        <div className="detail-grid">
          <InfoBox icon="🙂" title="So bin ich" text={profile.about} />
          <InfoBox icon="🔎" title="Wen ich suche" text={`${profile.lookingFor}${profile.preferredGender !== "Alle" ? ` Gesucht: ${profile.preferredGender}.` : ""}`} />
          <InfoBox icon="🚫" title="Das mag ich nicht" text={profile.dislikes || "Keine Angabe."} />
          <InfoBox icon="🤝" title="Das ist mir wichtig" text={profile.important || "Keine Angabe."} />
          <InfoBox icon="♿" title="Barriere-Freiheit" text={profile.accessibility || "Keine Angabe."} />
          <InfoBox icon="🔑" title="Wohnung" text={profile.housing} />
        </div>
        <div className="contact-box">
          <div><span aria-hidden="true">💬</span><div><h3>Kontakt</h3><p>{profile.contactName}</p></div></div>
          {profile.contactType === "E-Mail" ? <a href={`mailto:${profile.contactValue}`}>✉️ E-Mail schreiben</a> : <a href={`tel:${profile.contactValue.replace(/\s/g, "")}`}>☎️ {profile.contactValue}</a>}
        </div>
        <label className="note-box"><span>📝 Meine Notiz</span><textarea defaultValue={note} placeholder="Nur auf diesem Gerät" onChange={(event) => {
          if (noteTimer.current) clearTimeout(noteTimer.current);
          const value = event.target.value;
          noteTimer.current = setTimeout(() => onNote(value), 250);
        }} /></label>
        <div className="dialog-footer"><span>📅 Stand: {dateLabel(profile.createdAt)}</span><button className="hide-button" onClick={onHide}>🙈 Steckbrief ausblenden</button></div>
      </section>
      <PrintSheet profile={profile} />
    </div>
  );
}

function InfoBox({ icon, title, text }: { icon: string; title: string; text: string }) {
  return <section className="info-box"><div className="info-icon" aria-hidden="true">{icon}</div><div><h3>{title}</h3><p>{text}</p></div></section>;
}

function PrintSheet({ profile }: { profile: Profile }) {
  return (
    <article className="print-sheet">
      <header><div><p>🏠 WG-Finder</p><h1>Ich suche eine Mitbewohner:in</h1></div><span>Stand: {dateLabel(profile.createdAt)}</span></header>
      <div className="print-person"><Avatar profile={profile} large /><div><h2>{profile.name}, {profile.age}</h2><p>📍 {profile.city}{profile.district ? ` · ${profile.district}` : ""}</p><p>📅 {profile.moveIn}</p><p>🔑 {profile.housing}</p></div></div>
      <div className="print-grid">
        <InfoBox icon="🙂" title="So bin ich und das mag ich" text={profile.about} />
        <InfoBox icon="🔎" title="So wünsche ich mir meine Mitbewohner:in" text={profile.lookingFor} />
        <InfoBox icon="🚫" title="Das mag ich nicht" text={profile.dislikes || "Keine Angabe."} />
        <InfoBox icon="🤝" title="Das ist mir wichtig" text={profile.important || "Keine Angabe."} />
      </div>
      <section className="print-access"><h3>♿ Barriere-Freiheit</h3><p>{profile.accessibility || "Keine Angabe."}</p></section>
      <footer><div><h3>💬 Kontakt</h3><p>{profile.contactName}</p><strong>{profile.contactType}: {profile.contactValue}</strong></div><span>Steckbrief vom WG-Finder</span></footer>
    </article>
  );
}

function CreateProfile({ onCreated }: { onCreated: (profile: Profile) => void }) {
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  function next() {
    const activeStep = formRef.current?.querySelector(".form-step:not(.hidden-step)");
    const controls = Array.from(activeStep?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select") ?? []);
    if (!controls.every((control) => control.reportValidity())) return;
    setStep((value) => Math.min(3, value + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/profiles", { method: "POST", body: new FormData(event.currentTarget) });
      const body = await response.json() as ApiProfile & { error?: string };
      if (!response.ok) throw new Error(body.error || "Der Steckbrief konnte nicht gespeichert werden.");
      onCreated(normalize(body));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Bitte versuche es noch einmal.");
    } finally { setBusy(false); }
  }

  return (
    <section className="create-page" aria-labelledby="create-title">
      <div className="create-intro">
        <div><p className="eyebrow">✏️ Dein Steckbrief</p><h1 id="create-title">Erzähle etwas über dich.</h1></div>
        <img src="/steckbrief-machen.jpg" alt="Eine Hand klebt ein Foto auf einen Steckbrief." />
      </div>
      <div className="privacy-note"><span aria-hidden="true">🛡️</span><p><strong>Dieser Entwurf ist noch nicht für echte Daten freigegeben.</strong><br />Nutze jetzt bitte nur Beispiel-Daten.</p></div>
      <div className="steps" aria-label={`Schritt ${step} von 3`}>
        {[1, 2, 3].map((number) => <div key={number} className={number <= step ? "step done" : "step"}><span>{number < step ? "✓" : number}</span><b>{number === 1 ? "Über mich" : number === 2 ? "Zusammen wohnen" : "Kontakt"}</b></div>)}
      </div>
      <form ref={formRef} onSubmit={submit}>
        <div className={step === 1 ? "form-step" : "form-step hidden-step"}>
          <PhotoField photoUrl={photoUrl} onPhoto={setPhotoUrl} />
          <div className="field-grid">
            <Field name="name" label="👤 Mein Vorname" placeholder="Zum Beispiel: Lena" required />
            <Field name="age" label="🎂 Mein Alter" type="number" min="18" max="99" placeholder="28" required />
            <Choice name="gender" label="🙂 Ich bin" options={["Frau", "Mann", "Divers"]} required />
            <Field name="city" label="📍 Ort" placeholder="Zum Beispiel: München" required />
            <Field name="district" label="🏘️ Stadt-Teil" placeholder="Zum Beispiel: Pasing" />
            <Field name="moveIn" label="📅 Einzug" placeholder="Zum Beispiel: Ab Oktober" />
          </div>
        </div>

        <div className={step === 2 ? "form-step" : "form-step hidden-step"}>
          <TextArea name="about" label="🙂 So bin ich und das mag ich" placeholder="Ich mag Musik, Kochen und Spaziergänge." required />
          <TextArea name="lookingFor" label="🔎 So wünsche ich mir meine Mitbewohner:in" placeholder="Du bist freundlich und ruhig." required />
          <Choice name="preferredGender" label="👥 Ich suche" options={["Alle", "Frau", "Mann", "Divers"]} defaultValue="Alle" />
          <TextArea name="dislikes" label="🚫 Das mag ich nicht" placeholder="Zum Beispiel: Rauchen in der Wohnung." />
          <TextArea name="important" label="🤝 Das ist mir wichtig" placeholder="Zum Beispiel: Wir machen einen Putz-Plan." />
          <Choice name="housing" label="🔑 Wohnung" options={["Ich suche eine Wohnung", "Ich habe eine Wohnung"]} defaultValue="Ich suche eine Wohnung" />
          <Choice name="accessibility" label="♿ Barriere-Freiheit" options={["Keine Angabe", "Rollstuhl-gerecht", "Aufzug wichtig", "Stufen sind in Ordnung"]} defaultValue="Keine Angabe" />
        </div>

        <div className={step === 3 ? "form-step" : "form-step hidden-step"}>
          <Field name="contactName" label="👤 Kontakt-Person" placeholder="Name oder Beratungs-Stelle" required />
          <Choice name="contactType" label="💬 Kontakt-Art" options={["E-Mail", "Telefon"]} defaultValue="E-Mail" />
          <Field name="contactValue" label="✉️ E-Mail oder Telefon" placeholder="Kontakt" required />
          <label className="check"><input type="checkbox" required /><span>✅ Ich habe alle Angaben geprüft.</span></label>
          {error && <p className="error" role="alert">⚠️ {error}</p>}
        </div>

        <div className="form-actions">
          {step > 1 && <button type="button" className="secondary" onClick={() => setStep(step - 1)}>← Zurück</button>}
          {step < 3 ? <button type="button" className="primary" onClick={next}>Weiter →</button> : <button type="submit" className="primary" disabled={busy}>{busy ? "Wird gespeichert ..." : "✅ Steckbrief speichern"}</button>}
        </div>
      </form>
    </section>
  );
}

function PhotoField({ photoUrl, onPhoto }: { photoUrl: string; onPhoto: (url: string) => void }) {
  return <label className="photo-field"><span>{photoUrl ? <img src={photoUrl} alt="Vorschau von deinem Foto" /> : <span className="photo-placeholder">📷</span>}</span><b>📷 Mein Foto</b><small>JPG, PNG oder WEBP · höchstens 5 MB</small><input name="photo" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) onPhoto(URL.createObjectURL(file)); }} /></label>;
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="field"><span>{label}</span><input {...props} /></label>;
}

function TextArea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return <label className="field"><span>{label}</span><textarea maxLength={500} {...props} /></label>;
}

function Choice({ name, label, options, defaultValue, required }: { name: string; label: string; options: string[]; defaultValue?: string; required?: boolean }) {
  return <fieldset className="choice"><legend>{label}</legend><div>{options.map((option) => <label key={option}><input type="radio" name={name} value={option} defaultChecked={option === (defaultValue || options[0])} required={required} /><span>{option}</span></label>)}</div></fieldset>;
}
