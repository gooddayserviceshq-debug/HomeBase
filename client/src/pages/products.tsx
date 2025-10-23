import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart, Plus, Minus, X, Package, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Product, Category, CartItem } from "@shared/schema";

interface CartItemWithProduct extends CartItem {
  product: Product;
}

export default function Products() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const { toast } = useToast();

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", selectedCategory],
    queryFn: async () => {
      const url = selectedCategory 
        ? `/api/products?categoryId=${selectedCategory}`
        : "/api/products";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  // Fetch cart items
  const { data: cartItems = [], isLoading: cartLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      if (!response.ok) throw new Error("Failed to add to cart");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: "Product has been added to your cart",
      });
      setCartOpen(true);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add product to cart",
        variant: "destructive",
      });
    },
  });

  // Update cart item quantity
  const updateCartMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const response = await fetch(`/api/cart/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ quantity }),
      });
      if (!response.ok) throw new Error("Failed to update cart");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  // Remove from cart mutation
  const removeFromCartMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/cart/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to remove from cart");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Removed from cart",
        description: "Product has been removed from your cart",
      });
    },
  });

  const cartSubtotal = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
    0
  );

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Professional Products</h1>
        <p className="text-muted-foreground">
          Premium quality products for maintaining your pavers year-round
        </p>
      </div>

      <div className="flex gap-8">
        {/* Category Sidebar */}
        <aside className="w-64 shrink-0">
          <div className="sticky top-4">
            <h2 className="font-semibold mb-4">Categories</h2>
            <div className="space-y-1">
              <Button
                variant={selectedCategory === null ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setSelectedCategory(null)}
                data-testid="button-category-all"
              >
                All Products
              </Button>
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory(category.id)}
                  data-testid={`button-category-${category.id}`}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          {productsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-muted rounded mb-4" />
                    <div className="h-8 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No products found in this category</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="hover-elevate" data-testid={`card-product-${product.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {product.shortDescription}
                        </CardDescription>
                      </div>
                      {product.featured && (
                        <Badge variant="secondary" className="shrink-0">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {product.stockQuantity <= product.lowStockThreshold && (
                        <Badge variant="outline" className="text-orange-600">
                          Only {product.stockQuantity} left in stock
                        </Badge>
                      )}
                      
                      {product.specifications && (
                        <div className="text-sm space-y-1">
                          {Object.entries(product.specifications).slice(0, 3).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-muted-foreground">{key}:</span>
                              <span className="font-medium">{value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold">${product.price}</div>
                          {product.compareAtPrice && (
                            <div className="text-sm text-muted-foreground line-through">
                              ${product.compareAtPrice}
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => addToCartMutation.mutate(product.id)}
                          disabled={product.stockQuantity === 0 || addToCartMutation.isPending}
                          data-testid={`button-add-to-cart-${product.id}`}
                        >
                          {product.stockQuantity === 0 ? "Out of Stock" : "Add to Cart"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Shopping Cart Sheet */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetTrigger asChild>
          <Button
            size="icon"
            className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg"
            data-testid="button-open-cart"
          >
            <ShoppingCart className="h-6 w-6" />
            {cartItemCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center">
                {cartItemCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Shopping Cart</SheetTitle>
          </SheetHeader>
          
          {cartLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading cart...</div>
          ) : cartItems.length === 0 ? (
            <div className="py-12 text-center">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Your cart is empty</p>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 my-4 pr-4" style={{ height: "calc(100vh - 250px)" }}>
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <Card key={item.id} data-testid={`cart-item-${item.id}`}>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium">{item.product.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                ${item.product.price} each
                              </p>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeFromCartMutation.mutate(item.id)}
                              data-testid={`button-remove-${item.id}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => updateCartMutation.mutate({
                                  id: item.id,
                                  quantity: Math.max(1, item.quantity - 1)
                                })}
                                disabled={item.quantity <= 1}
                                data-testid={`button-decrease-${item.id}`}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-12 text-center" data-testid={`quantity-${item.id}`}>
                                {item.quantity}
                              </span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => updateCartMutation.mutate({
                                  id: item.id,
                                  quantity: item.quantity + 1
                                })}
                                disabled={item.quantity >= item.product.stockQuantity}
                                data-testid={`button-increase-${item.id}`}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="font-medium">
                              ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
              
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <div className="flex justify-between text-lg font-medium">
                  <span>Subtotal</span>
                  <span data-testid="cart-subtotal">${cartSubtotal.toFixed(2)}</span>
                </div>
                <Button className="w-full" size="lg" data-testid="button-checkout">
                  Proceed to Checkout
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}