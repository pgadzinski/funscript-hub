import { useParams, Link, useLocation } from "wouter";
import { 
  useGetCreator, 
  getGetCreatorQueryKey,
  useListScriptsByCreator,
  getListScriptsByCreatorQueryKey,
  useDeleteCreator,
  getListCreatorsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Eye, 
  FileCode2, 
  Calendar,
  Trash2,
  ExternalLink,
  Plus
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

export default function CreatorDetail() {
  const { id } = useParams();
  const creatorId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: creator, isLoading: creatorLoading } = useGetCreator(creatorId, {
    query: { enabled: !!creatorId, queryKey: getGetCreatorQueryKey(creatorId) }
  });

  const { data: scripts, isLoading: scriptsLoading } = useListScriptsByCreator(creatorId, {
    query: { enabled: !!creatorId, queryKey: getListScriptsByCreatorQueryKey(creatorId) }
  });

  const deleteCreator = useDeleteCreator();

  function handleDelete() {
    deleteCreator.mutate({ id: creatorId }, {
      onSuccess: () => {
        toast({
          title: "Creator deleted",
          description: "The creator has been removed from the platform.",
        });
        queryClient.invalidateQueries({ queryKey: getListCreatorsQueryKey() });
        setLocation("/creators");
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete creator.",
        });
        console.error(error);
      }
    });
  }

  if (creatorLoading) {
    return (
      <div className="flex-1 space-y-6 p-8 pt-6">
        <Skeleton className="h-8 w-32" />
        <Card>
          <CardHeader className="flex flex-row items-start gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-24" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3 mt-2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!creator) return null;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/creators")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Creator Profile</h2>
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete <strong>{creator.name}</strong> and all of their scripts.
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

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-background">
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {creator.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{creator.name}</CardTitle>
                <CardDescription className="text-base text-primary">@{creator.handle}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-1 text-sm">
              <p className="font-medium text-muted-foreground uppercase tracking-wider text-xs">Bio</p>
              <p>{creator.bio || "No bio provided."}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-1">
                <p className="font-medium text-muted-foreground uppercase tracking-wider text-xs flex items-center gap-1"><FileCode2 className="w-3 h-3"/> Scripts</p>
                <p className="text-2xl font-bold">{creator.scriptCount}</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-muted-foreground uppercase tracking-wider text-xs flex items-center gap-1"><Eye className="w-3 h-3"/> Total Views</p>
                <p className="text-2xl font-bold">{creator.totalViews?.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="pt-4 border-t text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Joined {format(new Date(creator.createdAt), "MMM d, yyyy")}
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Published Scripts</h3>
            <Link href={`/scripts/new?creatorId=${creator.id}`}>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" /> New Script
              </Button>
            </Link>
          </div>

          {scriptsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : scripts?.length === 0 ? (
            <Card className="border-dashed bg-muted/20">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FileCode2 className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium">No scripts yet</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">This creator hasn't published any scripts.</p>
                <Link href={`/scripts/new?creatorId=${creator.id}`}>
                  <Button variant="outline" size="sm">Create First Script</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {scripts?.map(script => (
                <Card key={script.id} className="hover-elevate transition-all border-border/50 hover:border-primary/50">
                  <div className="flex items-center justify-between p-4">
                    <div className="space-y-1">
                      <Link href={`/scripts/${script.id}`} className="font-semibold text-lg hover:underline decoration-primary underline-offset-4">
                        {script.title}
                      </Link>
                      <p className="text-sm text-muted-foreground line-clamp-1 max-w-md">
                        {script.description || 'No description'}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-bold">{script.viewCount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Views</p>
                      </div>
                      <Link href={`/scripts/${script.id}`}>
                        <Button variant="ghost" size="icon">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
