import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ExternalLink, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GoogleReviewGeneratorProps {
  placeId?: string;
  variant?: "card" | "compact";
}

export function GoogleReviewGenerator({ 
  placeId = import.meta.env.VITE_GOOGLE_PLACE_ID || "", 
  variant = "card" 
}: GoogleReviewGeneratorProps) {
  const { toast } = useToast();
  
  if (!placeId) {
    return null;
  }

  const reviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(reviewUrl);
    toast({
      title: "Link Copied!",
      description: "Review link has been copied to clipboard.",
    });
  };

  const handleOpenReview = () => {
    window.open(reviewUrl, "_blank");
  };

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          onClick={handleOpenReview}
          variant="outline"
          size="sm"
          data-testid="button-leave-review"
        >
          <Star className="h-4 w-4 mr-2" />
          Leave a Review
        </Button>
        <Button
          onClick={handleCopyLink}
          variant="ghost"
          size="sm"
          data-testid="button-copy-review-link"
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy Link
        </Button>
      </div>
    );
  }

  return (
    <Card data-testid="card-review-generator">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Leave Us a Review
        </CardTitle>
        <CardDescription>
          Share your experience on Google and help other customers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-shrink-0 bg-white p-4 rounded-lg">
            <QRCodeSVG 
              value={reviewUrl} 
              size={150}
              level="H"
              data-testid="qr-code-review"
            />
          </div>
          
          <div className="flex-1 space-y-3">
            <p className="text-sm text-muted-foreground">
              Scan the QR code with your phone or use the buttons below to leave a review on Google Business.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleOpenReview}
                className="flex-1"
                data-testid="button-open-review"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Review Page
              </Button>
              <Button
                onClick={handleCopyLink}
                variant="outline"
                data-testid="button-copy-link"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-muted rounded-lg p-3">
          <p className="text-xs text-muted-foreground break-all">
            {reviewUrl}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
