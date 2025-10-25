import { CustomerInquiryForm } from "@/components/CustomerInquiryForm";

export default function Contact() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl max-w-2xl mx-auto">
            Get in touch with Good Day Services for all your pressure washing and property cleaning needs
          </p>
        </div>
      </div>
      
      <CustomerInquiryForm />
    </div>
  );
}