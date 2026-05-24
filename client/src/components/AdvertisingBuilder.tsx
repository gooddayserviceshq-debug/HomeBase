import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Facebook,
  Search,
  Mail,
  MessageSquare,
  MapPin,
  FileText,
} from "lucide-react";

const PLATFORMS = [
  { value: "facebook", label: "Facebook / Instagram", icon: Facebook, color: "bg-blue-500" },
  { value: "google", label: "Google Ads", icon: Search, color: "bg-red-500" },
  { value: "email", label: "Email Campaign", icon: Mail, color: "bg-green-600" },
  { value: "sms", label: "SMS / Text", icon: MessageSquare, color: "bg-purple-500" },
  { value: "nextdoor", label: "Nextdoor", icon: MapPin, color: "bg-orange-500" },
  { value: "flyer", label: "Flyer / Print", icon: FileText, color: "bg-gray-600" },
];

const SERVICES = [
  { value: "restoration", label: "Paver & Surface Restoration" },
  { value: "cleaning", label: "Complete Property Cleaning" },
  { value: "products", label: "Products & Supplies" },
  { value: "all", label: "All Services" },
];

const AUDIENCES = [
  { value: "Homeowners in Middle Tennessee", label: "Homeowners" },
  { value: "Property managers in Middle Tennessee", label: "Property Managers" },
  { value: "Commercial property owners in Middle Tennessee", label: "Commercial" },
  { value: "New homeowners in Middle Tennessee", label: "New Homeowners" },
];

const TONES = [
  { value: "Professional and friendly", label: "Professional & Friendly" },
  { value: "Urgent and action-oriented", label: "Urgent / Limited Time" },
  { value: "Warm and neighborly", label: "Warm & Neighborly" },
  { value: "Premium and aspirational", label: "Premium" },
];

interface GeneratedResult {
  platform: string;
  service: string;
  content: string;
  timestamp: Date;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="ghost" size="sm" onClick={copy} className="h-7 px-2 text-xs gap-1">
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

function parseVariations(content: string): string[] {
  const parts = content.split(/\*\*Variation\s+\d+\*\*/i).filter((p) => p.trim());
  if (parts.length >= 2) return parts.map((p) => p.trim());
  return [content];
}

export function AdvertisingBuilder() {
  const [platform, setPlatform] = useState("");
  const [service, setService] = useState("");
  const [audience, setAudience] = useState(AUDIENCES[0].value);
  const [tone, setTone] = useState(TONES[0].value);
  const [offer, setOffer] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState("");
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const selectedPlatformMeta = PLATFORMS.find((p) => p.value === platform);

  async function generate() {
    if (!platform || !service) return;
    if (abortRef.current) abortRef.current.abort();

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setStreaming("");

    try {
      const res = await fetch("/api/advertising/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ platform, service, audience, tone, offer }),
      });

      if (!res.ok || !res.body) throw new Error("Request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") continue;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              fullText += parsed.text;
              setStreaming(fullText);
            }
          } catch {
            // skip malformed chunks
          }
        }
      }

      if (fullText) {
        setResults((prev) => [
          {
            platform,
            service,
            content: fullText,
            timestamp: new Date(),
          },
          ...prev.slice(0, 4),
        ]);
        setStreaming("");
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setStreaming("Generation failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const latestResult = streaming ? { content: streaming } : results[0];
  const variations = latestResult ? parseVariations(latestResult.content) : [];
  const isMultiVariation = variations.length > 1;

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-[340px_1fr] gap-6 items-start">
        {/* Controls */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Campaign Settings</CardTitle>
              <CardDescription>Configure your ad and hit Generate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Platform */}
              <div className="space-y-2">
                <Label>Platform</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map((p) => {
                    const Icon = p.icon;
                    const active = platform === p.value;
                    return (
                      <button
                        key={p.value}
                        onClick={() => setPlatform(p.value)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                          active
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:border-primary/40 text-muted-foreground"
                        }`}
                      >
                        <span className={`w-5 h-5 rounded flex items-center justify-center ${active ? p.color : "bg-muted"}`}>
                          <Icon className="w-3 h-3 text-white" />
                        </span>
                        <span className="truncate">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Service */}
              <div className="space-y-2">
                <Label>Service</Label>
                <Select value={service} onValueChange={setService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service…" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Audience */}
              <div className="space-y-2">
                <Label>Audience</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIENCES.map((a) => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tone */}
              <div className="space-y-2">
                <Label>Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Optional offer */}
              <div className="space-y-2">
                <Label>
                  Special Offer{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  value={offer}
                  onChange={(e) => setOffer(e.target.value)}
                  placeholder="e.g. 10% off through July, Free sand upgrade…"
                />
              </div>

              <Button
                className="w-full gap-2"
                size="lg"
                onClick={generate}
                disabled={!platform || !service || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Ad Copy
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* History */}
          {results.length > 1 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recent Generations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-3">
                {results.slice(1).map((r, i) => (
                  <button
                    key={i}
                    className="w-full text-left p-2 rounded-md hover:bg-muted transition-colors"
                    onClick={() => setResults((prev) => [r, ...prev.filter((_, idx) => idx !== i + 1)])}
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className="text-xs">{PLATFORMS.find(p => p.value === r.platform)?.label ?? r.platform}</Badge>
                      <span className="text-muted-foreground">{SERVICES.find(s => s.value === r.service)?.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {r.content.slice(0, 60)}…
                    </p>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Output */}
        <div className="space-y-4 min-h-[400px]">
          {!latestResult && !loading && (
            <div className="flex flex-col items-center justify-center h-80 text-center rounded-xl border-2 border-dashed border-muted-foreground/20 gap-4 text-muted-foreground">
              <Sparkles className="w-10 h-10 opacity-30" />
              <div>
                <p className="font-medium">Ready to create ads</p>
                <p className="text-sm">Select a platform and service, then click Generate</p>
              </div>
            </div>
          )}

          {latestResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedPlatformMeta && (
                    <Badge variant="secondary" className="gap-1">
                      <selectedPlatformMeta.icon className="w-3 h-3" />
                      {selectedPlatformMeta.label}
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {SERVICES.find((s) => s.value === service)?.label}
                  </Badge>
                  {loading && (
                    <Badge variant="outline" className="gap-1 text-blue-600 border-blue-200">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Writing…
                    </Badge>
                  )}
                </div>
                {!loading && (
                  <Button variant="ghost" size="sm" onClick={generate} className="gap-1 text-xs">
                    <RefreshCw className="w-3 h-3" />
                    Regenerate
                  </Button>
                )}
              </div>

              {isMultiVariation ? (
                <div className="space-y-3">
                  {variations.map((variation, idx) => (
                    <Card key={idx} className="overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Variation {idx + 1}
                        </span>
                        <CopyButton text={variation} />
                      </div>
                      <CardContent className="p-4">
                        <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
                          {variation}
                          {loading && idx === variations.length - 1 && (
                            <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-pulse align-middle" />
                          )}
                        </pre>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Generated Copy
                    </span>
                    {!loading && <CopyButton text={latestResult.content} />}
                  </div>
                  <CardContent className="p-4">
                    <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
                      {latestResult.content}
                      {loading && (
                        <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-pulse align-middle" />
                      )}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
