import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useCreateCreator, getListCreatorsQueryKey } from "@workspace/api-client-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  handle: z.string().min(1, "Handle is required").max(50).regex(/^[a-zA-Z0-9_]+$/, "Handle can only contain letters, numbers, and underscores"),
  bio: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewCreator() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createCreator = useCreateCreator();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      handle: "",
      bio: "",
    },
  });

  function onSubmit(data: FormValues) {
    createCreator.mutate({ data }, {
      onSuccess: (creator) => {
        toast({
          title: "Creator added",
          description: "The creator profile has been created successfully.",
        });
        queryClient.invalidateQueries({ queryKey: getListCreatorsQueryKey() });
        setLocation(`/creators/${creator.id}`);
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create creator. Please try again.",
        });
        console.error(error);
      }
    });
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/creators")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">New Creator</h2>
          <p className="text-muted-foreground">Add a new creator to the platform</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Creator Profile</CardTitle>
          <CardDescription>
            This information will be displayed on their public script pages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="handle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Handle</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <span className="flex items-center justify-center px-3 border border-r-0 border-input bg-muted text-muted-foreground h-10 rounded-l-md text-sm">@</span>
                        <Input placeholder="janedoe" className="rounded-l-none" {...field} />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Used in URLs and mentions. Alphanumeric characters only.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us a little bit about this creator" 
                        className="resize-none h-24" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setLocation("/creators")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCreator.isPending}>
                  {createCreator.isPending ? "Creating..." : "Create Creator"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
