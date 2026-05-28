import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Plus, Package, ShoppingCart, DollarSign, Users,
  Edit, Trash2, Eye, MoreVertical, TrendingUp, Calendar,
  Receipt, Layers, Briefcase, Instagram, Star, Home, BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import type { Product, Order, Category, Booking, Customer, Service } from "@shared/schema";
import { AdvertisingBuilder } from "@/components/AdvertisingBuilder";

// New section pages
import TaxesPage from "./taxes";
import InventoryPage from "./inventory";
import HiringPage from "./hiring";
import SocialPage from "./social";
import ReviewsPage from "./reviews";

type BookingWithDetails = Booking & { customer: Customer; service: Service };

interface OrderWithDetails extends Order {
  items: any[];
}

const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.string().regex(/^\d+\.?\d{0,2}$/, "Invalid price format"),
  categoryId: z.string().min(1, "Category is required"),
  stockQuantity: z.coerce.number().min(0, "Stock must be 0 or greater"),
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
  sku: z.string().min(1, "SKU is required"),
});

type ProductFormData = z.infer<typeof productSchema>;

type AdminSection =
  | "overview"
  | "products"
  | "orders"
  | "bookings"
  | "advertising"
  | "taxes"
  | "inventory"
  | "hiring"
  | "social"
  | "reviews";

const NAV_ITEMS: { key: AdminSection; label: string; icon: React.ReactNode; badge?: string }[] = [
  { key: "overview", label: "Overview", icon: <Home className="w-4 h-4" /> },
  { key: "bookings", label: "Bookings", icon: <Calendar className="w-4 h-4" /> },
  { key: "orders", label: "Orders", icon: <ShoppingCart className="w-4 h-4" /> },
  { key: "products", label: "Products", icon: <Package className="w-4 h-4" /> },
  { key: "taxes", label: "Expenses & Tax", icon: <Receipt className="w-4 h-4" /> },
  { key: "inventory", label: "Inventory", icon: <Layers className="w-4 h-4" /> },
  { key: "hiring", label: "Hiring", icon: <Briefcase className="w-4 h-4" /> },
  { key: "social", label: "Social Media", icon: <Instagram className="w-4 h-4" /> },
  { key: "reviews", label: "Reviews", icon: <Star className="w-4 h-4" /> },
  { key: "advertising", label: "Advertising", icon: <BarChart3 className="w-4 h-4" /> },
];

