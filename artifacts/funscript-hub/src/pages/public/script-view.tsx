import { useParams, Link } from "wouter";
import { 
  useAccessScript, 
  getAccessScriptQueryKey 
} from "@workspace/api-client-react";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PublicScriptView() {
  const { token } = useParams();

  const { data: script, isLoading, error } = useAccessScript(token || "", {
    query: { 
      enabled: !!token, 
      queryKey: getAccessScriptQueryKey(token || ""),
      retry: false
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-50">
        <Activity className="h-12 w-12 text-zinc-500 animate-pulse mb-6" />
        <div className="h-6 w-48 bg-zinc-800 rounded animate-pulse mb-4"></div>
        <div className="h-4 w-64 bg-zinc-800 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error || !script) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-50 p-6 text-center">
        <div className="max-w-md w-full p-8 border border-zinc-800 rounded-xl bg-zinc-900/50 backdrop-blur-sm">
          <Activity className="h-12 w-12 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-2">Script Not Found</h1>
          <p className="text-zinc-400 mb-8">
            This link may be invalid or has expired. Please check the URL and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-zinc-950 text-zinc-50 font-sans selection:bg-primary/30">
      <header className="flex items-center justify-between p-4 border-b border-zinc-800/50 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/30">
            {script.creatorName ? script.creatorName.slice(0, 1).toUpperCase() : 'C'}
          </div>
          <div>
            <h1 className="font-semibold leading-tight text-zinc-100">{script.title}</h1>
            <p className="text-xs text-zinc-400">by {script.creatorName}</p>
          </div>
        </div>
        <div className="hidden sm:flex">
          <Button variant="outline" className="border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100" asChild>
            <a href={`https://twitter.com/${script.creatorHandle}`} target="_blank" rel="noreferrer">
              Follow @{script.creatorHandle}
            </a>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-4 sm:p-8">
        <div className="mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">{script.title}</h2>
          {script.description && (
            <p className="text-lg text-zinc-400 max-w-3xl leading-relaxed">
              {script.description}
            </p>
          )}
        </div>

        {script.contentUrl ? (
          <div className="flex-1 w-full flex flex-col rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900/30 shadow-2xl relative group min-h-[400px]">
            {/* If it's a known embed type we could parse it, but for safety we use an iframe or link */}
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-0">
              <Activity className="h-8 w-8 text-zinc-800 animate-pulse" />
            </div>
            <iframe 
              src={script.contentUrl} 
              className="w-full h-full min-h-[500px] border-0 z-10 relative bg-transparent"
              title={script.title}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
            
            <div className="absolute bottom-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="sm" variant="secondary" asChild className="shadow-lg backdrop-blur-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-100">
                <a href={script.contentUrl} target="_blank" rel="noreferrer">Open in new tab</a>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 w-full flex flex-col items-center justify-center rounded-xl border border-zinc-800 border-dashed bg-zinc-900/20 p-12 text-center min-h-[400px]">
            <Activity className="h-16 w-16 text-primary/40 mb-6" />
            <h3 className="text-xl font-semibold text-zinc-200 mb-2">Content Ready</h3>
            <p className="text-zinc-500 max-w-md">
              This script has been accessed successfully, but no embedded visual content was provided by the creator.
            </p>
          </div>
        )}
      </main>
      
      <footer className="py-6 text-center text-zinc-600 text-sm border-t border-zinc-800/50 mt-auto">
        Powered by FunScript Hub
      </footer>
    </div>
  );
}
