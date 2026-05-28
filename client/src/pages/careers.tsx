import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Briefcase, DollarSign, CheckCircle } from "lucide-react";
import type { JobPosting } from "@shared/schema";

const applicationSchema = z.object({
  applicantName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  experience: z.string().min(10, "Please describe your experience"),
  availability: z.string().min(2, "Please describe your availability"),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

export default function CareersPage() {
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const { data: postings = [], isLoading } = useQuery<JobPosting[]>({
    queryKey: ["/api/jobs"],
  });

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      applicantName: "", email: "", phone: "", experience: "", availability: "",
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (data: ApplicationFormData) => {
      if (!selectedJob) throw new Error("No job selected");
      const res = await fetch(`/api/jobs/${selectedJob.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit application");
      }
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openApplication = (job: JobPosting) => {
    setSelectedJob(job);
    setSubmitted(false);
    form.reset();
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Join the Good Day Team</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          We're a growing pressure washing and restoration company in Murfreesboro, TN.
          We offer competitive pay, flexible schedules, and a great team culture.
        </p>
      </div>

      {/* Why Work With Us */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {[
          { title: "Competitive Pay", desc: "We pay above market rates and reward quality work." },
          { title: "Flexible Schedule", desc: "Work-life balance matters — we work with your schedule." },
          { title: "Growth Opportunity", desc: "Learn new skills and grow with a company that invests in you." },
        ].map((item) => (
          <Card key={item.title}>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Open Positions */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Open Positions</h2>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading positions...</div>
        ) : postings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p className="text-lg font-medium mb-2">No open positions right now</p>
              <p className="text-sm">Check back soon or email us your resume at jobs@gooddaypressurewashing.com</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {postings.map((posting) => (
              <Card key={posting.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold">{posting.title}</h3>
                        <Badge className="bg-green-100 text-green-800" variant="secondary">Hiring Now</Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                        <DollarSign className="w-4 h-4" />
                        <span>{posting.payRate}</span>
                      </div>
                      <p className="text-muted-foreground whitespace-pre-line">{posting.description}</p>
                    </div>
                    <Button onClick={() => openApplication(posting)} className="shrink-0">
                      Apply Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Application Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={(open) => { if (!open) { setSelectedJob(null); setSubmitted(false); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply for {selectedJob?.title}</DialogTitle>
          </DialogHeader>

          {submitted ? (
            <div className="text-center py-6 space-y-4">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
              <h3 className="text-xl font-bold">Application Submitted!</h3>
              <p className="text-muted-foreground">
                Thank you for applying. We'll review your application and reach out soon.
                A confirmation email has been sent to your inbox.
              </p>
              <Button onClick={() => { setSelectedJob(null); setSubmitted(false); }}>
                Close
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit((d) => applyMutation.mutate(d))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="applicantName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl><Input placeholder="John Smith" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl><Input placeholder="(615) 555-0100" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" placeholder="you@email.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relevant Experience</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Describe any relevant work experience, pressure washing, outdoor work, etc."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="availability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Availability</FormLabel>
                      <FormControl>
                        <Input placeholder="Weekdays, weekends, full-time, part-time..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setSelectedJob(null)}>Cancel</Button>
                  <Button type="submit" disabled={applyMutation.isPending}>
                    {applyMutation.isPending ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
