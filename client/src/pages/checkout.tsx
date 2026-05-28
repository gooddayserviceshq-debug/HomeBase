import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShoppingCart, CreditCard, Truck, AlertCircle, CheckCircle, Lock } from "lucide-react";
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
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import type { CartItem, Product } from "@shared/schema";

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string)
  : null;

interface CartItemWithProduct extends CartItem {
  product: Product;
}

const checkoutSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  shippingAddress: z.object({
    street: z.string().min(5, "Street address required"),
    city: z.string().min(2, "City required"),
    state: z.string().length(2, "State must be 2 characters"),
    zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
  }),
  billingAddress: z.object({
    street: z.string().min(5, "Street address required"),
    city: z.string().min(2, "City required"),
    state: z.string().length(2, "State must be 2 characters"),
    zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
  }),
  sameAsShipping: z.boolean(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

function StripeCheckoutForm({
  cartItems,
  subtotal,
  tax,
  shipping,
  total,
  onSuccess,
}: {
  cartItems: CartItemWithProduct[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  onSuccess: (orderNumber: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (total <= 0) return;
    fetch("/api/payments/create-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ amount: total }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.clientSecret) setClientSecret(d.clientSecret); })
      .catch(() => {});
  }, [total]);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: "", name: "", phone: "",
      shippingAddress: { street: "", city: "", state: "", zip: "" },
      billingAddress: { street: "", city: "", state: "", zip: "" },
      sameAsShipping: true,
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: CheckoutFormData) => {
      const orderItems = cartItems.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        productPrice: item.product.price,
        quantity: item.quantity,
        total: (parseFloat(item.product.price) * item.quantity).toFixed(2),
      }));

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: data.email,
          name: data.name,
          phone: data.phone,
          shippingAddress: data.shippingAddress,
          billingAddress: data.sameAsShipping ? data.shippingAddress : data.billingAddress,
          subtotal: subtotal.toFixed(2),
          tax: tax.toFixed(2),
          shipping: shipping.toFixed(2),
          total: total.toFixed(2),
          items: orderItems,
        }),
      });

      if (!response.ok) throw new Error("Failed to create order");
      return response.json();
    },
    onSuccess: async (order) => {
      await fetch("/api/cart/clear", { method: "POST", credentials: "include" });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      onSuccess(order.orderNumber);
    },
    onError: (error) => {
      toast({ title: "Order Failed", description: error.message, variant: "destructive" });
      setProcessing(false);
    },
  });

  const onSubmit = async (data: CheckoutFormData) => {
    setProcessing(true);

    if (stripe && elements && clientSecret) {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        toast({ title: "Payment Error", description: "Card element not found", variant: "destructive" });
        setProcessing(false);
        return;
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: { name: data.name, email: data.email },
        },
      });

      if (error) {
        toast({ title: "Payment Failed", description: error.message, variant: "destructive" });
        setProcessing(false);
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        createOrderMutation.mutate(data);
        return;
      }
    } else {
      // No Stripe — demo mode
      toast({ title: "Processing Order", description: "Creating your order..." });
      setTimeout(() => createOrderMutation.mutate(data), 800);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Contact Information */}
        <Card>
          <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input {...field} type="email" placeholder="john@example.com" data-testid="input-email" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input {...field} placeholder="John Smith" data-testid="input-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl><Input {...field} placeholder="(555) 123-4567" data-testid="input-phone" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card>
          <CardHeader><CardTitle>Shipping Address</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="shippingAddress.street" render={({ field }) => (
              <FormItem>
                <FormLabel>Street Address</FormLabel>
                <FormControl><Input {...field} placeholder="123 Main St" data-testid="input-shipping-street" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <FormField control={form.control} name="shippingAddress.city" render={({ field }) => (
                <FormItem className="col-span-2 sm:col-span-1">
                  <FormLabel>City</FormLabel>
                  <FormControl><Input {...field} placeholder="Murfreesboro" data-testid="input-shipping-city" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="shippingAddress.state" render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl><Input {...field} placeholder="TN" maxLength={2} data-testid="input-shipping-state" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="shippingAddress.zip" render={({ field }) => (
                <FormItem>
                  <FormLabel>ZIP</FormLabel>
                  <FormControl><Input {...field} placeholder="37130" data-testid="input-shipping-zip" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </CardContent>
        </Card>

        {/* Billing Address */}
        <Card>
          <CardHeader><CardTitle>Billing Address</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="sameAsShipping" render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="rounded border-gray-300"
                    data-testid="checkbox-same-as-shipping"
                  />
                </FormControl>
                <FormLabel className="!mt-0 cursor-pointer">Same as shipping address</FormLabel>
              </FormItem>
            )} />
            {!form.watch("sameAsShipping") && (
              <>
                <FormField control={form.control} name="billingAddress.street" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl><Input {...field} placeholder="123 Main St" data-testid="input-billing-street" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <FormField control={form.control} name="billingAddress.city" render={({ field }) => (
                    <FormItem className="col-span-2 sm:col-span-1">
                      <FormLabel>City</FormLabel>
                      <FormControl><Input {...field} placeholder="Murfreesboro" data-testid="input-billing-city" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="billingAddress.state" render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl><Input {...field} placeholder="TN" maxLength={2} data-testid="input-billing-state" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="billingAddress.zip" render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP</FormLabel>
                      <FormControl><Input {...field} placeholder="37130" data-testid="input-billing-zip" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stripe && clientSecret ? (
              <div className="p-3 border rounded-md bg-white">
                <CardElement
                  options={{
                    style: {
                      base: { fontSize: "16px", color: "#424770", "::placeholder": { color: "#aab7c4" } },
                      invalid: { color: "#9e2146" },
                    },
                  }}
                />
              </div>
            ) : (
              <Alert>
                <CreditCard className="h-4 w-4" />
                <AlertDescription>
                  {import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
                    ? "Connecting to payment processor..."
                    : "Stripe payment not configured. Order will be placed in demo mode."}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={processing}
          data-testid="button-place-order"
        >
          {processing ? "Processing..." : `Place Order — $${total.toFixed(2)}`}
        </Button>
      </form>
    </Form>
  );
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const { data: cartItems = [], isLoading: cartLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
  });

  const subtotal = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
    0
  );
  const tax = subtotal * 0.095;
  const shipping = subtotal > 100 ? 0 : 9.99;
  const total = subtotal + tax + shipping;

  if (orderComplete) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-16">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">Order Complete!</h1>
                <p className="text-muted-foreground">Thank you for your purchase.</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Order Number</p>
                <p className="text-xl font-semibold" data-testid="order-number">{orderNumber}</p>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  A confirmation email has been sent to your address with order details.
                </AlertDescription>
              </Alert>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => setLocation("/products")} variant="outline" data-testid="button-continue-shopping">
                  Continue Shopping
                </Button>
                <Button onClick={() => setLocation("/")} data-testid="button-return-home">
                  Return to Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (cartLoading) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-12">Loading checkout...</div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-16">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto" />
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">Your cart is empty</h1>
                <p className="text-muted-foreground">Add some products to your cart before checking out.</p>
              </div>
              <Button onClick={() => setLocation("/products")} data-testid="button-browse-products">
                Browse Products
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Order Form */}
        <div className="lg:col-span-2 space-y-6">
          {stripePromise ? (
            <Elements stripe={stripePromise}>
              <StripeCheckoutForm
                cartItems={cartItems}
                subtotal={subtotal}
                tax={tax}
                shipping={shipping}
                total={total}
                onSuccess={(num) => { setOrderNumber(num); setOrderComplete(true); }}
              />
            </Elements>
          ) : (
            <StripeCheckoutForm
              cartItems={cartItems}
              subtotal={subtotal}
              tax={tax}
              shipping={shipping}
              total={total}
              onSuccess={(num) => { setOrderNumber(num); setOrderComplete(true); }}
            />
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>{cartItems.length} items</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">
                      ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (9.5%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <div className="flex items-center gap-1">
                    <Truck className="h-3 w-3" />
                    <span>Shipping</span>
                  </div>
                  <span>{shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}</span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-muted-foreground">Free shipping on orders over $100</p>
                )}
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span data-testid="order-total">${total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
