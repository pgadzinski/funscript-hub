import { Router, type IRouter } from "express";
import { eq, sql, desc } from "drizzle-orm";
import { db, funscriptsTable, creatorsTable, accessLogsTable } from "@workspace/db";
import {
  GetScriptStatsParams,
  GetScriptStatsResponse,
  GetOverviewStatsResponse,
  GetTopScriptsResponse,
  GetRecentAccessesResponse,
} from "@workspace/api-zod";
import { serializeDates } from "../lib/serialize";

const router: IRouter = Router();

router.get("/scripts/:id/stats", async (req, res): Promise<void> => {
  const params = GetScriptStatsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const totalViewsResult = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(accessLogsTable)
    .where(eq(accessLogsTable.funScriptId, params.data.id));

  const uniqueIpsResult = await db
    .select({ count: sql<number>`cast(count(distinct ${accessLogsTable.ipAddress}) as int)` })
    .from(accessLogsTable)
    .where(eq(accessLogsTable.funScriptId, params.data.id));

  const dailyCountsResult = await db
    .select({
      date: sql<string>`to_char(${accessLogsTable.accessedAt}::date, 'YYYY-MM-DD')`,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(accessLogsTable)
    .where(
      sql`${accessLogsTable.funScriptId} = ${params.data.id} AND ${accessLogsTable.accessedAt} >= now() - interval '30 days'`
    )
    .groupBy(sql`${accessLogsTable.accessedAt}::date`)
    .orderBy(sql`${accessLogsTable.accessedAt}::date`);

  const stats = {
    totalViews: totalViewsResult[0]?.count ?? 0,
    uniqueIps: uniqueIpsResult[0]?.count ?? 0,
    dailyCounts: dailyCountsResult,
  };

  res.json(GetScriptStatsResponse.parse(stats));
});

router.get("/stats/overview", async (_req, res): Promise<void> => {
  const [creatorsCount] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(creatorsTable);

  const [scriptsCount] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(funscriptsTable);

  const [viewsTotal] = await db
    .select({ total: sql<number>`cast(coalesce(sum(${funscriptsTable.viewCount}), 0) as int)` })
    .from(funscriptsTable);

  const [viewsToday] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(accessLogsTable)
    .where(sql`${accessLogsTable.accessedAt}::date = current_date`);

  const stats = {
    totalCreators: creatorsCount?.count ?? 0,
    totalScripts: scriptsCount?.count ?? 0,
    totalViews: viewsTotal?.total ?? 0,
    viewsToday: viewsToday?.count ?? 0,
  };

  res.json(GetOverviewStatsResponse.parse(stats));
});

router.get("/stats/top-scripts", async (_req, res): Promise<void> => {
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
    .orderBy(desc(funscriptsTable.viewCount))
    .limit(10);

  res.json(GetTopScriptsResponse.parse(serializeDates(scripts)));
});

router.get("/stats/recent-accesses", async (_req, res): Promise<void> => {
  const accesses = await db
    .select({
      id: accessLogsTable.id,
      funScriptId: accessLogsTable.funScriptId,
      scriptTitle: funscriptsTable.title,
      shareToken: funscriptsTable.shareToken,
      ipAddress: accessLogsTable.ipAddress,
      userAgent: accessLogsTable.userAgent,
      referrer: accessLogsTable.referrer,
      accessedAt: accessLogsTable.accessedAt,
    })
    .from(accessLogsTable)
    .innerJoin(funscriptsTable, eq(funscriptsTable.id, accessLogsTable.funScriptId))
    .orderBy(desc(accessLogsTable.accessedAt))
    .limit(50);

  res.json(GetRecentAccessesResponse.parse(serializeDates(accesses)));
});

export default router;
