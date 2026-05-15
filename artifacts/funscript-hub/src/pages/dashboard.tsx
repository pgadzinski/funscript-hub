import { 
  useGetOverviewStats, 
  getGetOverviewStatsQueryKey,
  useGetTopScripts,
  getGetTopScriptsQueryKey,
  useGetRecentAccesses,
  getGetRecentAccessesQueryKey
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { 
  Users, 
  FileCode2, 
  Eye, 
  Activity,
  ArrowRight,
  Clock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetOverviewStats({
    query: { queryKey: getGetOverviewStatsQueryKey() }
  });

  const { data: topScripts, isLoading: topScriptsLoading } = useGetTopScripts({
    query: { queryKey: getGetTopScriptsQueryKey() }
  });

  const { data: recentAccesses, isLoading: recentAccessesLoading } = useGetRecentAccesses({
    query: { queryKey: getGetRecentAccessesQueryKey() }
  });

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalViews.toLocaleString() ?? 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Views Today</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <div className="text-2xl font-bold text-primary">{stats?.viewsToday.toLocaleString() ?? 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scripts</CardTitle>
            <FileCode2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalScripts.toLocaleString() ?? 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Creators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalCreators.toLocaleString() ?? 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Performing Scripts</CardTitle>
              <CardDescription>Most viewed FunScripts across the platform</CardDescription>
            </div>
            <Link href="/scripts">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {topScriptsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : topScripts?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No scripts found</div>
            ) : (
              <div className="space-y-4">
                {topScripts?.slice(0, 5).map(script => (
                  <div key={script.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Link href={`/scripts/${script.id}`} className="font-medium hover:underline">
                        {script.title}
                      </Link>
                      <div className="text-sm text-muted-foreground">
                        by {script.creatorName}
                      </div>
                    </div>
                    <div className="font-medium">
                      {script.viewCount.toLocaleString()} views
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4" /> Recent Accesses
            </CardTitle>
            <CardDescription>Live feed of script visits</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAccessesLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentAccesses?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No recent activity</div>
            ) : (
              <div className="space-y-4">
                {recentAccesses?.slice(0, 5).map(access => (
                  <div key={access.id} className="flex flex-col space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate max-w-[200px]" title={access.scriptTitle ?? "Unknown"}>
                        {access.scriptTitle}
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(access.accessedAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground flex gap-2">
                      <span>{access.ipAddress || 'Unknown IP'}</span>
                      <span className="truncate">{access.userAgent || 'Unknown Device'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
