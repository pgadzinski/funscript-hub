import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  useCreateScript,
  getListScriptsQueryKey,
  useListCreators,
  getListCreatorsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { HandyRecorder, type FunscriptData } from "@/components/handy-recorder";

const formSchema = z.object({
  creatorId: z.coerce.number().min(1, "Creator is required"),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  contentUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewScript() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialCreatorId = searchParams.get("creatorId");

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createScript = useCreateScript();

  const [funscriptData, setFunscriptData] = useState<FunscriptData | null>(null);

  const { data: creators, isLoading: creatorsLoading } = useListCreators({
    query: { queryKey: getListCreatorsQueryKey() }
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      creatorId: initialCreatorId ? parseInt(initialCreatorId, 10) : 0,
      title: "",
      description: "",
      contentUrl: "",
    },
  });

  useEffect(() => {
    if (initialCreatorId && !form.getValues().creatorId) {
      form.setValue("creatorId", parseInt(initialCreatorId, 10));
    }
  }, [initialCreatorId, form]);

  function onSubmit(data: FormValues) {
    const submitData = {
      ...data,
      contentUrl: data.contentUrl || undefined,
      description: data.description || undefined,
      funscriptData: funscriptData ?? undefined,
    };

    createScript.mutate({ data: submitData }, {
      onSuccess: (script) => {
        toast({
          title: "Script created",
          description: "The FunScript has been created and is ready to share.",
        });
        queryClient.invalidateQueries({ queryKey: getListScriptsQueryKey() });
        setLocation(`/scripts/${script.id}`);
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create script. Please try again.",
        });
        console.error(error);
      }
    });
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation(initialCreatorId ? `/creators/${initialCreatorId}` : "/scripts")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">New FunScript</h2>
          <p className="text-muted-foreground">Publish a new script to share with subscribers</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Script Details</CardTitle>
          <CardDescription>
            Provide the details for the interactive content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="creatorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Creator</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(parseInt(val, 10))}
                      defaultValue={field.value ? field.value.toString() : ""}
                      disabled={creatorsLoading || !!initialCreatorId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a creator" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {creators?.map((creator) => (
                          <SelectItem key={creator.id} value={creator.id.toString()}>
                            {creator.name} (@{creator.handle})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Script Title</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g. Epic Rollercoaster Ride" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What is this script about?"
                        className="resize-none h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contentUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/video-or-interactive-content" {...field} />
                    </FormControl>
                    <FormDescription>
                      If provided, this content will be embedded on the public share page.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label className="text-sm font-medium">Handy Recording (Optional)</Label>
                <HandyRecorder
                  onScriptReady={setFunscriptData}
                  initialData={null}
                />
                {funscriptData && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {funscriptData.actions.length} movement points recorded — will be saved with this script
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => setLocation(initialCreatorId ? `/creators/${initialCreatorId}` : "/scripts")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createScript.isPending}>
                  {createScript.isPending ? "Creating..." : "Create Script"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
