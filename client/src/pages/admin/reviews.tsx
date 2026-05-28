import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Star, Sparkles, CheckCircle2, MessageSquare } from "lucide-react";
import type { GbpReview } from "@shared/schema";

const reviewSchema = z.object({
  reviewerName: z.string().min(1, "Reviewer name is required"),
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().optional(),
  reviewDate: z.string().min(1, "Review date is required"),
  googleReviewId: z.string().optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedReview, setSelectedReview] = useState<GbpReview | null>(null);
  const [replyText, setReplyText] = useState("");
  const [aiReply, setAiReply] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const { toast } = useToast();

  const { data: reviews = [], isLoading } = useQuery<GbpReview[]>({
    queryKey: ["/api/admin/reviews"],
    queryFn: async () => {
      const res = await fetch("/api/admin/reviews", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json();
    },
  });

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      reviewerName: "",
      rating: 5,
      comment: "",
      reviewDate: new Date().toISOString().split("T")[0],
      googleReviewId: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create review");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      toast({ title: "Review Added" });
      setShowAddDialog(false);
      form.reset();
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const replyMutation = useMutation({
    mutationFn: async ({ id, replyText }: { id: string; replyText: string }) => {
      const res = await fetch(`/api/admin/reviews/${id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ replyText }),
      });
      if (!res.ok) throw new Error("Failed to save reply");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      toast({ title: "Reply Saved" });
      setSelectedReview(null);
      setReplyText("");
      setAiReply("");
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const generateReply = async (review: GbpReview) => {
    setAiReply("");
    setAiLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}/suggest-reply`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok || !res.body) throw new Error("Failed to generate reply");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";
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
              if (parsed.text) {
                full += parsed.text;
                setAiReply(full);
              }
            } catch {}
          }
        }
      }
      setReplyText(full);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";
  const unrepliedCount = reviews.filter((r) => !r.replied).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Google Business Reviews</h2>
          <p className="text-muted-foreground">Monitor and respond to customer reviews</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Review
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRating}</div>
            <p className="text-xs text-muted-foreground">{reviews.length} reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Need Reply</CardTitle>
            <MessageSquare className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{unrepliedCount}</div>
            <p className="text-xs text-muted-foreground">unanswered reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">5-Star Reviews</CardTitle>
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviews.filter((r) => r.rating === 5).length}</div>
            <p className="text-xs text-muted-foreground">
              {reviews.length > 0
                ? Math.round((reviews.filter((r) => r.rating === 5).length / reviews.length) * 100) + "%"
                : "0%"} of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Review List */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No reviews yet.</div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{review.reviewerName}</span>
                        <StarRating rating={review.rating} />
                        {review.replied && (
                          <Badge className="bg-green-100 text-green-800" variant="secondary">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Replied
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {new Date(review.reviewDate).toLocaleDateString()}
                      </p>
                      {review.comment && <p className="text-sm mb-2">{review.comment}</p>}
                      {review.replyText && (
                        <div className="bg-muted p-2 rounded text-sm">
                          <span className="font-medium text-xs text-muted-foreground block mb-1">Your reply:</span>
                          {review.replyText}
                        </div>
                      )}
                    </div>
                    {!review.replied && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReview(review);
                          setReplyText("");
                          setAiReply("");
                        }}
                      >
                        Reply
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Review Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Review</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="reviewerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reviewer Name</FormLabel>
                      <FormControl><Input placeholder="John Smith" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating (1–5)</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={5} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="reviewDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Review Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comment (optional)</FormLabel>
                    <FormControl><Textarea rows={3} placeholder="Review text..." {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Adding..." : "Add Review"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      {selectedReview && (
        <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Reply to {selectedReview.reviewerName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <StarRating rating={selectedReview.rating} />
                  <span className="text-sm text-muted-foreground">
                    {new Date(selectedReview.reviewDate).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm">{selectedReview.comment || "(no comment)"}</p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => generateReply(selectedReview)}
                disabled={aiLoading}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {aiLoading ? "Generating AI Reply..." : "Generate AI Reply"}
              </Button>
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Reply</label>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={5}
                  placeholder="Write your response..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedReview(null)}>Cancel</Button>
                <Button
                  onClick={() => replyMutation.mutate({ id: selectedReview.id, replyText })}
                  disabled={!replyText || replyMutation.isPending}
                >
                  {replyMutation.isPending ? "Saving..." : "Save Reply"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
