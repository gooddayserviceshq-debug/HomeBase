import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface AddressAutocompleteProps {
  onAddressSelected: (address: string, isValid: boolean) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export function AddressAutocomplete({
  onAddressSelected,
  label = "Property Address",
  placeholder = "Start typing your address...",
  required = true,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [address, setAddress] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAutocomplete = () => {
      if (!inputRef.current || !(window as any).google) {
        setTimeout(initAutocomplete, 100);
        return;
      }

      const google = (window as any).google;
      
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        types: ["address"],
        componentRestrictions: { country: "us" },
        fields: ["formatted_address", "address_components", "geometry"],
      });

      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current.getPlace();
        
        if (place.formatted_address && place.geometry) {
          setAddress(place.formatted_address);
          setIsValid(true);
          onAddressSelected(place.formatted_address, true);
        } else {
          setIsValid(false);
          onAddressSelected(address, false);
        }
      });

      setIsLoading(false);
    };

    // Load Google Maps script if not already loaded
    if (!(window as any).google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places&v=weekly`;
      script.async = true;
      script.defer = true;
      script.onload = initAutocomplete;
      document.head.appendChild(script);
    } else {
      initAutocomplete();
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);
    
    // Reset validation when user types
    if (isValid) {
      setIsValid(false);
      onAddressSelected(value, false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="address-autocomplete">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id="address-autocomplete"
          type="text"
          placeholder={placeholder}
          value={address}
          onChange={handleInputChange}
          disabled={isLoading}
          data-testid="input-address-autocomplete"
          className={isValid ? "border-chart-2" : ""}
        />
        {address && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid ? (
              <Badge variant="outline" className="bg-chart-2/10 text-chart-2 border-chart-2">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-muted text-muted-foreground">
                <AlertCircle className="h-3 w-3 mr-1" />
                Select from dropdown
              </Badge>
            )}
          </div>
        )}
      </div>
      {isLoading && (
        <p className="text-xs text-muted-foreground">Loading address search...</p>
      )}
      {!isLoading && !isValid && address && (
        <p className="text-xs text-muted-foreground">
          Please select an address from the dropdown suggestions
        </p>
      )}
      {isValid && (
        <p className="text-xs text-chart-2 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Address verified and ready for measurement
        </p>
      )}
    </div>
  );
}
