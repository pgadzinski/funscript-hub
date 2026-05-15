import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import CreatorList from "@/pages/creators";
import NewCreator from "@/pages/creators/new";
import CreatorDetail from "@/pages/creators/detail";
import ScriptList from "@/pages/scripts";
import NewScript from "@/pages/scripts/new";
import ScriptDetail from "@/pages/scripts/detail";
import PublicScriptView from "@/pages/public/script-view";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/creators" component={CreatorList} />
        <Route path="/creators/new" component={NewCreator} />
        <Route path="/creators/:id" component={CreatorDetail} />
        <Route path="/scripts" component={ScriptList} />
        <Route path="/scripts/new" component={NewScript} />
        <Route path="/scripts/:id" component={ScriptDetail} />
        <Route path="/s/:token" component={PublicScriptView} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
