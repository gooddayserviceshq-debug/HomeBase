import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Download, DollarSign, Receipt, TrendingDown } from "lucide-react";
import type { Expense } from "@shared/schema";

const IRS_MILEAGE = { 2024: 0.67, 2025: 0.70 };

const expenseSchema = z.object({
  date: z.string().min(1, "Date is required"),
  category: z.enum(["fuel", "supplies", "equipment", "insurance", "marketing", "other"]),
  vendor: z.string().min(1, "Vendor is required"),
  amount: z.string().regex(/^\d+\.?\d{0,2}$/, "Invalid amount"),
  description: z.string().optional(),
  mileage: z.string().optional(),
  taxDeductible: z.boolean().default(true),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

const CATEGORY_COLORS: Record<string, string> = {
  fuel: "bg-orange-100 text-orange-800",
  supplies: "bg-blue-100 text-blue-800",
  equipment: "bg-purple-100 text-purple-800",
  insurance: "bg-green-100 text-green-800",
  marketing: "bg-pink-100 text-pink-800",
  other: "bg-gray-100 text-gray-800",
};

export default function TaxesPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterQuarter, setFilterQuarter] = useState("all");
  const { toast } = useToast();

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/admin/expenses"],
    queryFn: async () => {
      const res = await fetch("/api/admin/expenses", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch expenses");
      return res.json();
    },
  });

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      category: "supplies",
      vendor: "",
      amount: "",
      description: "",
      mileage: "",
      taxDeductible: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const res = await fetch("/api/admin/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create expense");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/expenses"] });
      toast({ title: "Expense Added", description: "The expense has been recorded." });
      setShowDialog(false);
      form.reset();
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/expenses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete expense");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/expenses"] });
      toast({ title: "Expense Deleted" });
    },
  });

  const getQuarter = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    return Math.ceil((d.getMonth() + 1) / 3);
  };

  const getYear = (dateStr: string | Date) => new Date(dateStr).getFullYear();

  const filteredExpenses = expenses.filter((e) => {
    const y = getYear(e.date);
    const q = getQuarter(e.date);
    if (y.toString() !== filterYear) return false;
    if (filterQuarter !== "all" && q.toString() !== filterQuarter) return false;
    return true;
  });

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const deductibleExpenses = filteredExpenses.filter((e) => e.taxDeductible).reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const mileageDeduction = filteredExpenses.reduce((sum, e) => {
    if (!e.mileage) return sum;
    const year = getYear(e.date);
    const rate = (IRS_MILEAGE as any)[year] ?? 0.67;
    return sum + parseFloat(e.mileage) * rate;
  }, 0);

  const quarterlyData = [1, 2, 3, 4].map((q) => {
    const qExpenses = expenses.filter((e) => getYear(e.date).toString() === filterYear && getQuarter(e.date) === q);
    const total = qExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const deductible = qExpenses.filter((e) => e.taxDeductible).reduce((sum, e) => sum + parseFloat(e.amount), 0);
    return { quarter: q, total, deductible, count: qExpenses.length };
  });

  const exportCSV = () => {
    const headers = ["Date", "Category", "Vendor", "Amount", "Description", "Mileage", "Tax Deductible"];
    const rows = filteredExpenses.map((e) => [
      new Date(e.date).toLocaleDateString(),
      e.category,
      e.vendor,
      e.amount,
      e.description ?? "",
      e.mileage ?? "",
      e.taxDeductible ? "Yes" : "No",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${filterYear}${filterQuarter !== "all" ? `-Q${filterQuarter}` : ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Expense & Tax Tracker</h2>
          <p className="text-muted-foreground">Track business expenses and estimate quarterly taxes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2023, 2024, 2025, 2026].map((y) => (
              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterQuarter} onValueChange={setFilterQuarter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Quarters</SelectItem>
            <SelectItem value="1">Q1 (Jan–Mar)</SelectItem>
            <SelectItem value="2">Q2 (Apr–Jun)</SelectItem>
            <SelectItem value="3">Q3 (Jul–Sep)</SelectItem>
            <SelectItem value="4">Q4 (Oct–Dec)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{filteredExpenses.length} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tax Deductible</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${deductibleExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">+ ${mileageDeduction.toFixed(2)} mileage deduction</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Tax Savings</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${((deductibleExpenses + mileageDeduction) * 0.25).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Based on ~25% effective rate</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="expenses">
        <TabsList>
          <TabsTrigger value="expenses">Expense Log</TabsTrigger>
          <TabsTrigger value="quarterly">Quarterly Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Expenses</CardTitle>
              <CardDescription>
                IRS mileage rate: {filterYear === "2024" ? "67¢" : "70¢"}/mile for {filterYear}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : filteredExpenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No expenses found for this period.</div>
              ) : (
                <div className="space-y-2">
                  {filteredExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{expense.vendor}</span>
                            <Badge className={CATEGORY_COLORS[expense.category] ?? "bg-gray-100 text-gray-800"} variant="secondary">
                              {expense.category}
                            </Badge>
                            {!expense.taxDeductible && <Badge variant="outline">Non-deductible</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(expense.date).toLocaleDateString()}
                            {expense.description && ` · ${expense.description}`}
                            {expense.mileage && ` · ${expense.mileage} miles`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">${parseFloat(expense.amount).toFixed(2)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(expense.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quarterly">
          <Card>
            <CardHeader>
              <CardTitle>Quarterly Summary {filterYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quarterlyData.map((q) => (
                  <Card key={q.quarter} className="border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Q{q.quarter} {filterYear}</CardTitle>
                      <CardDescription>
                        {["Jan–Mar", "Apr–Jun", "Jul–Sep", "Oct–Dec"][q.quarter - 1]}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Expenses</span>
                        <span className="font-medium">${q.total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Deductible</span>
                        <span className="font-medium text-green-600">${q.deductible.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transactions</span>
                        <span className="font-medium">{q.count}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Expense Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount ($)</FormLabel>
                      <FormControl><Input placeholder="0.00" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {["fuel", "supplies", "equipment", "insurance", "marketing", "other"].map((c) => (
                            <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vendor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor</FormLabel>
                      <FormControl><Input placeholder="Shell Gas, Home Depot..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl><Input placeholder="Brief description" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="mileage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mileage (optional)</FormLabel>
                      <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="taxDeductible"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 pt-6">
                      <FormControl>
                        <input type="checkbox" checked={field.value} onChange={field.onChange} className="rounded" />
                      </FormControl>
                      <FormLabel className="!mt-0">Tax Deductible</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Saving..." : "Add Expense"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
