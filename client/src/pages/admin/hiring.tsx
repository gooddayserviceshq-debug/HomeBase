import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Users, Briefcase, Mail, Phone } from "lucide-react";
import type { JobPosting, JobApplication } from "@shared/schema";

const postingSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().min(10, "Description is required"),
  payRate: z.string().min(1, "Pay rate is required"),
  status: z.enum(["open", "closed"]).default("open"),
});

type PostingFormData = z.infer<typeof postingSchema>;

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  reviewed: "bg-yellow-100 text-yellow-800",
  interviewed: "bg-purple-100 text-purple-800",
  hired: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function HiringPage() {
  const [showPostingDialog, setShowPostingDialog] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: postings = [], isLoading: postingsLoading } = useQuery<JobPosting[]>({
    queryKey: ["/api/admin/jobs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/jobs", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch job postings");
      return res.json();
    },
  });

  const { data: applications = [], isLoading: appsLoading } = useQuery<JobApplication[]>({
    queryKey: ["/api/admin/job-applications", selectedJobId],
    queryFn: async () => {
      const url = selectedJobId
        ? `/api/admin/job-applications?jobId=${selectedJobId}`
        : "/api/admin/job-applications";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch applications");
      return res.json();
    },
  });

  const form = useForm<PostingFormData>({
    resolver: zodResolver(postingSchema),
    defaultValues: { title: "", description: "", payRate: "", status: "open" },
  });

  const createPostingMutation = useMutation({
    mutationFn: async (data: PostingFormData) => {
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create job posting");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs"] });
      toast({ title: "Job Posted", description: "The job posting is now live." });
      setShowPostingDialog(false);
      form.reset();
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const togglePostingMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/admin/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update posting");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs"] }),
  });

  const updateAppMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const res = await fetch(`/api/admin/job-applications/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, notes }),
      });
      if (!res.ok) throw new Error("Failed to update application");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/job-applications", selectedJobId] });
      toast({ title: "Status Updated" });
    },
  });

  const newAppsCount = applications.filter((a) => a.status === "new").length;
  const openPostingsCount = postings.filter((p) => p.status === "open").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Hiring</h2>
          <p className="text-muted-foreground">Manage job postings and applicant pipeline</p>
        </div>
        <Button onClick={() => setShowPostingDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Post Job
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openPostingsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New (Unreviewed)</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{newAppsCount}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="postings">
        <TabsList>
          <TabsTrigger value="postings">Job Postings</TabsTrigger>
          <TabsTrigger value="applications">
            Applications
            {newAppsCount > 0 && (
              <Badge className="ml-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-blue-600">{newAppsCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="postings">
          <Card>
            <CardHeader>
              <CardTitle>Job Postings</CardTitle>
            </CardHeader>
            <CardContent>
              {postingsLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : postings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No job postings yet.</div>
              ) : (
                <div className="space-y-3">
                  {postings.map((posting) => (
                    <div key={posting.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{posting.title}</h3>
                            <Badge variant={posting.status === "open" ? "default" : "secondary"}>
                              {posting.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{posting.payRate}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">{posting.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Posted {new Date(posting.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedJobId(posting.id)}
                          >
                            View Apps
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              togglePostingMutation.mutate({
                                id: posting.id,
                                status: posting.status === "open" ? "closed" : "open",
                              })
                            }
                          >
                            {posting.status === "open" ? "Close" : "Reopen"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Applications</CardTitle>
                  <CardDescription>Review and manage candidates</CardDescription>
                </div>
                <Select
                  value={selectedJobId ?? "all"}
                  onValueChange={(v) => setSelectedJobId(v === "all" ? null : v)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All positions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Positions</SelectItem>
                    {postings.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {appsLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : applications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No applications found.</div>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => (
                    <div key={app.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{app.applicantName}</h3>
                            <Badge className={STATUS_COLORS[app.status] ?? "bg-gray-100 text-gray-800"} variant="secondary">
                              {app.status}
                            </Badge>
                          </div>
                          <div className="flex gap-4 text-sm text-muted-foreground mb-1">
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{app.email}</span>
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{app.phone}</span>
                          </div>
                          <p className="text-sm"><span className="text-muted-foreground">Availability:</span> {app.availability}</p>
                          <p className="text-sm mt-1"><span className="text-muted-foreground">Experience:</span> {app.experience}</p>
                          {app.notes && <p className="text-xs mt-1 bg-muted px-2 py-1 rounded">{app.notes}</p>}
                          <p className="text-xs text-muted-foreground mt-1">Applied {new Date(app.appliedAt).toLocaleDateString()}</p>
                        </div>
                        <Select
                          value={app.status}
                          onValueChange={(status) => updateAppMutation.mutate({ id: app.id, status })}
                        >
                          <SelectTrigger className="w-32 shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="reviewed">Reviewed</SelectItem>
                            <SelectItem value="interviewed">Interviewed</SelectItem>
                            <SelectItem value="hired">Hired</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Posting Dialog */}
      <Dialog open={showPostingDialog} onOpenChange={setShowPostingDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Post a Job</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => createPostingMutation.mutate(d))} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl><Input placeholder="Pressure Washing Technician" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="payRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pay Rate</FormLabel>
                    <FormControl><Input placeholder="$18–$22/hr depending on experience" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the role, responsibilities, and requirements..."
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowPostingDialog(false)}>Cancel</Button>
                <Button type="submit" disabled={createPostingMutation.isPending}>
                  {createPostingMutation.isPending ? "Posting..." : "Post Job"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
