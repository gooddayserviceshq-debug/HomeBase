import type { 
  PropertyCleaningQuote, 
  QuoteRequest 
} from "@shared/schema";

interface EmailConfig {
  from: string;
  fromName: string;
}

const emailConfig: EmailConfig = {
  from: process.env.SENDGRID_FROM_EMAIL || "GoodDayServicesHQ@gmail.com",
  fromName: "Good Day Services"
};

// Property Cleaning Quote Email Template
export function generatePropertyCleaningQuoteEmail(quote: PropertyCleaningQuote): {
  subject: string;
  html: string;
  text: string;
} {
  const services: string[] = [];
  
  if (quote.driveway) services.push("Driveway Cleaning - $300");
  if (quote.roof) services.push("Roof Cleaning - $300");
  if (quote.siding) services.push("House Siding - $300");
  if (quote.gutters) services.push("Gutters Cleaning - $300");
  if (quote.fenceSides > 0) {
    const fenceTotal = Number(quote.fencePricePerSide) * quote.fenceSides;
    services.push(`Fence Cleaning (${quote.fenceSides} sides) - $${fenceTotal}`);
  }

  const servicesList = services.join("\n");
  const servicesHtml = services.map(s => `<li>${s}</li>`).join("");

  const subject = `Your Property Cleaning Quote #${quote.id.slice(0, 8)}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
    .quote-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; }
    .services { margin: 20px 0; }
    .total { font-size: 24px; font-weight: bold; color: #1e40af; margin: 20px 0; text-align: right; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; }
    .button { display: inline-block; padding: 12px 24px; background: #1e40af; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .warning { background: #fef3c7; border: 1px solid #fbbf24; padding: 10px; border-radius: 6px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Good Day Services</h1>
      <p>Professional Property Cleaning Quote</p>
    </div>
    
    <div class="content">
      <h2>Hello ${quote.customerName},</h2>
      <p>Thank you for requesting a property cleaning quote from Good Day Services. We're pleased to provide you with the following estimate:</p>
      
      <div class="quote-box">
        <h3>Property Address:</h3>
        <p>${quote.propertyAddress}</p>
        
        <h3>Selected Services:</h3>
        <ul class="services">
          ${servicesHtml}
        </ul>
        
        ${quote.minimumApplied ? `
        <div class="warning">
          <strong>Note:</strong> A minimum service charge of $975 has been applied to this quote.
        </div>
        ` : ''}
        
        <div class="total">
          Total: $${quote.finalTotal}
        </div>
      </div>
      
      <div class="warning" style="background: #dcfce7; border: 1px solid #10b981;">
        <strong>Limited Time Offer:</strong> Book within 72 hours and save 10% on your total service!
      </div>
      
      <h3>Ready to Transform Your Property?</h3>
      <center>
        <a href="tel:615-390-9779" class="button" style="background: #10b981; font-size: 18px; padding: 16px 32px;">
          Book Now & Save 10% - Call 615-390-9779
        </a>
        <p style="margin: 10px 0; color: #6b7280;">
          <strong>Or Text "BOOK" to 615-390-9779</strong> for instant scheduling
        </p>
      </center>
      
      <h3>What Happens Next:</h3>
      <ol>
        <li><strong>Call or text us</strong> - We're available 7 days a week</li>
        <li><strong>Choose your date</strong> - Most appointments available within 3-5 days</li>
        <li><strong>Secure your booking</strong> - Pay online or after service completion</li>
        <li><strong>Enjoy your clean property</strong> - 100% satisfaction guaranteed!</li>
      </ol>
      
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px; margin: 20px 0;">
        <strong>High Demand Alert:</strong> We're currently booking 7-10 days out. Reserve your spot today!
      </div>
      
      <div class="footer">
        <p><strong>Good Day Services</strong><br>
        Murfreesboro, TN<br>
        615-390-9779<br>
        GoodDayServicesHQ@gmail.com</p>
        <p style="font-size: 12px;">This quote is valid for 30 days from the date of issue. Prices subject to change based on actual property conditions.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Good Day Services - Property Cleaning Quote

Hello ${quote.customerName},

Thank you for requesting a property cleaning quote. Here are your details:

Property Address: ${quote.propertyAddress}

Selected Services:
${servicesList}

${quote.minimumApplied ? 'Note: A minimum service charge of $975 has been applied.\n' : ''}
Total: $${quote.finalTotal}



Next Steps:
1. Review your quote details
2. Contact us to schedule: 615-390-9779
3. We'll confirm within 24 hours

This quote is valid for 30 days.

Good Day Services
Murfreesboro, TN
615-390-9779
GoodDayServicesHQ@gmail.com
  `;

  return { subject, html, text };
}

