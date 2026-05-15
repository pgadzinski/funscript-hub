import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, funscriptsTable, creatorsTable, accessLogsTable } from "@workspace/db";
import { serializeDates } from "../lib/serialize";
import {
  CreateScriptBody,
  GetScriptParams,
  UpdateScriptParams,
  UpdateScriptBody,
  DeleteScriptParams,
  ListScriptsByCreatorParams,
  GetScriptResponse,
  UpdateScriptResponse,
  ListScriptsResponse,
  ListScriptsByCreatorResponse,
} from "@workspace/api-zod";
import { randomBytes } from "crypto";

const router: IRouter = Router();

function generateToken(): string {
  return randomBytes(8).toString("hex");
}

async function getScriptWithCreator(id: number) {
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
    .where(eq(funscriptsTable.id, id));
  return script;
}

router.get("/scripts", async (req, res): Promise<void> => {
  const scripts = await db
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
    .orderBy(funscriptsTable.createdAt);

  res.json(ListScriptsResponse.parse(serializeDates(scripts)));
});

router.get("/creators/:creatorId/scripts", async (req, res): Promise<void> => {
  const params = ListScriptsByCreatorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const scripts = await db
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
    .where(eq(funscriptsTable.creatorId, params.data.creatorId))
    .orderBy(funscriptsTable.createdAt);

  res.json(ListScriptsByCreatorResponse.parse(serializeDates(scripts)));
});

router.post("/scripts", async (req, res): Promise<void> => {
  const parsed = CreateScriptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const shareToken = generateToken();

  const insertData: {
    creatorId: number;
    title: string;
    shareToken: string;
    description?: string;
    contentUrl?: string;
    expiresAt?: Date;
  } = {
    creatorId: parsed.data.creatorId,
    title: parsed.data.title,
    shareToken,
  };

  if (parsed.data.description != null) insertData.description = parsed.data.description;
  if (parsed.data.contentUrl != null) insertData.contentUrl = parsed.data.contentUrl;
  if (parsed.data.expiresAt != null) insertData.expiresAt = new Date(parsed.data.expiresAt);

  const [script] = await db
    .insert(funscriptsTable)
    .values(insertData)
    .returning();

  const full = await getScriptWithCreator(script.id);

  if (!full) {
    res.status(500).json({ error: "Failed to retrieve created script" });
    return;
  }

  res.status(201).json(GetScriptResponse.parse(serializeDates(full)));
});

router.get("/scripts/:id", async (req, res): Promise<void> => {
  const params = GetScriptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const script = await getScriptWithCreator(params.data.id);

  if (!script) {
    res.status(404).json({ error: "FunScript not found" });
    return;
  }

  res.json(GetScriptResponse.parse(serializeDates(script)));
});

router.patch("/scripts/:id", async (req, res): Promise<void> => {
  const params = UpdateScriptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateScriptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: {
    title?: string;
    description?: string | null;
    contentUrl?: string | null;
    expiresAt?: Date | null;
  } = {};

  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.contentUrl !== undefined) updateData.contentUrl = parsed.data.contentUrl;
  if (parsed.data.expiresAt !== undefined) {
    updateData.expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;
  }

  const [updated] = await db
    .update(funscriptsTable)
    .set(updateData)
    .where(eq(funscriptsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "FunScript not found" });
    return;
  }

  const full = await getScriptWithCreator(updated.id);

  if (!full) {
    res.status(500).json({ error: "Failed to retrieve updated script" });
    return;
  }

  res.json(UpdateScriptResponse.parse(serializeDates(full)));
});

router.delete("/scripts/:id", async (req, res): Promise<void> => {
  const params = DeleteScriptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(funscriptsTable)
    .where(eq(funscriptsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "FunScript not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
