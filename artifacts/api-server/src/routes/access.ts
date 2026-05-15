import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, funscriptsTable, accessLogsTable, creatorsTable } from "@workspace/db";
import { serializeDates } from "../lib/serialize";
import {
  ListScriptAccessesParams,
  ListScriptAccessesResponse,
  AccessScriptParams,
  AccessScriptResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/scripts/:id/accesses", async (req, res): Promise<void> => {
  const params = ListScriptAccessesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const logs = await db
    .select()
    .from(accessLogsTable)
    .where(eq(accessLogsTable.funScriptId, params.data.id))
    .orderBy(accessLogsTable.accessedAt);

  res.json(ListScriptAccessesResponse.parse(serializeDates(logs)));
});

router.get("/s/:token", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
  const params = AccessScriptParams.safeParse({ token: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [script] = await db
    .select({
      id: funscriptsTable.id,
      creatorId: funscriptsTable.creatorId,
      creatorName: creatorsTable.name,
      creatorHandle: creatorsTable.handle,
      title: funscriptsTable.title,
      description: funscriptsTable.description,
      contentUrl: funscriptsTable.contentUrl,
      shareToken: funscriptsTable.shareToken,
      viewCount: funscriptsTable.viewCount,
      expiresAt: funscriptsTable.expiresAt,
      createdAt: funscriptsTable.createdAt,
      updatedAt: funscriptsTable.updatedAt,
    })
    .from(funscriptsTable)
    .innerJoin(creatorsTable, eq(creatorsTable.id, funscriptsTable.creatorId))
    .where(eq(funscriptsTable.shareToken, params.data.token));

  if (!script) {
    res.status(404).json({ error: "FunScript not found" });
    return;
  }

  // Track the access
  const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket.remoteAddress ?? null;
  const userAgent = req.headers["user-agent"] ?? null;
  const referrer = req.headers["referer"] ?? null;

  await db.insert(accessLogsTable).values({
    funScriptId: script.id,
    ipAddress,
    userAgent,
    referrer,
  });

  // Increment view count
  await db
    .update(funscriptsTable)
    .set({ viewCount: script.viewCount + 1 })
    .where(eq(funscriptsTable.id, script.id));

  const updated = { ...script, viewCount: script.viewCount + 1 };

  res.json(AccessScriptResponse.parse(serializeDates(updated)));
});

export default router;
