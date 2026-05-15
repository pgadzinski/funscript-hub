import { Link } from "wouter";
import { 
  useListCreators, 
  getListCreatorsQueryKey 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function CreatorList() {
  const { data: creators, isLoading } = useListCreators({
    query: { queryKey: getListCreatorsQueryKey() }
  });

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Creators</h2>
          <p className="text-muted-foreground">Manage platform creators</p>
        </div>
        <Link href="/creators/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Creator
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : creators?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border rounded-lg border-dashed">
          <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium">No creators yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Add your first creator to start publishing scripts.</p>
          <Link href="/creators/new">
            <Button variant="outline">Create One Now</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {creators?.map(creator => (
            <Link key={creator.id} href={`/creators/${creator.id}`}>
              <Card className="hover-elevate cursor-pointer transition-all border-border/50 hover:border-primary/50">
                <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
                  <Avatar className="h-12 w-12 border-2 border-background">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {creator.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate">{creator.name}</CardTitle>
                    <CardDescription className="truncate">@{creator.handle}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] mb-4">
                    {creator.bio || 'No bio provided.'}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex gap-4">
                      <div className="flex flex-col">
                        <span className="font-semibold">{creator.scriptCount ?? 0}</span>
                        <span className="text-muted-foreground text-xs uppercase tracking-wider">Scripts</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold">{(creator.totalViews ?? 0).toLocaleString()}</span>
                        <span className="text-muted-foreground text-xs uppercase tracking-wider">Views</span>
                      </div>
                    </div>
                    <div className="text-primary opacity-0 hover-elevate group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="h-4 w-4" />
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
