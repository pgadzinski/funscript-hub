import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, creatorsTable, funscriptsTable, accessLogsTable } from "@workspace/db";

const router: IRouter = Router();

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/120",
  "Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
];

const REFERRERS = [
  "https://twitter.com",
  "https://reddit.com/r/interactive",
  "https://discord.com",
  null,
  null,
  "https://t.me/funscripts",
  "https://patreon.com",
];

const IPS = [
  "203.0.113.12", "198.51.100.44", "192.0.2.77",
  "10.0.0.20", "172.16.0.55", "203.0.113.99",
  "198.51.100.8", "192.168.1.5", "203.0.113.42",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
  return d;
}

router.post("/admin/seed", async (req, res): Promise<void> => {
  const existing = await db.select().from(creatorsTable).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Database already has data — seed aborted." });
    return;
  }

  await db.delete(accessLogsTable);
  await db.delete(funscriptsTable);
  await db.delete(creatorsTable);

  const creators = await db
    .insert(creatorsTable)
    .values([
      { name: "Alex Rivera", handle: "alexrivera", bio: "Interactive storyteller & game designer. Making the web playable." },
      { name: "Mia Chen", handle: "miachen", bio: "Digital artist and experience creator. Turning ideas into adventures." },
      { name: "Jordan Blake", handle: "jordanblake", bio: "Escape room designer gone digital. Puzzles, mysteries, and more." },
    ])
    .returning();

  const [alex, mia, jordan] = creators;

  const scripts = await db
    .insert(funscriptsTable)
    .values([
      { creatorId: alex.id, title: "Epic Adventure Script", description: "A sweeping adventure through mythical lands with branching choices.", contentUrl: "https://example.com/epic-adventure", shareToken: "tok_a1b2c3d4", viewCount: 0 },
      { creatorId: alex.id, title: "Mystery Box Challenge", description: "Can you figure out what's in the box? 10 clues, 1 answer.", contentUrl: "https://example.com/mystery-box", shareToken: "tok_e5f6g7h8", viewCount: 0 },
      { creatorId: mia.id, title: "Vibe Check 2025", description: "The ultimate interactive vibe assessment for the new year.", contentUrl: "https://example.com/vibe-check", shareToken: "tok_i9j0k1l2", viewCount: 0 },
      { creatorId: mia.id, title: "Trivia Takeover", description: "50 rapid-fire questions across pop culture, history, and science.", contentUrl: "https://example.com/trivia", shareToken: "tok_m3n4o5p6", viewCount: 0 },
      { creatorId: jordan.id, title: "Escape Room Online", description: "Digital escape room with branching puzzles and multiple endings.", contentUrl: "https://example.com/escape-room", shareToken: "tok_q7r8s9t0", viewCount: 0 },
      { creatorId: jordan.id, title: "Whodunit?", description: "A classic murder mystery where YOU are the detective.", contentUrl: "https://example.com/whodunit", shareToken: "tok_u1v2w3x4", viewCount: 0 },
    ])
    .returning();

  // Daily view counts per script, 30 days (index 0 = 29 days ago)
  const schedule = [
    [2,3,1,4,2,3,5,4,3,6,4,5,3,4,6,5,4,3,5,4,6,5,4,3,2,3,4,5,4,3],
    [1,2,1,2,3,2,1,3,2,3,2,3,4,3,2,3,2,1,2,3,2,3,2,3,2,1,2,3,2,3],
    [8,9,10,11,12,10,11,12,11,12,11,10,12,11,10,9,11,12,10,11,12,11,10,11,12,10,9,11,12,10],
    [1,2,1,1,2,1,2,1,2,2,1,2,1,2,1,2,2,1,2,1,2,1,2,2,1,2,1,1,2,1],
    [5,6,7,6,7,6,5,7,6,7,6,5,7,6,5,6,7,6,5,6,7,6,5,6,7,6,5,6,7,6],
    [1,1,2,1,2,1,1,2,1,2,1,2,1,1,2,1,1,2,1,2,1,1,2,1,2,1,1,2,1,2],
  ];

  const logs: { funScriptId: number; ipAddress: string; userAgent: string; referrer: string | null; accessedAt: Date }[] = [];

  for (let si = 0; si < scripts.length; si++) {
    const days = schedule[si] ?? [];
    for (let offset = 29; offset >= 0; offset--) {
      const count = days[29 - offset] ?? 0;
      for (let i = 0; i < count; i++) {
        logs.push({ funScriptId: scripts[si].id, ipAddress: pick(IPS), userAgent: pick(USER_AGENTS), referrer: pick(REFERRERS), accessedAt: daysAgo(offset) });
      }
    }
  }

  logs.sort(() => Math.random() - 0.5);
  for (let i = 0; i < logs.length; i += 100) {
    await db.insert(accessLogsTable).values(logs.slice(i, i + 100));
  }

  for (let si = 0; si < scripts.length; si++) {
    const total = (schedule[si] ?? []).reduce((a, b) => a + b, 0);
    await db.update(funscriptsTable).set({ viewCount: total }).where(eq(funscriptsTable.id, scripts[si].id));
  }

  res.json({ ok: true, creators: creators.length, scripts: scripts.length, accessLogs: logs.length });
});

export default router;
