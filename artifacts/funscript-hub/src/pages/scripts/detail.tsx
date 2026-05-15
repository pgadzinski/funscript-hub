import { useParams, Link, useLocation } from "wouter";
import { 
  useGetScript, 
  getGetScriptQueryKey,
  useGetScriptStats,
  getGetScriptStatsQueryKey,
  useListScriptAccesses,
  getListScriptAccessesQueryKey,
  useDeleteScript,
  getListScriptsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Eye, 
  Trash2,
  Share2,
  Users,
  Activity,
  Globe
} from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

export default function ScriptDetail() {
  const { id } = useParams();
  const scriptId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: script, isLoading: scriptLoading } = useGetScript(scriptId, {
    query: { enabled: !!scriptId, queryKey: getGetScriptQueryKey(scriptId) }
  });

  const { data: stats, isLoading: statsLoading } = useGetScriptStats(scriptId, {
    query: { enabled: !!scriptId, queryKey: getGetScriptStatsQueryKey(scriptId) }
  });

  const { data: accesses, isLoading: accessesLoading } = useListScriptAccesses(scriptId, {
    query: { enabled: !!scriptId, queryKey: getListScriptAccessesQueryKey(scriptId) }
  });

  const deleteScript = useDeleteScript();

  function handleDelete() {
    deleteScript.mutate({ id: scriptId }, {
      onSuccess: () => {
        toast({
          title: "Script deleted",
          description: "The script has been removed.",
        });
        queryClient.invalidateQueries({ queryKey: getListScriptsQueryKey() });
        setLocation("/scripts");
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete script.",
        });
        console.error(error);
      }
    });
  }

  const copyShareUrl = () => {
    if (!script) return;
    const url = `${window.location.origin}/s/${script.shareToken}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "URL Copied!",
      description: "Share link copied to clipboard.",
    });
  };

  if (scriptLoading) {
    return (
      <div className="flex-1 space-y-6 p-8 pt-6">
        <Skeleton className="h-8 w-32" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/4" />
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!script) return null;

  const chartData = stats?.dailyCounts.map(d => ({
    date: format(new Date(d.date), "MMM dd"),
    views: d.count
  })) || [];

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/scripts")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{script.title}</h2>
            <div className="text-muted-foreground mt-1">
              By <Link href={`/creators/${script.creatorId}`} className="font-medium hover:text-primary transition-colors">{script.creatorName}</Link>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyShareUrl} className="gap-2">
            <Share2 className="w-4 h-4" /> Share Link
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this script?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the script and all of its analytics data. Subscribers will no longer be able to access the share link.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-10 w-24" /> : (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary">{stats?.totalViews.toLocaleString()}</span>
                <Eye className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Unique Viewers</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-10 w-24" /> : (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{stats?.uniqueIps.toLocaleString()}</span>
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Script Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Description</p>
              <p className="text-sm text-muted-foreground line-clamp-2">{script.description || "No description provided."}</p>
            </div>
            {script.contentUrl && (
              <div>
                <p className="text-sm font-medium mb-1">Content URL</p>
                <a href={script.contentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate block w-full flex items-center gap-1">
                  <Globe className="w-3 h-3 shrink-0"/> {script.contentUrl}
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5"/> Views Over Time</CardTitle>
          <CardDescription>Daily access counts for the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : chartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center border-dashed border-2 rounded-md">
              <span className="text-muted-foreground">No view data available yet</span>
            </div>
          ) : (
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="views" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorViews)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Access Log</CardTitle>
          <CardDescription>Detailed log of recent visits to this script</CardDescription>
        </CardHeader>
        <CardContent>
          {accessesLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : accesses?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-md border-dashed">
              No visits recorded yet. Share the link to get started!
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Device / Browser</TableHead>
                    <TableHead>Referrer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accesses?.map((access) => (
                    <TableRow key={access.id}>
                      <TableCell className="whitespace-nowrap font-medium">
                        {format(new Date(access.accessedAt), "MMM d, HH:mm:ss")}
                      </TableCell>
                      <TableCell>{access.ipAddress || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={access.userAgent || ''}>
                        {access.userAgent || '-'}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground" title={access.referrer || ''}>
                        {access.referrer || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
