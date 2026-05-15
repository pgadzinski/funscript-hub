import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, creatorsTable, funscriptsTable } from "@workspace/db";
import { serializeDates } from "../lib/serialize";
import {
  CreateCreatorBody,
  GetCreatorParams,
  UpdateCreatorParams,
  UpdateCreatorBody,
  DeleteCreatorParams,
  GetCreatorResponse,
  UpdateCreatorResponse,
  ListCreatorsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/creators", async (req, res): Promise<void> => {
  const creators = await db
    .select({
      id: creatorsTable.id,
      name: creatorsTable.name,
      handle: creatorsTable.handle,
      bio: creatorsTable.bio,
      createdAt: creatorsTable.createdAt,
      updatedAt: creatorsTable.updatedAt,
      scriptCount: sql<number>`cast(count(distinct ${funscriptsTable.id}) as int)`,
      totalViews: sql<number>`cast(coalesce(sum(${funscriptsTable.viewCount}), 0) as int)`,
    })
    .from(creatorsTable)
    .leftJoin(funscriptsTable, eq(funscriptsTable.creatorId, creatorsTable.id))
    .groupBy(creatorsTable.id)
    .orderBy(creatorsTable.createdAt);

  res.json(ListCreatorsResponse.parse(serializeDates(creators)));
});

router.post("/creators", async (req, res): Promise<void> => {
  const parsed = CreateCreatorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [creator] = await db.insert(creatorsTable).values(parsed.data).returning();

  const enriched = {
    ...creator,
    scriptCount: 0,
    totalViews: 0,
  };

  res.status(201).json(GetCreatorResponse.parse(serializeDates(enriched)));
});

router.get("/creators/:id", async (req, res): Promise<void> => {
  const params = GetCreatorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [creator] = await db
    .select({
      id: creatorsTable.id,
      name: creatorsTable.name,
      handle: creatorsTable.handle,
      bio: creatorsTable.bio,
      createdAt: creatorsTable.createdAt,
      updatedAt: creatorsTable.updatedAt,
      scriptCount: sql<number>`cast(count(distinct ${funscriptsTable.id}) as int)`,
      totalViews: sql<number>`cast(coalesce(sum(${funscriptsTable.viewCount}), 0) as int)`,
    })
    .from(creatorsTable)
    .leftJoin(funscriptsTable, eq(funscriptsTable.creatorId, creatorsTable.id))
    .where(eq(creatorsTable.id, params.data.id))
    .groupBy(creatorsTable.id);

  if (!creator) {
    res.status(404).json({ error: "Creator not found" });
    return;
  }

  res.json(GetCreatorResponse.parse(serializeDates(creator)));
});

router.patch("/creators/:id", async (req, res): Promise<void> => {
  const params = UpdateCreatorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCreatorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(creatorsTable)
    .set(parsed.data)
    .where(eq(creatorsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Creator not found" });
    return;
  }

  const enriched = {
    ...updated,
    scriptCount: 0,
    totalViews: 0,
  };

  res.json(UpdateCreatorResponse.parse(serializeDates(enriched)));
});

router.delete("/creators/:id", async (req, res): Promise<void> => {
  const params = DeleteCreatorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(creatorsTable)
    .where(eq(creatorsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Creator not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