// Restoration Quote Email Template
export function generateRestorationQuoteEmail(quote: QuoteRequest): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Your Paver Restoration Quote #${quote.id.slice(0, 8)}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
    .quote-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; }
    .tier { border: 2px solid #e5e7eb; padding: 15px; margin: 10px 0; border-radius: 8px; }
    .tier.recommended { border-color: #10b981; background: #f0fdf4; }
    .price { font-size: 20px; font-weight: bold; color: #1e40af; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; }
    .button { display: inline-block; padding: 12px 24px; background: #1e40af; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .badge { background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Good Day Services</h1>
      <p>Professional Paver Restoration Quote</p>
    </div>
    
    <div class="content">
      <h2>Hello ${quote.name},</h2>
      <p>Thank you for requesting a paver restoration quote from Good Day Services. Based on your property details, we're pleased to provide the following service options:</p>
      
      <div class="quote-box">
        <h3>Project Details:</h3>
        <p><strong>Property Address:</strong> ${quote.address}</p>
        <p><strong>Surface Area:</strong> ${quote.squareFootage.toLocaleString()} sq ft</p>
        <p><strong>Surface Condition:</strong> ${quote.condition.charAt(0).toUpperCase() + quote.condition.slice(1)}</p>
      </div>
      
      <h3>Service Tier Options:</h3>
      
      <div class="tier">
        <h4>Basic Service - <span class="price">$${quote.basicTierPrice}</span></h4>
        <ul>
          <li>Professional pressure washing</li>
          <li>Basic joint sand replacement</li>
          <li>Standard sealer application</li>
          <li>2-year warranty</li>
        </ul>
      </div>
      
      <div class="tier recommended">
        <h4>Recommended Service <span class="badge">BEST VALUE</span> - <span class="price">$${quote.recommendedTierPrice}</span></h4>
        <ul>
          <li>Deep cleaning with specialized equipment</li>
          <li>Premium polymeric sand installation</li>
          <li>High-grade protective sealer</li>
          <li>Stain and oil spot treatment</li>
          <li>3-year warranty</li>
        </ul>
      </div>
      
      <div class="tier">
        <h4>Premium Service - <span class="price">$${quote.premiumTierPrice}</span></h4>
        <ul>
          <li>Complete restoration process</li>
          <li>Advanced stain removal</li>
          <li>Color-enhancing premium sealer</li>
          <li>Comprehensive joint stabilization</li>
          <li>Annual maintenance visit included</li>
          <li>5-year warranty</li>
        </ul>
      </div>
      
      <div style="background: #dcfce7; border: 1px solid #10b981; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <strong>Early Bird Special:</strong> Book the Recommended Service within 72 hours and receive:
        <ul style="margin: 10px 0;">
          <li>FREE spot & stain pre-treatment ($150 value)</li>
          <li>10% discount on your total service</li>
          <li>Priority scheduling - start within 5 business days</li>
        </ul>
      </div>
      
      <h3>Ready to Restore Your Pavers?</h3>
      <center>
        <a href="tel:615-390-9779" class="button" style="background: #10b981; font-size: 18px; padding: 16px 32px;">
          Lock in Your Quote - Call 615-390-9779
        </a>
        <p style="margin: 10px 0; color: #6b7280;">
          <strong>Text "PAVERS" to 615-390-9779</strong> for fastest response
        </p>
      </center>
      
      <h3>Your Investment Includes:</h3>
      <ol>
        <li><strong>Free On-Site Evaluation</strong> - We verify measurements and conditions</li>
        <li><strong>Full Warranty Protection</strong> - Up to 5 years depending on tier</li>
        <li><strong>Flexible Payment Options</strong> - Pay after completion or finance available</li>
        <li><strong>Satisfaction Guarantee</strong> - Not happy? We'll make it right!</li>
      </ol>
      
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px; margin: 20px 0;">
        <strong>Limited Availability:</strong> Spring is our busiest season! We're currently scheduling 2-3 weeks out. Secure your spot now!
      </div>
      
      <div class="footer">
        <p><strong>Good Day Services</strong><br>
        Murfreesboro, TN<br>
        615-390-9779<br>
        GoodDayServicesHQ@gmail.com</p>
        <p style="font-size: 12px;">This quote is valid for 30 days from the date of issue. Final pricing may vary based on actual site conditions.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Good Day Services - Paver Restoration Quote

Hello ${quote.name},

Thank you for requesting a paver restoration quote. Here are your options:

Property Address: ${quote.address}
Surface Area: ${quote.squareFootage.toLocaleString()} sq ft
Condition: ${quote.condition}

SERVICE OPTIONS:

Basic Service - $${quote.basicTierPrice}
- Professional pressure washing
- Basic joint sand replacement
- Standard sealer application
- 2-year warranty

Recommended Service (BEST VALUE) - $${quote.recommendedTierPrice}
- Deep cleaning with specialized equipment
- Premium polymeric sand installation
- High-grade protective sealer
- Stain and oil spot treatment
- 3-year warranty

Premium Service - $${quote.premiumTierPrice}
- Complete restoration process
- Advanced stain removal
- Color-enhancing premium sealer
- Comprehensive joint stabilization
- Annual maintenance visit included
- 5-year warranty



Next Steps:
1. Choose your service tier
2. Call us at 615-390-9779
3. We'll schedule your restoration

This quote is valid for 30 days.

Good Day Services
Murfreesboro, TN
615-390-9779
GoodDayServicesHQ@gmail.com
  `;

  return { subject, html, text };
}

// SMS Templates
export function generatePropertyCleaningQuoteSMS(quote: PropertyCleaningQuote): string {
  return `Good Day Services Quote #${quote.id.slice(0, 8)}

Property: ${quote.propertyAddress}
Services: ${[
    quote.driveway && "Driveway",
    quote.roof && "Roof",
    quote.siding && "Siding", 
    quote.gutters && "Gutters",
    quote.fenceSides > 0 && `Fence(${quote.fenceSides})`
  ].filter(Boolean).join(", ")}

Total: $${quote.finalTotal}

Call 615-390-9779 to schedule
Valid 30 days`;
}

export function generateRestorationQuoteSMS(quote: QuoteRequest): string {
  return `Good Day Services Quote #${quote.id.slice(0, 8)}

${quote.squareFootage} sq ft restoration
Basic: $${quote.basicTierPrice}
Recommended: $${quote.recommendedTierPrice}
Premium: $${quote.premiumTierPrice}

Call 615-390-9779 to schedule
Valid 30 days`;
}