import { Link } from "wouter";
import { 
  useListScripts, 
  getListScriptsQueryKey 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileCode2, ExternalLink, Eye, Share2, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function ScriptList() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  
  const { data: scripts, isLoading } = useListScripts({
    query: { queryKey: getListScriptsQueryKey() }
  });

  const filteredScripts = scripts?.filter(s => 
    s.title.toLowerCase().includes(search.toLowerCase()) || 
    s.creatorName?.toLowerCase().includes(search.toLowerCase())
  );

  const copyShareUrl = (token: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/s/${token}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "URL Copied!",
      description: "Share link copied to clipboard.",
    });
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Scripts</h2>
          <p className="text-muted-foreground">Manage all published FunScripts</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search scripts..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Link href="/scripts/new">
            <Button className="shrink-0">
              <Plus className="mr-2 h-4 w-4" /> New Script
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="flex flex-col">
              <CardHeader className="pb-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="mt-auto">
                <div className="flex justify-between items-center pt-4 border-t mt-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredScripts?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border rounded-lg border-dashed">
          <FileCode2 className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium">No scripts found</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {search ? "Try adjusting your search terms." : "Create your first script to get started."}
          </p>
          {!search && (
            <Link href="/scripts/new">
              <Button variant="outline">Create Script</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredScripts?.map(script => (
            <Link key={script.id} href={`/scripts/${script.id}`}>
              <Card className="flex flex-col h-full hover-elevate cursor-pointer transition-all border-border/50 hover:border-primary/50 group">
                <CardHeader className="pb-4 flex-1">
                  <div className="flex justify-between items-start gap-4">
                    <CardTitle className="line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                      {script.title}
                    </CardTitle>
                    <div className="flex items-center gap-1.5 shrink-0 bg-secondary px-2 py-1 rounded-md text-sm font-medium">
                      <Eye className="w-3.5 h-3.5" />
                      {script.viewCount.toLocaleString()}
                    </div>
                  </div>
                  <CardDescription className="pt-2 flex items-center gap-1.5">
                    By <span className="font-medium text-foreground">{script.creatorName}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                    {script.description || 'No description provided.'}
                  </p>
                  <div className="flex justify-between items-center pt-4 border-t text-xs text-muted-foreground">
                    <span>{format(new Date(script.createdAt), "MMM d, yyyy")}</span>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={(e) => copyShareUrl(script.shareToken, e)}
                        title="Copy Share Link"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        title="View Details"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
