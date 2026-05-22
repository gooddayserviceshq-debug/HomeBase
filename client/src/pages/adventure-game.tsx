import { useState, useRef, useCallback } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Camera,
  Upload,
  AlertTriangle,
  CheckCircle,
  Wrench,
  ShoppingCart,
  Phone,
  ChevronRight,
  Home,
  User,
  Building2,
  Zap,
  Shield,
  Star,
  RotateCcw,
  ExternalLink,
  HardHat,
  Lightbulb,
  ArrowLeft,
  Trophy,
  Users,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Part {
  name: string;
  description: string;
  estimatedCost: string;
  homeDepotSearchTerm: string;
  commonMistake?: string;
}

interface Step {
  stepNumber: number;
  title: string;
  description: string;
  tip?: string;
}

interface DiagnosisResult {
  problemTitle: string;
  problemDescription: string;
  severity: "minor" | "moderate" | "serious" | "emergency";
  landlordResponsible: boolean;
  landlordExplanation: string;
  diyDifficulty: "easy" | "moderate" | "hard" | "dont-diy";
  diyExplanation: string;
  partsNeeded: Part[];
  steps: Step[];
  whenToCallPro: string;
  safetyWarnings: string[];
  estimatedCost: { diy: string; professional: string };
  expertNote: string;
}

type GameScreen =
  | "intro"
  | "role"
  | "upload"
  | "analyzing"
  | "diagnosis"
  | "parts-quest"
  | "diy-guide"
  | "victory"
  | "booking"
  | "expert-hub";

interface GameState {
  screen: GameScreen;
  playerRole: "renter" | "homeowner" | null;
  problemDescription: string;
  imageBase64: string | null;
  imagePreview: string | null;
  mimeType: string;
  diagnosis: DiagnosisResult | null;
  collectedParts: Set<string>;
  zipCode: string;
  completedSteps: Set<number>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const severityConfig = {
  minor: { color: "bg-green-500", text: "text-green-700", label: "Minor", icon: CheckCircle },
  moderate: { color: "bg-yellow-500", text: "text-yellow-700", label: "Moderate", icon: AlertTriangle },
  serious: { color: "bg-orange-500", text: "text-orange-700", label: "Serious", icon: AlertTriangle },
  emergency: { color: "bg-red-500", text: "text-red-700", label: "EMERGENCY", icon: Zap },
};

const difficultyConfig = {
  easy: { color: "text-green-600", label: "Easy DIY", stars: 1 },
  moderate: { color: "text-yellow-600", label: "Moderate DIY", stars: 2 },
  hard: { color: "text-orange-600", label: "Hard DIY", stars: 3 },
  "dont-diy": { color: "text-red-600", label: "Call a Pro", stars: 0 },
};

function buildHomeDepotUrl(searchTerm: string): string {
  const encoded = encodeURIComponent(searchTerm);
  return `https://www.homedepot.com/s/${encoded}`;
}

// ─── Screen Components ────────────────────────────────────────────────────────

function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center px-4 text-white">
      <div className="text-center max-w-2xl animate-fade-in-up">
        <div className="text-8xl mb-6">🏠</div>
        <h1 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
          HomeHero
        </h1>
        <p className="text-xl text-slate-300 mb-4 leading-relaxed">
          Your home has a problem. Is it serious? Can you fix it yourself?
          Is your landlord on the hook?
        </p>
        <p className="text-base text-slate-400 mb-10 leading-relaxed">
          Upload a photo → get an AI diagnosis powered by master-trade knowledge →
          find the right parts → learn the fix — or know exactly when to call a pro.
        </p>

        <div className="grid grid-cols-3 gap-4 mb-10 text-sm">
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
            <Camera className="h-6 w-6 mx-auto mb-2 text-cyan-400" />
            <div className="font-semibold">Snap a Photo</div>
            <div className="text-slate-400">Any home problem</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
            <Zap className="h-6 w-6 mx-auto mb-2 text-yellow-400" />
            <div className="font-semibold">AI Diagnosis</div>
            <div className="text-slate-400">Severity + landlord check</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
            <ShoppingCart className="h-6 w-6 mx-auto mb-2 text-green-400" />
            <div className="font-semibold">Parts + Guide</div>
            <div className="text-slate-400">Exact what you need</div>
          </div>
        </div>

