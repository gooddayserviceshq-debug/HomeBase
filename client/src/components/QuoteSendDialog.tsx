import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Mail, MessageSquare, Send, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface QuoteSendDialogProps {
  quoteId: string;
  quoteType: "cleaning" | "restoration";
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
}

export function QuoteSendDialog({
  quoteId,
  quoteType,
  customerEmail = "",
  customerPhone = "",
  customerName = "Customer",
}: QuoteSendDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sendMethod, setSendMethod] = useState<"email" | "sms">("email");
  const [email, setEmail] = useState(customerEmail);
  const [phone, setPhone] = useState(customerPhone);
  const { toast } = useToast();

  const sendQuoteMutation = useMutation({
    mutationFn: async (data: {
      method: "email" | "sms";
      recipient: string;
    }) => {
      const endpoint = `/api/send-quote/${data.method}`;
      const payload = {
        quoteId,
        quoteType,
        ...(data.method === "email" 
          ? { recipientEmail: data.recipient }
          : { recipientPhone: data.recipient }
        ),
      };
      
      return fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(res => res.json());
    },
    onSuccess: (response) => {
      toast({
        title: "Quote Sent Successfully",
        description: response.message || `Quote has been sent via ${sendMethod}`,
      });
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Quote",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    const recipient = sendMethod === "email" ? email : phone;
    
    if (!recipient) {
      toast({
        title: "Missing Information",
        description: `Please enter ${sendMethod === "email" ? "an email address" : "a phone number"}`,
        variant: "destructive",
      });
      return;
    }

    if (sendMethod === "email" && !email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (sendMethod === "sms" && phone.replace(/\D/g, "").length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return;
    }

    sendQuoteMutation.mutate({
      method: sendMethod,
      recipient,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-send-quote">
          <Send className="mr-2 h-4 w-4" />
          Send Quote
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Quote to {customerName}</DialogTitle>
          <DialogDescription>
            Choose how you want to send this quote to the customer
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Send Method</Label>
            <RadioGroup value={sendMethod} onValueChange={(v) => setSendMethod(v as "email" | "sms")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="email" data-testid="radio-email" />
                <Label htmlFor="email" className="flex items-center cursor-pointer">
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sms" id="sms" data-testid="radio-sms" />
                <Label htmlFor="sms" className="flex items-center cursor-pointer">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Text Message
                </Label>
              </div>
            </RadioGroup>
          </div>

          {sendMethod === "email" ? (
            <div className="space-y-2">
              <Label htmlFor="email-input">Email Address</Label>
              <Input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                data-testid="input-email"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="phone-input">Phone Number</Label>
              <Input
                id="phone-input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(615) 555-0123"
                data-testid="input-phone"
              />
            </div>
          )}

          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm text-muted-foreground">
              {sendMethod === "email" 
                ? "The customer will receive a detailed quote via email with all service options and pricing."
                : "The customer will receive a summary of the quote via SMS with contact information to schedule."}
            </p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSend}
            disabled={sendQuoteMutation.isPending}
            data-testid="button-send"
          >
            {sendQuoteMutation.isPending ? (
              <>Sending...</>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send {sendMethod === "email" ? "Email" : "SMS"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}