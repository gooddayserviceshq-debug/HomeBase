import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Ruler, Trash2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PropertyMeasurementProps {
  onAreaCalculated: (squareFootage: number) => void;
  initialAddress?: string;
}

export function PropertyMeasurement({ onAreaCalculated, initialAddress = "" }: PropertyMeasurementProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any | null>(null);
  const [polygon, setPolygon] = useState<any | null>(null);
  const [area, setArea] = useState<number>(0);
  const [address, setAddress] = useState(initialAddress);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initMap = async () => {
      // Load Google Maps script dynamically
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=drawing,geometry,places&v=weekly`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (mapRef.current && (window as any).google) {
          const google = (window as any).google;
          const mapInstance = new google.maps.Map(mapRef.current, {
            center: { lat: 40.7128, lng: -74.0060 }, // Default to NYC
            zoom: 18,
            mapTypeId: "satellite",
            tilt: 0,
          });

          setMap(mapInstance);
          setIsLoading(false);

          // If initial address provided, geocode it
          if (initialAddress) {
            geocodeAddress(initialAddress, mapInstance);
          }
        }
      };

      document.head.appendChild(script);
    };

    initMap();
  }, []);

  const geocodeAddress = (addr: string, mapInstance?: any) => {
    const geocoder = new (window as any).google.maps.Geocoder();
    const targetMap = mapInstance || map;

    if (!targetMap) return;

    geocoder.geocode({ address: addr }, (results: any, status: any) => {
      if (status === "OK" && results && results[0]) {
        targetMap.setCenter(results[0].geometry.location);
        targetMap.setZoom(19);
      }
    });
  };

  const handleAddressSearch = () => {
    if (address && map) {
      geocodeAddress(address);
    }
  };

  const startDrawing = () => {
    if (!map) return;

    const googleMaps = (window as any).google.maps;

    // Clear existing polygon
    if (polygon) {
      polygon.setMap(null);
      setPolygon(null);
      setArea(0);
    }

    const drawingManager = new googleMaps.drawing.DrawingManager({
      drawingMode: googleMaps.drawing.OverlayType.POLYGON,
      drawingControl: false,
      polygonOptions: {
        fillColor: "#2563eb",
        fillOpacity: 0.4,
        strokeWeight: 2,
        strokeColor: "#1d4ed8",
        editable: true,
      },
    });

    drawingManager.setMap(map);

    googleMaps.event.addListener(
      drawingManager,
      "overlaycomplete",
      (event: any) => {
        if (event.type === googleMaps.drawing.OverlayType.POLYGON) {
          const newPolygon = event.overlay;
          setPolygon(newPolygon);
          drawingManager.setMap(null);

          // Calculate area
          const areaMeters = googleMaps.geometry.spherical.computeArea(
            newPolygon.getPath()
          );
          const areaSquareFeet = Math.round(areaMeters * 10.7639); // Convert m² to ft²
          setArea(areaSquareFeet);
          onAreaCalculated(areaSquareFeet);

          // Update area on polygon edit
          googleMaps.event.addListener(newPolygon.getPath(), "set_at", () => {
            const updatedArea = googleMaps.geometry.spherical.computeArea(
              newPolygon.getPath()
            );
            const updatedSquareFeet = Math.round(updatedArea * 10.7639);
            setArea(updatedSquareFeet);
            onAreaCalculated(updatedSquareFeet);
          });

          googleMaps.event.addListener(newPolygon.getPath(), "insert_at", () => {
            const updatedArea = googleMaps.geometry.spherical.computeArea(
              newPolygon.getPath()
            );
            const updatedSquareFeet = Math.round(updatedArea * 10.7639);
            setArea(updatedSquareFeet);
            onAreaCalculated(updatedSquareFeet);
          });
        }
      }
    );
  };

  const clearMeasurement = () => {
    if (polygon) {
      polygon.setMap(null);
      setPolygon(null);
      setArea(0);
      onAreaCalculated(0);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="property-address">Property Address</Label>
        <div className="flex gap-2">
          <Input
            id="property-address"
            placeholder="Enter property address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddressSearch()}
            data-testid="input-property-address"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleAddressSearch}
            disabled={!address}
            data-testid="button-search-address"
          >
            <MapPin className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={mapRef}
        className="w-full h-[400px] rounded-md border"
        data-testid="google-map-container"
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={startDrawing}
            disabled={!map}
            data-testid="button-start-drawing"
          >
            <Ruler className="h-4 w-4 mr-2" />
            {polygon ? "Redraw Area" : "Draw Area"}
          </Button>
          {polygon && (
            <Button
              type="button"
              variant="outline"
              onClick={clearMeasurement}
              data-testid="button-clear-measurement"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>

        {area > 0 && (
          <div className="text-right" data-testid="measurement-result">
            <p className="text-sm text-muted-foreground">Measured Area</p>
            <p className="text-2xl font-bold text-primary">{area.toLocaleString()} sq ft</p>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Tip: Use satellite view to draw around your property. Click to add points, and the area will be calculated automatically.
      </p>
    </Card>
  );
}