        <Button
          onClick={onStart}
          size="lg"
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold text-lg px-10 py-6 rounded-2xl shadow-2xl shadow-blue-500/30 transform hover:scale-105 transition-all"
        >
          Start Your Quest <ChevronRight className="ml-2 h-5 w-5" />
        </Button>

        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>Expert-verified advice</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            <span>Safety-first guidance</span>
          </div>
          <div className="flex items-center gap-1">
            <Trophy className="h-4 w-4" />
            <span>Help others, earn rewards</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleScreen({ onSelect }: { onSelect: (role: "renter" | "homeowner") => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center px-4 text-white">
      <div className="text-center max-w-2xl animate-fade-in-up">
        <h2 className="text-3xl font-black mb-3">Who are you?</h2>
        <p className="text-slate-400 mb-10">This changes what rights you have and who's responsible for the fix.</p>
        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => onSelect("renter")}
            className="group bg-white/10 hover:bg-blue-500/20 border border-white/20 hover:border-blue-400 rounded-2xl p-8 text-left transition-all transform hover:scale-[1.02] backdrop-blur"
          >
            <Building2 className="h-10 w-10 mb-4 text-blue-400 group-hover:scale-110 transition-transform" />
            <div className="text-2xl font-bold mb-2">I'm a Renter</div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Is this my problem or my landlord's? Get a clear answer based on housing codes — and know when to push back.
            </p>
            <div className="mt-4 text-blue-400 text-sm font-semibold flex items-center gap-1">
              Landlord fairness check included <ChevronRight className="h-4 w-4" />
            </div>
          </button>
          <button
            onClick={() => onSelect("homeowner")}
            className="group bg-white/10 hover:bg-cyan-500/20 border border-white/20 hover:border-cyan-400 rounded-2xl p-8 text-left transition-all transform hover:scale-[1.02] backdrop-blur"
          >
            <Home className="h-10 w-10 mb-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <div className="text-2xl font-bold mb-2">I'm a Homeowner</div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Fix it yourself or know when it's worth paying a pro. Get exact parts, real costs, and step-by-step guidance.
            </p>
            <div className="mt-4 text-cyan-400 text-sm font-semibold flex items-center gap-1">
              Full DIY guide + parts list <ChevronRight className="h-4 w-4" />
            </div>
          </button>
        </div>
        <p className="mt-8 text-slate-500 text-xs">
          Your photos stay private and are only used for diagnosis.
        </p>
      </div>
    </div>
  );
}

function UploadScreen({
  playerRole,
  onAnalyze,
}: {
  playerRole: "renter" | "homeowner";
  onAnalyze: (imageBase64: string, mimeType: string, description: string) => void;
}) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [description, setDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      const base64 = dataUrl.split(",")[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const canSubmit = imageBase64 && description.trim().length > 5;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 py-12 text-white">
      <div className="max-w-xl mx-auto animate-fade-in-up">
        <div className="flex items-center gap-2 mb-8">
          <Badge variant="outline" className="border-blue-400 text-blue-400">
            {playerRole === "renter" ? "🏢 Renter Mode" : "🏠 Homeowner Mode"}
          </Badge>
        </div>

        <h2 className="text-3xl font-black mb-2">Show me the problem</h2>
        <p className="text-slate-400 mb-8">
          A clear photo + a brief description gets the most accurate diagnosis.
        </p>

        {/* Upload zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative rounded-2xl border-2 border-dashed cursor-pointer transition-all mb-6 overflow-hidden
            ${isDragging ? "border-blue-400 bg-blue-500/20" : "border-white/30 hover:border-white/60 bg-white/5 hover:bg-white/10"}
            ${imagePreview ? "h-64" : "h-48 flex flex-col items-center justify-center"}`}
        >
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Uploaded problem"
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              <Upload className="h-10 w-10 text-slate-400 mb-3" />
              <p className="text-slate-300 font-medium">Drag & drop or tap to upload</p>
              <p className="text-slate-500 text-sm mt-1">JPG, PNG, WEBP</p>
            </>
          )}
          {imagePreview && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-white font-semibold flex items-center gap-2">
                <Camera className="h-5 w-5" /> Change photo
              </span>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {/* Description */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            Describe what you're seeing
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              playerRole === "renter"
                ? "e.g. The sink has been dripping for weeks, I told my landlord but nothing happened..."
                : "e.g. Noticed a dark spot on the ceiling after the last rain storm..."
            }
            rows={3}
            className="w-full rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
        </div>

        <Button
          disabled={!canSubmit}
          onClick={() => {
            if (imageBase64 && description) {
              onAnalyze(imageBase64, mimeType, description);
            }
          }}
          size="lg"
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-40 font-bold text-lg py-6 rounded-2xl"
        >
          <Zap className="mr-2 h-5 w-5" />
          Run AI Diagnosis
        </Button>

        {!canSubmit && (
          <p className="text-center text-slate-500 text-xs mt-3">
            {!imageBase64 ? "Upload a photo to continue" : "Add a description (at least a few words)"}
          </p>
        )}
      </div>
    </div>
  );
}

