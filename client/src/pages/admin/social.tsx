import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Sparkles, Instagram, Video } from "lucide-react";
import type { SocialPost } from "@shared/schema";

const postSchema = z.object({
  platform: z.enum(["instagram", "tiktok", "google_business"]),
  content: z.string().min(1, "Content is required"),
  mediaUrl: z.string().optional(),
  scheduledAt: z.string().optional(),
  status: z.enum(["draft", "scheduled", "posted"]).default("draft"),
  hashtags: z.string().optional(),
});

type PostFormData = z.infer<typeof postSchema>;

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  scheduled: "bg-blue-100 text-blue-800",
  posted: "bg-green-100 text-green-800",
};

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  instagram: <Instagram className="w-4 h-4" />,
  tiktok: <Video className="w-4 h-4" />,
  google_business: <span className="text-xs font-bold">G</span>,
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function SocialPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [aiIdeas, setAiIdeas] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const { toast } = useToast();

  const { data: posts = [], isLoading } = useQuery<SocialPost[]>({
    queryKey: ["/api/admin/social-posts"],
    queryFn: async () => {
      const res = await fetch("/api/admin/social-posts", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    },
  });

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      platform: "instagram",
      content: "",
      mediaUrl: "",
      scheduledAt: "",
      status: "draft",
      hashtags: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PostFormData) => {
      const payload = {
        ...data,
        hashtags: data.hashtags ? data.hashtags.split(" ").filter(Boolean) : [],
      };
      const res = await fetch("/api/admin/social-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create post");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/social-posts"] });
      toast({ title: "Post Created" });
      setShowDialog(false);
      form.reset();
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/social-posts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete post");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/social-posts"] });
      toast({ title: "Post Deleted" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/admin/social-posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update post");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/social-posts"] }),
  });

  const generateIdeas = async () => {
    setAiIdeas("");
    setAiLoading(true);
    try {
      const res = await fetch("/api/admin/social-posts/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ platform: "Instagram" }),
      });
      if (!res.ok || !res.body) throw new Error("Failed to generate ideas");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) setAiIdeas((prev) => prev + parsed.text);
            } catch {}
          }
        }
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  // Calendar view
  const [year, month] = viewMonth.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();

  const postsInMonth = posts.filter((p) => {
    if (!p.scheduledAt) return false;
    const d = new Date(p.scheduledAt);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });

  const postsByDay: Record<number, SocialPost[]> = {};
  postsInMonth.forEach((p) => {
    const day = new Date(p.scheduledAt!).getDate();
    if (!postsByDay[day]) postsByDay[day] = [];
    postsByDay[day].push(p);
  });

  const changeMonth = (dir: number) => {
    const d = new Date(year, month - 1 + dir, 1);
    setViewMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Social Media Calendar</h2>
          <p className="text-muted-foreground">Plan and schedule content across platforms</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateIdeas} disabled={aiLoading}>
            <Sparkles className="w-4 h-4 mr-2" />
            {aiLoading ? "Generating..." : "AI Ideas"}
          </Button>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      {/* AI Ideas Panel */}
      {(aiIdeas || aiLoading) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              AI Post Ideas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm font-sans">{aiIdeas || "Generating..."}</pre>
          </CardContent>
        </Card>
      )}

      {/* Monthly Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{MONTHS[month - 1]} {year}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => changeMonth(-1)}>Prev</Button>
              <Button variant="outline" size="sm" onClick={() => changeMonth(1)}>Next</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-1 font-medium">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayPosts = postsByDay[day] ?? [];
              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() + 1 === month &&
                new Date().getFullYear() === year;
              return (
                <div
                  key={day}
                  className={`min-h-[60px] p-1 rounded border text-xs ${isToday ? "border-blue-400 bg-blue-50" : "border-transparent hover:border-gray-200"}`}
                >
                  <div className={`font-medium mb-1 ${isToday ? "text-blue-600" : ""}`}>{day}</div>
                  <div className="space-y-0.5">
                    {dayPosts.map((p) => (
                      <div
                        key={p.id}
                        className="truncate px-1 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800"
                      >
                        {p.platform === "instagram" ? "IG" : p.platform === "tiktok" ? "TT" : "GB"}: {p.content.slice(0, 15)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Post List */}
      <Card>
        <CardHeader>
          <CardTitle>All Posts</CardTitle>
          <CardDescription>{posts.length} total posts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No posts yet.</div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <div key={post.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-muted-foreground">{PLATFORM_ICONS[post.platform]}</span>
                        <span className="text-sm font-medium capitalize">{post.platform.replace("_", " ")}</span>
                        <Badge className={STATUS_COLORS[post.status]} variant="secondary">{post.status}</Badge>
                        {post.scheduledAt && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(post.scheduledAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm line-clamp-2">{post.content}</p>
                      {post.hashtags && post.hashtags.length > 0 && (
                        <p className="text-xs text-blue-600 mt-1">{post.hashtags.join(" ")}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Select
                        value={post.status}
                        onValueChange={(s) => updateStatusMutation.mutate({ id: post.id, status: s })}
                      >
                        <SelectTrigger className="h-7 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="posted">Posted</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(post.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Post Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Post</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="tiktok">TikTok</SelectItem>
                          <SelectItem value="google_business">Google Business</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="posted">Posted</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Write your post caption..." rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hashtags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hashtags (space-separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="#pressurewashing #murfreesboro #curb appeal" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule Date (optional)</FormLabel>
                    <FormControl><Input type="datetime-local" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Post"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