export default function AdminDashboard() {
  const [section, setSection] = useState<AdminSection>("overview");
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const { toast } = useToast();

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/stats", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch bookings
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/admin/bookings"],
    queryFn: async () => {
      const response = await fetch("/api/admin/bookings", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch bookings");
      return response.json();
    },
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/admin/bookings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update booking");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      toast({ title: "Booking Updated", description: "The booking status has been updated." });
    },
  });

  // Fetch orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/admin/orders"],
    queryFn: async () => {
      const response = await fetch("/api/admin/orders", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json();
    },
  });

  // Inventory for low-stock badge
  const { data: inventoryItems = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/inventory"],
    queryFn: async () => {
      const res = await fetch("/api/admin/inventory", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  // New applications count for badge
  const { data: jobApplications = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/job-applications"],
    queryFn: async () => {
      const res = await fetch("/api/admin/job-applications", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const lowStockCount = inventoryItems.filter(
    (i: any) => parseFloat(i.quantityOnHand) <= parseFloat(i.reorderPoint)
  ).length;
  const newAppsCount = jobApplications.filter((a: any) => a.status === "new").length;

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", description: "", price: "", categoryId: "", stockQuantity: 0, imageUrl: "", sku: "" },
  });

  const saveProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : "/api/admin/products";
      const response = await fetch(url, {
        method: editingProduct ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save product");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: editingProduct ? "Product Updated" : "Product Created" });
      setShowProductDialog(false);
      setEditingProduct(null);
      form.reset();
    },
    onError: (error) => toast({ title: "Save Failed", description: error.message, variant: "destructive" }),
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/products/${id}`, { method: "DELETE", credentials: "include" });
      if (!response.ok) throw new Error("Failed to delete product");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product Deleted" });
    },
    onError: (error) => toast({ title: "Delete Failed", description: error.message, variant: "destructive" }),
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/admin/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update order");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Order Updated" });
      setSelectedOrder(null);
    },
  });

  const openProductDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      form.reset({
        name: product.name,
        description: product.description || "",
        price: product.price,
        categoryId: product.categoryId || "",
        stockQuantity: product.stockQuantity,
        imageUrl: product.imageUrl || "",
        sku: product.sku || "",
      });
    } else {
      setEditingProduct(null);
      form.reset();
    }
    setShowProductDialog(true);
  };

  // Build nav items with dynamic badges
  const navItemsWithBadges = NAV_ITEMS.map((item) => {
    if (item.key === "inventory" && lowStockCount > 0) return { ...item, badge: String(lowStockCount) };
    if (item.key === "hiring" && newAppsCount > 0) return { ...item, badge: String(newAppsCount) };
    return item;
  });

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 border-r bg-background shrink-0 hidden md:flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Admin</h2>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItemsWithBadges.map((item) => (
            <button
              key={item.key}
              onClick={() => setSection(item.key)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors ${
                section === item.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                {item.icon}
                {item.label}
              </span>
              {item.badge && (
                <Badge className="h-5 min-w-5 flex items-center justify-center p-0 text-xs bg-orange-500 text-white">
                  {item.badge}
                </Badge>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden w-full border-b overflow-x-auto">
        <div className="flex gap-1 p-2">
          {navItemsWithBadges.map((item) => (
            <button
              key={item.key}
              onClick={() => setSection(item.key)}
              className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                section === item.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
              }`}
            >
              {item.icon}
              {item.label}
              {item.badge && <span className="bg-orange-500 text-white rounded-full px-1 text-[10px]">{item.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {/* Overview */}
        {section === "overview" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-1">Admin Dashboard</h1>
              <p className="text-muted-foreground">Business overview and quick stats</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats?.totalRevenue?.toFixed(2) || "0.00"}</div>
                  <p className="text-xs text-muted-foreground"><TrendingUp className="inline h-3 w-3 mr-1" />Product orders</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
                  <p className="text-xs text-muted-foreground">{stats?.pendingOrders || 0} pending</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{products.length}</div>
                  <p className="text-xs text-muted-foreground">{products.filter(p => p.stockQuantity === 0).length} out of stock</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Customers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalCustomers || 0}</div>
                  <p className="text-xs text-muted-foreground">{stats?.newCustomersThisMonth || 0} new this month</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest 5 orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{order.orderNumber}</p>
                        <p className="text-sm text-muted-foreground">{order.name} — ${order.total}</p>
                      </div>
                      <Badge variant={order.status === "completed" ? "default" : order.status === "processing" ? "secondary" : order.status === "pending" ? "outline" : "destructive"}>
                        {order.status}
                      </Badge>
                    </div>
                  ))}
                  {orders.length === 0 && <p className="text-muted-foreground text-sm">No orders yet.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Products */}
        {section === "products" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Products</h2>
                <p className="text-muted-foreground">Manage your product inventory</p>
              </div>
              <Button onClick={() => openProductDialog()} data-testid="button-add-product">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
            <Card>
              <CardContent className="pt-6">
                {productsLoading ? (
                  <div className="text-center py-8">Loading products...</div>
                ) : products.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No products found.</div>
                ) : (
                  <div className="space-y-4">
                    {products.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          {product.imageUrl && (
                            <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded" />
                          )}
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">SKU: {product.sku} | Stock: {product.stockQuantity}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">${product.price}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-product-menu-${product.id}`}>
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openProductDialog(product)}>
                                <Edit className="w-4 h-4 mr-2" />Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => deleteProductMutation.mutate(product.id)} className="text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" />Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bookings */}
        {section === "bookings" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Service Bookings</h2>
              <p className="text-muted-foreground">Appointments booked through the online booking system</p>
            </div>
            <Card>
              <CardContent className="pt-6">
                {bookingsLoading ? (
                  <div className="text-center py-8">Loading bookings...</div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No bookings yet.</div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="flex items-start justify-between p-4 border rounded-lg gap-4">
                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{booking.bookingNumber}</p>
                              <Badge variant={booking.status === "completed" ? "default" : booking.status === "in-progress" ? "secondary" : booking.status === "scheduled" ? "outline" : "destructive"}>
                                {booking.status}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium">{booking.service.name} — {booking.squareFootage} sq ft</p>
                            <p className="text-sm text-muted-foreground">{booking.customer.name} · {booking.customer.email} · {booking.customer.phone}</p>
                            <p className="text-sm text-muted-foreground">{booking.customer.address}</p>
                            <p className="text-sm text-muted-foreground">{new Date(booking.scheduledDate).toLocaleString()}</p>
                            {booking.specialInstructions && (
                              <p className="text-xs bg-muted px-2 py-1 rounded">{booking.specialInstructions}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="font-semibold">${parseFloat(booking.totalPrice).toFixed(2)}</span>
                          <Select value={booking.status} onValueChange={(value) => updateBookingMutation.mutate({ id: booking.id, status: value })}>
                            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="scheduled">Scheduled</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Orders */}
        {section === "orders" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Orders</h2>
              <p className="text-muted-foreground">View and manage customer orders</p>
            </div>
            <Card>
              <CardContent className="pt-6">
                {ordersLoading ? (
                  <div className="text-center py-8">Loading orders...</div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No orders yet.</div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{order.orderNumber}</p>
                            <Badge variant={order.status === "completed" ? "default" : order.status === "processing" ? "secondary" : order.status === "pending" ? "outline" : "destructive"}>
                              {order.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{order.name} ({order.email})</p>
                          <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">${order.total}</span>
                          <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                            <Eye className="w-4 h-4 mr-2" />View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* New sections */}
        {section === "taxes" && <TaxesPage />}
        {section === "inventory" && <InventoryPage />}
        {section === "hiring" && <HiringPage />}
        {section === "social" && <SocialPage />}
        {section === "reviews" && <ReviewsPage />}

        {/* Advertising */}
        {section === "advertising" && <AdvertisingBuilder />}
      </main>

      {/* Product Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => saveProductMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl><Input {...field} placeholder="Paver Sealer Pro" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="sku" render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl><Input {...field} placeholder="PSP-001" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea {...field} rows={3} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl><Input {...field} placeholder="49.99" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="stockQuantity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Quantity</FormLabel>
                    <FormControl><Input {...field} type="number" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="categoryId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="imageUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL (Optional)</FormLabel>
                  <FormControl><Input {...field} placeholder="https://..." /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowProductDialog(false)}>Cancel</Button>
                <Button type="submit" disabled={saveProductMutation.isPending}>
                  {saveProductMutation.isPending ? "Saving..." : "Save Product"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order {selectedOrder.orderNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Customer</Label>
                  <p className="font-medium">{selectedOrder.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-muted-foreground">Items</Label>
                <div className="space-y-2 mt-2">
                  {selectedOrder.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">${item.total}</p>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>${selectedOrder.subtotal}</span></div>
                <div className="flex justify-between"><span>Tax</span><span>${selectedOrder.tax}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>${selectedOrder.shipping}</span></div>
                <div className="flex justify-between font-semibold"><span>Total</span><span>${selectedOrder.total}</span></div>
              </div>
              <Separator />
              <div>
                <Label>Update Status</Label>
                <Select value={selectedOrder.status} onValueChange={(v) => updateOrderMutation.mutate({ id: selectedOrder.id, status: v })}>
                  <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
