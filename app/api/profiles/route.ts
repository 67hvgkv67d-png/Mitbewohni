import { env } from "cloudflare:workers";

const createTable = `CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT NOT NULL DEFAULT '',
  search_city TEXT NOT NULL DEFAULT '',
  search_district TEXT NOT NULL DEFAULT '',
  move_in TEXT NOT NULL DEFAULT '',
  housing TEXT NOT NULL DEFAULT 'Ich suche eine Wohnung',
  about TEXT NOT NULL,
  looking_for TEXT NOT NULL,
  preferred_gender TEXT NOT NULL DEFAULT 'Alle',
  dislikes TEXT NOT NULL DEFAULT '',
  important TEXT NOT NULL DEFAULT '',
  wg_size TEXT NOT NULL DEFAULT 'Egal',
  accessibility TEXT NOT NULL DEFAULT '',
  contact_name TEXT NOT NULL,
  contact_type TEXT NOT NULL,
  contact_value TEXT NOT NULL,
  contact_email TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  image_key TEXT,
  created_at TEXT NOT NULL
)`;

const createCityIndex = "CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city)";
const createGenderIndex = "CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender)";

type RuntimeEnv = {
  DB: D1Database;
  PROFILE_IMAGES: R2Bucket;
};

const runtime = env as unknown as RuntimeEnv;

async function prepareDb() {
  await runtime.DB.batch([
    runtime.DB.prepare(createTable),
    runtime.DB.prepare(createCityIndex),
    runtime.DB.prepare(createGenderIndex),
    runtime.DB.prepare("PRAGMA optimize"),
  ]);

  const count = await runtime.DB.prepare("SELECT COUNT(*) AS total FROM profiles").first<{ total: number }>();
  if ((count?.total ?? 0) > 0) return;

  const insert = `INSERT INTO profiles (
    id, name, age, gender, city, district, search_city, search_district, move_in, housing, about,
    looking_for, preferred_gender, dislikes, important, wg_size, accessibility,
    contact_name, contact_type, contact_value, contact_email, contact_phone, image_key, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  await runtime.DB.batch([
    runtime.DB.prepare(insert).bind(
      "demo-lena", "Lena", 28, "Frau", "München", "Pasing", "München", "Pasing", "Ab Oktober 2026",
      "Ich suche eine Wohnung", "Ich mag Musik, Kochen und Spaziergänge.",
      "Du bist freundlich. Du bist ungefähr in meinem Alter.", "Alle", "Sehr laute Musik in der Nacht.",
      "Wir sprechen über den Haushalt. Jede Person hat Zeit für sich.", "3 Personen", "Aufzug wichtig",
      "Wohnberatung Beispiel", "E-Mail", "beratung@beispiel.de", "beratung@beispiel.de", "", null, "2026-08-18T10:00:00.000Z"
    ),
    runtime.DB.prepare(insert).bind(
      "demo-tobias", "Tobias", 34, "Mann", "München", "Giesing", "München", "Giesing", "Ab sofort",
      "Ich habe eine Wohnung", "Ich mag Fußball, Tiere und Brettspiele.",
      "Du bist ruhig und magst Tiere.", "Mann", "Rauchen in der Wohnung.",
      "Wir kochen manchmal zusammen. Mein Hund wohnt mit uns.", "2 Personen", "Stufen sind in Ordnung",
      "Wohnberatung Beispiel", "Telefon", "0123 456789", "", "0123 456789", null, "2026-08-14T10:00:00.000Z"
    ),
    runtime.DB.prepare(insert).bind(
      "demo-samira", "Samira", 25, "Frau", "Augsburg", "Innenstadt", "Augsburg", "Innenstadt", "Ab November 2026",
      "Ich suche eine Wohnung", "Ich male gern. Ich mag Cafés und Serien.",
      "Du bist offen und zuverlässig.", "Frau", "Streit und Unordnung.",
      "Ein ruhiges Zuhause. Ein Plan für Putzen und Einkaufen.", "4 Personen", "Rollstuhl-gerecht",
      "EUTB Beispiel", "E-Mail", "kontakt@beispiel.de", "kontakt@beispiel.de", "", null, "2026-08-10T10:00:00.000Z"
    ),
  ]);
}

function clean(value: FormDataEntryValue | null, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

export async function GET() {
  await prepareDb();
  const result = await runtime.DB.prepare("SELECT * FROM profiles ORDER BY created_at DESC").all();
  return Response.json(result.results);
}

export async function POST(request: Request) {
  await prepareDb();
  const data = await request.formData();
  const id = crypto.randomUUID();
  const age = Number(clean(data.get("age"), 3));
  const contactEmail = clean(data.get("contactEmail"), 160);
  const contactPhone = clean(data.get("contactPhone"), 80);
  const required = ["name", "gender", "city", "searchCity", "about", "lookingFor", "contactName"];
  if (!Number.isInteger(age) || age < 18 || age > 99 || required.some((key) => !clean(data.get(key)))) {
    return Response.json({ error: "Bitte fülle alle wichtigen Felder aus." }, { status: 400 });
  }
  if (!contactEmail && !contactPhone) {
    return Response.json({ error: "Bitte gib eine E-Mail-Adresse oder eine Telefon-Nummer an." }, { status: 400 });
  }

  let imageKey: string | null = null;
  const photo = data.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > 5_000_000 || !["image/jpeg", "image/png", "image/webp"].includes(photo.type)) {
      return Response.json({ error: "Das Foto muss JPG, PNG oder WEBP sein. Höchstens 5 MB." }, { status: 400 });
    }
    const extension = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
    imageKey = `${id}.${extension}`;
    await runtime.PROFILE_IMAGES.put(imageKey, photo.stream(), { httpMetadata: { contentType: photo.type } });
  }

  const createdAt = new Date().toISOString();
  await runtime.DB.prepare(`INSERT INTO profiles (
    id, name, age, gender, city, district, search_city, search_district, move_in, housing, about,
    looking_for, preferred_gender, dislikes, important, wg_size, accessibility,
    contact_name, contact_type, contact_value, contact_email, contact_phone, image_key, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      id, clean(data.get("name"), 80), age, clean(data.get("gender"), 30), clean(data.get("city"), 80),
      clean(data.get("district"), 80), clean(data.get("searchCity"), 80), clean(data.get("searchDistrict"), 80),
      clean(data.get("moveIn"), 80), clean(data.get("housing"), 80),
      clean(data.get("about")), clean(data.get("lookingFor")), clean(data.get("preferredGender"), 30) || "Alle",
      clean(data.get("dislikes")), clean(data.get("important")), clean(data.get("wgSize"), 40) || "Egal",
      clean(data.get("accessibility"), 160), clean(data.get("contactName"), 100),
      contactEmail ? "E-Mail" : "Telefon", contactEmail || contactPhone, contactEmail, contactPhone,
      imageKey, createdAt
    ).run();

  const profile = await runtime.DB.prepare("SELECT * FROM profiles WHERE id = ?").bind(id).first();
  return Response.json(profile, { status: 201 });
}
