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
  const [autocompleteAvailable, setAutocompleteAvailable] = useState(false);

  useEffect(() => {
    // Temporarily disabled autocomplete - using manual input only
    // This ensures the input is never programmatically disabled by Google Maps
    console.log("Address autocomplete component mounted - manual input mode");
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);
    
    // Validate based on trimmed length for manual entry
    const trimmedValue = value.trim();
    const isValidInput = trimmedValue.length > 10;
    
    if (!autocompleteAvailable) {
      // Manual entry mode - validate on trimmed length
      if (isValidInput) {
        setIsValid(true);
        onAddressSelected(trimmedValue, true);
      } else {
        setIsValid(false);
        onAddressSelected(trimmedValue, false);
      }
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
          data-testid="input-address-autocomplete"
          className={isValid ? "border-chart-2" : ""}
        />
        {address && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid ? (
              <Badge variant="outline" className="bg-chart-2/10 text-chart-2 border-chart-2">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {autocompleteAvailable ? "Verified" : "Ready"}
              </Badge>
            ) : autocompleteAvailable ? (
              <Badge variant="outline" className="bg-muted text-muted-foreground">
                <AlertCircle className="h-3 w-3 mr-1" />
                Select from dropdown
              </Badge>
            ) : null}
          </div>
        )}
      </div>
      {!autocompleteAvailable && !address && (
        <p className="text-xs text-muted-foreground">
          Enter your complete property address
        </p>
      )}
      {autocompleteAvailable && !isValid && address && (
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