function AnalyzingScreen() {
  const messages = [
    "Scanning for structural issues...",
    "Checking plumbing patterns...",
    "Consulting 60 years of trade knowledge...",
    "Assessing landlord liability...",
    "Calculating repair costs...",
    "Finding the right parts...",
  ];
  const [msgIndex, setMsgIndex] = useState(0);

  useState(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % messages.length);
    }, 900);
    return () => clearInterval(interval);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center px-4 text-white">
      <div className="text-center max-w-md animate-fade-in">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-blue-500/30 animate-pulse" />
          <div className="absolute inset-2 rounded-full border-4 border-t-blue-400 border-r-cyan-400 border-b-transparent border-l-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-3xl">🔍</div>
        </div>
        <h2 className="text-2xl font-black mb-3">Analyzing your problem...</h2>
        <p className="text-blue-300 font-medium mb-8 min-h-6 transition-all">{messages[msgIndex]}</p>
        <Progress value={60} className="h-2 bg-white/10" />
        <p className="text-slate-500 text-xs mt-4">
          Powered by master-trade AI knowledge
        </p>
      </div>
    </div>
  );
}

function DiagnosisScreen({
  diagnosis,
  playerRole,
  onDIY,
  onBookPro,
  onPartsQuest,
}: {
  diagnosis: DiagnosisResult;
  playerRole: "renter" | "homeowner";
  onDIY: () => void;
  onBookPro: () => void;
  onPartsQuest: () => void;
}) {
  const sev = severityConfig[diagnosis.severity];
  const diff = difficultyConfig[diagnosis.diyDifficulty];
  const SevIcon = sev.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 py-10 text-white">
      <div className="max-w-2xl mx-auto animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="text-3xl font-black mb-2">Diagnosis Complete</h2>
          <h3 className="text-xl text-blue-300 font-semibold">{diagnosis.problemTitle}</h3>
        </div>

        {/* Severity banner */}
        {diagnosis.severity === "emergency" && (
          <div className="bg-red-500/20 border border-red-500 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <Zap className="h-6 w-6 text-red-400 flex-shrink-0" />
            <div>
              <div className="font-bold text-red-300">EMERGENCY — Stop using this immediately</div>
              <div className="text-sm text-red-400">{diagnosis.safetyWarnings[0]}</div>
            </div>
          </div>
        )}

        {/* Main diagnosis card */}
        <Card className="bg-white/10 border-white/20 text-white mb-6">
          <CardContent className="p-6 space-y-4">
            <p className="text-slate-300 leading-relaxed">{diagnosis.problemDescription}</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-xs text-slate-400 mb-1">Severity</div>
                <div className={`font-bold flex items-center gap-2 ${sev.text}`}>
                  <SevIcon className="h-4 w-4" />
                  {sev.label}
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-xs text-slate-400 mb-1">DIY Difficulty</div>
                <div className={`font-bold ${diff.color}`}>{diff.label}</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-xs text-slate-400 mb-1">DIY Cost</div>
                <div className="font-bold text-green-400">{diagnosis.estimatedCost.diy}</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-xs text-slate-400 mb-1">Pro Cost</div>
                <div className="font-bold text-slate-300">{diagnosis.estimatedCost.professional}</div>
              </div>
            </div>

            {/* Expert note */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex gap-3">
              <HardHat className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-yellow-400 font-semibold mb-1">Master Trade Insight</div>
                <p className="text-slate-300 text-sm italic">{diagnosis.expertNote}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Landlord check (renters only) */}
        {playerRole === "renter" && (
          <Card className={`border mb-6 ${diagnosis.landlordResponsible ? "bg-green-500/10 border-green-500/40" : "bg-slate-800/60 border-white/20"}`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Building2 className={`h-5 w-5 ${diagnosis.landlordResponsible ? "text-green-400" : "text-slate-400"}`} />
                <div className="font-bold text-lg">
                  {diagnosis.landlordResponsible
                    ? "✅ Your landlord is responsible"
                    : "⚠️ This is likely your responsibility"}
                </div>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{diagnosis.landlordExplanation}</p>
              {diagnosis.landlordResponsible && (
                <div className="mt-4 bg-green-500/10 rounded-xl p-3 text-xs text-green-300">
                  💡 Document this in writing, send via email, and keep a record. If unresolved within a reasonable time,
                  you may have legal options depending on your state.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Safety warnings */}
        {diagnosis.safetyWarnings.length > 0 && (
          <Card className="bg-orange-500/10 border-orange-500/30 mb-6">
            <CardContent className="p-4">
              <div className="font-semibold text-orange-300 mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4" /> Safety First
              </div>
              <ul className="space-y-1">
                {diagnosis.safetyWarnings.map((w, i) => (
                  <li key={i} className="text-sm text-orange-200 flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          {diagnosis.diyDifficulty !== "dont-diy" && (
            <Button
              onClick={onPartsQuest}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 font-bold text-lg py-6 rounded-2xl"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Start the Parts Quest — DIY this!
            </Button>
          )}
          <Button
            onClick={onBookPro}
            variant="outline"
            size="lg"
            className="w-full border-white/30 hover:bg-white/10 font-semibold py-5 rounded-2xl"
          >
            <Phone className="mr-2 h-5 w-5" />
            Book a Pro Instead
          </Button>
        </div>

        <p className="text-center text-slate-500 text-xs mt-4">{diagnosis.diyExplanation}</p>
      </div>
    </div>
  );
}

function PartsQuestScreen({
  diagnosis,
  collectedParts,
  onTogglePart,
  onProceed,
}: {
  diagnosis: DiagnosisResult;
  collectedParts: Set<string>;
  onTogglePart: (partName: string) => void;
  onProceed: () => void;
}) {
  const allCollected = diagnosis.partsNeeded.every((p) => collectedParts.has(p.name));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 py-10 text-white">
      <div className="max-w-2xl mx-auto animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🛒</div>
          <h2 className="text-3xl font-black mb-2">The Parts Quest</h2>
          <p className="text-slate-400">
            Here's exactly what you need — and the traps to avoid. Check each part off as you get it.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <span className="text-slate-400">Parts collected</span>
          <span className="font-bold">
            {collectedParts.size} / {diagnosis.partsNeeded.length}
          </span>
        </div>
        <Progress
          value={(collectedParts.size / Math.max(diagnosis.partsNeeded.length, 1)) * 100}
          className="h-3 mb-8 bg-white/10"
        />

        {/* Parts list */}
        <div className="space-y-4 mb-8">
          {diagnosis.partsNeeded.map((part) => {
            const collected = collectedParts.has(part.name);
            return (
              <div
                key={part.name}
                onClick={() => onTogglePart(part.name)}
                className={`rounded-2xl border p-5 cursor-pointer transition-all transform hover:scale-[1.01]
                  ${collected
                    ? "bg-green-500/20 border-green-500/50"
                    : "bg-white/10 border-white/20 hover:bg-white/15"
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                        ${collected ? "bg-green-500 border-green-500" : "border-white/40"}`}>
                        {collected && <CheckCircle className="h-3 w-3 text-white" />}
                      </div>
                      <span className={`font-bold ${collected ? "line-through text-slate-400" : ""}`}>
                        {part.name}
                      </span>
                      <Badge variant="outline" className="text-xs border-green-400/50 text-green-400">
                        {part.estimatedCost}
                      </Badge>
                    </div>
                    <p className="text-slate-400 text-sm ml-8">{part.description}</p>
                    {part.commonMistake && (
                      <div className="ml-8 mt-2 bg-orange-500/10 rounded-lg px-3 py-2 text-xs text-orange-300 flex items-start gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                        <span><strong>Common mistake:</strong> {part.commonMistake}</span>
                      </div>
                    )}
                  </div>
                  <a
                    href={buildHomeDepotUrl(part.homeDepotSearchTerm)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Home Depot
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {allCollected && (
          <div className="bg-green-500/20 border border-green-500/40 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-400" />
            <div>
              <div className="font-bold text-green-300">All parts collected!</div>
              <div className="text-sm text-green-400">You're ready to start the fix.</div>
            </div>
          </div>
        )}

        <Button
          onClick={onProceed}
          disabled={!allCollected}
          size="lg"
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-40 font-bold text-lg py-6 rounded-2xl"
        >
          <Wrench className="mr-2 h-5 w-5" />
          I Have Everything — Show Me How
        </Button>
        {!allCollected && (
          <p className="text-center text-slate-500 text-xs mt-2">
            Tap each part to mark it collected, or click "Home Depot" to find it
          </p>
        )}
      </div>
    </div>
  );
}

function DIYGuideScreen({
  diagnosis,
  completedSteps,
  onToggleStep,
  onVictory,
  onGiveUp,
}: {
  diagnosis: DiagnosisResult;
  completedSteps: Set<number>;
  onToggleStep: (step: number) => void;
  onVictory: () => void;
  onGiveUp: () => void;
}) {
  const allDone = diagnosis.steps.every((s) => completedSteps.has(s.stepNumber));
  const progress = (completedSteps.size / Math.max(diagnosis.steps.length, 1)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 py-10 text-white">
      <div className="max-w-2xl mx-auto animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔧</div>
          <h2 className="text-3xl font-black mb-2">DIY Guide</h2>
          <p className="text-slate-400">Follow each step. Check them off as you go.</p>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <Progress value={progress} className="flex-1 h-3 bg-white/10" />
          <span className="text-sm font-bold whitespace-nowrap">
            {completedSteps.size}/{diagnosis.steps.length} steps
          </span>
        </div>

        <Accordion type="multiple" className="space-y-3 mb-8">
          {diagnosis.steps.map((step) => {
            const done = completedSteps.has(step.stepNumber);
            return (
              <AccordionItem
                key={step.stepNumber}
                value={`step-${step.stepNumber}`}
                className={`rounded-2xl border overflow-hidden transition-colors
                  ${done ? "border-green-500/40 bg-green-500/10" : "border-white/20 bg-white/10"}`}
              >
                <AccordionTrigger className="px-5 py-4 hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStep(step.stepNumber);
                      }}
                      className={`h-7 w-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
                        ${done ? "bg-green-500 border-green-500" : "border-white/40 hover:border-white"}`}
                    >
                      {done && <CheckCircle className="h-4 w-4 text-white" />}
                    </button>
                    <span className={`font-bold ${done ? "line-through text-slate-400" : ""}`}>
                      Step {step.stepNumber}: {step.title}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5">
                  <p className="text-slate-300 text-sm leading-relaxed mb-3 ml-10">{step.description}</p>
                  {step.tip && (
                    <div className="ml-10 bg-yellow-500/10 rounded-xl px-4 py-3 flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-yellow-300"><strong>Pro tip:</strong> {step.tip}</span>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* When to call pro reminder */}
        <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-4 mb-6">
          <div className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
            <Phone className="h-3.5 w-3.5" /> Stop and call a pro if:
          </div>
          <p className="text-sm text-slate-300">{diagnosis.whenToCallPro}</p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={onVictory}
            disabled={!allDone}
            size="lg"
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:opacity-40 font-bold text-lg py-6 rounded-2xl"
          >
            <Trophy className="mr-2 h-5 w-5" />
            I Fixed It! 🎉
          </Button>
          <Button
            onClick={onGiveUp}
            variant="outline"
            size="lg"
            className="w-full border-white/30 hover:bg-white/10 py-5 rounded-2xl"
          >
            This is over my head — get me a pro
          </Button>
        </div>
      </div>
    </div>
  );
}

function VictoryScreen({ diagnosis, onReset, onExpertHub }: { diagnosis: DiagnosisResult; onReset: () => void; onExpertHub: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center px-4 text-white">
      <div className="text-center max-w-xl animate-fade-in-up">
        <div className="text-8xl mb-4 animate-bounce">🏆</div>
        <h2 className="text-4xl font-black mb-3 bg-gradient-to-r from-yellow-400 to-orange-300 bg-clip-text text-transparent">
          YOU FIXED IT!
        </h2>
        <p className="text-slate-300 mb-3">You just saved approximately</p>
        <div className="text-5xl font-black text-green-400 mb-2">{diagnosis.estimatedCost.professional}</div>
        <p className="text-slate-500 text-sm mb-10">by doing it yourself instead of hiring a pro</p>

        <Card className="bg-white/10 border-white/20 text-white mb-8">
          <CardContent className="p-6">
            <div className="font-bold text-lg mb-3 text-yellow-300 flex items-center gap-2">
              <Star className="h-5 w-5" /> Now you're the expert
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              You just navigated a real home repair from start to finish. Other homeowners face this exact problem every day.
              Share your experience on the Expert Hub and earn rewards while helping your community.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button
            onClick={onExpertHub}
            size="lg"
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-bold text-lg py-6 rounded-2xl"
          >
            <Users className="mr-2 h-5 w-5" />
            Join the Expert Hub — Help Others
          </Button>
          <Button
            onClick={onReset}
            variant="outline"
            size="lg"
            className="w-full border-white/30 hover:bg-white/10 py-5 rounded-2xl"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Diagnose Another Problem
          </Button>
        </div>
      </div>
    </div>
  );
}

function BookingScreen({ onReset }: { onReset: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 py-12 text-white">
      <div className="max-w-xl mx-auto animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">👷</div>
          <h2 className="text-3xl font-black mb-2">Get a Pro on It</h2>
          <p className="text-slate-400">
            Good Day Services is a local, trusted team. Real people, real work, real results.
          </p>
        </div>

        <Card className="bg-white/10 border-white/20 text-white mb-6">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>Licensed, insured, and background-checked</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>Free quotes — no pressure</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>100% satisfaction guarantee</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>Specialists in pressure washing, restoration & more</span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button asChild size="lg" className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 font-bold text-lg py-6 rounded-2xl">
            <Link href="/quote">Get a Free Quote →</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full border-white/30 hover:bg-white/10 py-5 rounded-2xl">
            <Link href="/contact">Talk to Someone First</Link>
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-slate-500 text-sm mb-3">Or — connect with a retired master tradesperson for a second opinion</p>
          <Button
            onClick={() => {}}
            variant="ghost"
            className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
          >
            <Users className="mr-2 h-4 w-4" />
            Ask an Expert (coming soon)
          </Button>
        </div>

        <Button onClick={onReset} variant="ghost" className="w-full mt-4 text-slate-500 hover:text-slate-300">
          <RotateCcw className="mr-2 h-4 w-4" />
          Start Over
        </Button>
      </div>
    </div>
  );
}

function ExpertHubScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 px-4 py-12 text-white">
      <div className="max-w-xl mx-auto animate-fade-in-up">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="text-center mb-8">
          <div className="text-6xl mb-4">👨‍🔧</div>
          <h2 className="text-3xl font-black mb-2">Expert Hub</h2>
          <p className="text-slate-300 text-lg mb-2">
            60 years of trade knowledge shouldn't retire when you do.
          </p>
          <p className="text-slate-400 text-sm leading-relaxed">
            Master electricians, plumbers, HVAC techs, and contractors — guide homeowners from your couch.
            Earn affiliate credits, discounts, and community recognition without picking up a wrench.
          </p>
        </div>

        {/* Two paths */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="bg-white/10 border-purple-500/30 text-white">
            <CardContent className="p-5">
              <HardHat className="h-8 w-8 text-purple-400 mb-3" />
              <div className="font-bold text-lg mb-2">I'm a Retired Pro</div>
              <p className="text-slate-400 text-sm mb-4">
                Join as a verified expert. Review photos, give advice, earn credits redeemable for affiliate discounts.
              </p>
              <div className="text-xs text-purple-400 font-semibold">
                ✓ Free to join<br />
                ✓ Work from home<br />
                ✓ Keep your mind sharp
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 border-yellow-500/30 text-white">
            <CardContent className="p-5">
              <Star className="h-8 w-8 text-yellow-400 mb-3" />
              <div className="font-bold text-lg mb-2">I Solved a Problem</div>
              <p className="text-slate-400 text-sm mb-4">
                Help others by sharing your fix. Earn discounts on Home Depot affiliate purchases and become a local expert.
              </p>
              <div className="text-xs text-yellow-400 font-semibold">
                ✓ Earn affiliate discounts<br />
                ✓ Build your reputation<br />
                ✓ Help your community
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30 text-white mb-6">
          <CardContent className="p-5">
            <div className="font-bold text-lg mb-2 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-400" />
              The Vision
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              A third-generation master electrician with a hip replacement shouldn't have to stop sharing knowledge.
              HomeHero lets experienced tradespeople mentor, advise, and earn — from anywhere — while homeowners
              get access to expertise they'd never otherwise find.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button size="lg" className="w-full bg-gradient-to-r from-purple-500 to-pink-500 font-bold text-lg py-6 rounded-2xl opacity-75 cursor-not-allowed">
            <User className="mr-2 h-5 w-5" />
            Expert Signup — Coming Soon
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full border-white/30 hover:bg-white/10 py-5 rounded-2xl">
            <Link href="/contact">Get notified when it launches</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Game Component ──────────────────────────────────────────────────────

export default function AdventureGame() {
  const [state, setState] = useState<GameState>({
    screen: "intro",
    playerRole: null,
    problemDescription: "",
    imageBase64: null,
    imagePreview: null,
    mimeType: "image/jpeg",
    diagnosis: null,
    collectedParts: new Set(),
    zipCode: "",
    completedSteps: new Set(),
  });

  const set = (update: Partial<GameState>) =>
    setState((s) => ({ ...s, ...update }));

  const handleAnalyze = async (imageBase64: string, mimeType: string, description: string) => {
    set({ screen: "analyzing", imageBase64, mimeType, problemDescription: description });
    try {
      const res = await fetch("/api/game/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          problemDescription: description,
          playerRole: state.playerRole,
        }),
      });
      if (!res.ok) throw new Error("Diagnosis failed");
      const diagnosis: DiagnosisResult = await res.json();
      set({ screen: "diagnosis", diagnosis });
    } catch {
      set({ screen: "upload" });
      alert("Diagnosis failed — check your API key or try again.");
    }
  };

  const resetGame = () =>
    setState({
      screen: "intro",
      playerRole: null,
      problemDescription: "",
      imageBase64: null,
      imagePreview: null,
      mimeType: "image/jpeg",
      diagnosis: null,
      collectedParts: new Set(),
      zipCode: "",
      completedSteps: new Set(),
    });

  const togglePart = (partName: string) => {
    const next = new Set(state.collectedParts);
    if (next.has(partName)) next.delete(partName);
    else next.add(partName);
    set({ collectedParts: next });
  };

  const toggleStep = (stepNum: number) => {
    const next = new Set(state.completedSteps);
    if (next.has(stepNum)) next.delete(stepNum);
    else next.add(stepNum);
    set({ completedSteps: next });
  };

  // Render the active screen
  switch (state.screen) {
    case "intro":
      return <IntroScreen onStart={() => set({ screen: "role" })} />;

    case "role":
      return (
        <RoleScreen
          onSelect={(role) => set({ playerRole: role, screen: "upload" })}
        />
      );

    case "upload":
      return (
        <UploadScreen
          playerRole={state.playerRole!}
          onAnalyze={handleAnalyze}
        />
      );

    case "analyzing":
      return <AnalyzingScreen />;

    case "diagnosis":
      return (
        <DiagnosisScreen
          diagnosis={state.diagnosis!}
          playerRole={state.playerRole!}
          onDIY={() => set({ screen: "diy-guide" })}
          onBookPro={() => set({ screen: "booking" })}
          onPartsQuest={() => set({ screen: "parts-quest" })}
        />
      );

    case "parts-quest":
      return (
        <PartsQuestScreen
          diagnosis={state.diagnosis!}
          collectedParts={state.collectedParts}
          onTogglePart={togglePart}
          onProceed={() => set({ screen: "diy-guide" })}
        />
      );

    case "diy-guide":
      return (
        <DIYGuideScreen
          diagnosis={state.diagnosis!}
          completedSteps={state.completedSteps}
          onToggleStep={toggleStep}
          onVictory={() => set({ screen: "victory" })}
          onGiveUp={() => set({ screen: "booking" })}
        />
      );

    case "victory":
      return (
        <VictoryScreen
          diagnosis={state.diagnosis!}
          onReset={resetGame}
          onExpertHub={() => set({ screen: "expert-hub" })}
        />
      );

    case "booking":
      return <BookingScreen onReset={resetGame} />;

    case "expert-hub":
      return (
        <ExpertHubScreen
          onBack={() => set({ screen: state.diagnosis ? "victory" : "intro" })}
        />
      );

    default:
      return <IntroScreen onStart={() => set({ screen: "role" })} />;
  }
}
