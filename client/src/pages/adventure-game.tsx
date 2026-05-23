import React, { useState } from "react";
import { Link } from "wouter";
import {
  AlertTriangle, Wrench, CheckCircle, Home, ChevronRight,
  Droplets, Wind, ShieldAlert, Sparkles, Map
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

// --- Data Model ---
type Severity = "minor" | "moderate" | "serious";

interface Problem {
  id: string;
  name: string;
  severity: Severity;
  icon: React.ElementType;
  description: string;
  symptoms: string[];
  diyTips: string[];
  whenToCallPro: string;
  serviceLink?: string;
  serviceLabel?: string;
  x: number;
  y: number;
}

interface Room {
  id: string;
  name: string;
  emoji: string;
  description: string;
  bgGradient: string;
  problems: Problem[];
}

// --- Content ---
const ROOMS: Room[] = [
  {
    id: "driveway",
    name: "Driveway",
    emoji: "🚗",
    description: "Your home's first impression.",
    bgGradient: "bg-gradient-to-br from-gray-300 to-gray-500",
    problems: [
      {
        id: "d1", name: "Cracks & Heaving", severity: "serious", icon: AlertTriangle,
        description: "Water penetration and freezing have caused structural damage.",
        symptoms: ["Uneven surfaces", "Weeds growing through gaps", "Tripping hazards"],
        diyTips: ["Pull weeds regularly", "Apply basic concrete filler for hairline cracks"],
        whenToCallPro: "When cracks are wider than a quarter inch or the concrete has sunk.",
        serviceLink: "/quote/restoration", serviceLabel: "Get a Restoration Quote",
        x: 20, y: 40,
      },
      {
        id: "d2", name: "Oil Stains", severity: "minor", icon: Droplets,
        description: "Leaking vehicles have stained the concrete.",
        symptoms: ["Dark, slippery patches", "Rainbow sheen when wet"],
        diyTips: ["Use kitty litter to absorb fresh spills", "Scrub with dish soap and a stiff brush"],
        whenToCallPro: "For old, baked-in stains covering large areas.",
        serviceLink: "/property-cleaning", serviceLabel: "Book Pressure Washing",
        x: 50, y: 75,
      },
    ],
  },
  {
    id: "patio",
    name: "Patio",
    emoji: "🪑",
    description: "The backyard oasis.",
    bgGradient: "bg-gradient-to-br from-stone-200 to-stone-400",
    problems: [
      {
        id: "p1", name: "Algae & Moss", severity: "moderate", icon: Wind,
        description: "Damp, shaded areas have developed a slick layer of green growth.",
        symptoms: ["Green/black slime", "Extremely slippery when wet", "Musty odor"],
        diyTips: ["Mix vinegar and water and scrub", "Ensure proper drainage away from the patio"],
        whenToCallPro: "When algae covers most of the surface or returns quickly after cleaning.",
        serviceLink: "/property-cleaning", serviceLabel: "Professional Cleaning",
        x: 70, y: 60,
      },
    ],
  },
  {
    id: "roof",
    name: "Roof & Gutters",
    emoji: "🏠",
    description: "Your primary defense against the elements.",
    bgGradient: "bg-gradient-to-br from-slate-600 to-slate-800",
    problems: [
      {
        id: "r1", name: "Clogged Gutters", severity: "moderate", icon: Droplets,
        description: "Leaves and debris are preventing proper water flow.",
        symptoms: ["Water spilling over edges", "Plants growing in gutters", "Stains on siding"],
        diyTips: ["Use a ladder and gloves to scoop out debris", "Install basic gutter guards"],
        whenToCallPro: "If you have a multi-story home or water is pooling near the foundation.",
        serviceLink: "/contact", serviceLabel: "Schedule Gutter Cleaning",
        x: 15, y: 20,
      },
    ],
  },
  {
    id: "siding",
    name: "Siding",
    emoji: "🧱",
    description: "The protective shell of your house.",
    bgGradient: "bg-gradient-to-br from-blue-100 to-blue-300",
    problems: [
      {
        id: "s1", name: "Mold & Mildew", severity: "moderate", icon: ShieldAlert,
        description: "Fungal growth on the shaded sides of the house.",
        symptoms: ["Black/green spotting", "Chalky residue", "Allergy flare-ups"],
        diyTips: ["Use a pump sprayer with a gentle bleach/water mix", "Trim back bushes from the house"],
        whenToCallPro: "High siding reaches or if soft-washing is required to prevent damage.",
        serviceLink: "/property-cleaning", serviceLabel: "Book a House Wash",
        x: 60, y: 50,
      },
    ],
  },
  {
    id: "deck",
    name: "Deck",
    emoji: "🪵",
    description: "Outdoor living space.",
    bgGradient: "bg-gradient-to-br from-amber-700 to-amber-900",
    problems: [
      {
        id: "dk1", name: "Splintered Wood", severity: "moderate", icon: AlertTriangle,
        description: "Sun and moisture have degraded the wood fibers.",
        symptoms: ["Rough surface", "Faded color", "Water soaks in immediately instead of beading"],
        diyTips: ["Sand down rough spots", "Apply a hardware store wood sealer"],
        whenToCallPro: "When the entire deck needs chemical stripping, sanding, and professional sealing.",
        serviceLink: "/quote", serviceLabel: "Get a Deck Restoration Quote",
        x: 40, y: 80,
      },
    ],
  },
  {
    id: "garage",
    name: "Garage",
    emoji: "🚪",
    description: "Storage and utility space.",
    bgGradient: "bg-gradient-to-br from-zinc-200 to-zinc-400",
    problems: [
      {
        id: "g1", name: "Rusty Door Tracks", severity: "minor", icon: Wrench,
        description: "Moisture has caused surface rust on functional hardware.",
        symptoms: ["Squeaking noises", "Jerky door movement"],
        diyTips: ["Apply silicone-based lubricant", "Wipe away surface rust with steel wool"],
        whenToCallPro: "If the door is unbalanced or grinding loudly (springs can be dangerous!).",
        serviceLink: "/contact", serviceLabel: "Request an Inspection",
        x: 80, y: 30,
      },
    ],
  },
];

type GamePhase = "intro" | "map" | "room" | "summary";

export default function AdventureGame() {
  const [phase, setPhase] = useState<GamePhase>("intro");
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [discoveredProblems, setDiscoveredProblems] = useState<string[]>([]);
  const [viewedRooms, setViewedRooms] = useState<string[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);

  const currentRoom = ROOMS.find((r) => r.id === currentRoomId);
  const totalProblems = ROOMS.reduce((acc, room) => acc + room.problems.length, 0);
  const isComplete = viewedRooms.length === ROOMS.length;

  const handleRoomClick = (roomId: string) => {
    setCurrentRoomId(roomId);
    setPhase("room");
    if (!viewedRooms.includes(roomId)) {
      setViewedRooms((prev) => [...prev, roomId]);
    }
  };

  const handleHotspotClick = (problem: Problem) => {
    if (!discoveredProblems.includes(problem.id)) {
      setDiscoveredProblems((prev) => [...prev, problem.id]);
    }
    setSelectedProblem(problem);
  };

  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case "minor": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "moderate": return "bg-orange-100 text-orange-800 border-orange-300";
      case "serious": return "bg-red-100 text-red-800 border-red-300";
    }
  };

  // ── Intro ──────────────────────────────────────────────────────────────────
  const renderIntro = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-fade-in-up">
      <div className="p-4 bg-orange-100 rounded-full">
        <Home className="w-16 h-16 text-orange-600" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight">Home Maintenance Explorer</h1>
      <p className="text-lg text-slate-600 max-w-xl">
        Take a virtual tour of a typical property. Find hidden maintenance issues, learn DIY fixes,
        and see how the pros handle it before small problems become big bills.
      </p>
      <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white" onClick={() => setPhase("map")}>
        Start Exploration <ChevronRight className="ml-2 w-5 h-5" />
      </Button>
    </div>
  );

  // ── Map ────────────────────────────────────────────────────────────────────
  const renderMap = () => (
    <div className="space-y-8 animate-fade-in-up">
      <div className="text-center">
        <h2 className="text-3xl font-bold">House Overview</h2>
        <p className="text-slate-500 mt-2">
          Select a room to search for issues. ({viewedRooms.length}/{ROOMS.length} checked)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ROOMS.map((room) => {
          const isViewed = viewedRooms.includes(room.id);
          const foundInRoom = room.problems.filter((p) => discoveredProblems.includes(p.id)).length;

          return (
            <Card
              key={room.id}
              className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 relative"
              onClick={() => handleRoomClick(room.id)}
            >
              <CardContent className="p-6 text-center space-y-4">
                {!isViewed && (
                  <span className="absolute top-4 right-4 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500" />
                  </span>
                )}
                <div className="text-5xl">{room.emoji}</div>
                <div>
                  <h3 className="font-bold text-xl">{room.name}</h3>
                  <p className="text-sm text-slate-500 line-clamp-1">{room.description}</p>
                </div>
                {isViewed && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1 inline" />
                    {foundInRoom}/{room.problems.length} Found
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {isComplete && (
        <div className="flex justify-center mt-8 animate-fade-in-up">
          <Button size="lg" onClick={() => setPhase("summary")}>
            View Property Report <ChevronRight className="ml-2" />
          </Button>
        </div>
      )}
    </div>
  );

  // ── Room ───────────────────────────────────────────────────────────────────
  const renderRoom = () => {
    if (!currentRoom) return null;

    return (
      <div className="space-y-6 animate-fade-in-up">
        <Button variant="outline" onClick={() => setPhase("map")}>
          ← Back to House Map
        </Button>

        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              {currentRoom.emoji} {currentRoom.name}
            </h2>
            <p className="text-slate-600">{currentRoom.description}</p>
          </div>
          <Badge>
            {currentRoom.problems.filter((p) => discoveredProblems.includes(p.id)).length} /{" "}
            {currentRoom.problems.length} Found
          </Badge>
        </div>

        <div className={`w-full h-[60vh] rounded-xl relative overflow-hidden shadow-inner ${currentRoom.bgGradient}`}>
          <div className="absolute bottom-4 right-4 text-white/50 text-sm font-medium pointer-events-none">
            Click pulsing spots to inspect
          </div>

          {currentRoom.problems.map((problem) => (
            <button
              key={problem.id}
              onClick={() => handleHotspotClick(problem)}
              className="absolute w-10 h-10 -ml-5 -mt-5 rounded-full bg-orange-500/90 animate-pulse border-2 border-white shadow-xl hover:scale-110 transition-transform flex items-center justify-center text-white"
              style={{ left: `${problem.x}%`, top: `${problem.y}%` }}
              aria-label={`Inspect ${problem.name}`}
            >
              <Map className="w-5 h-5" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ── Summary ────────────────────────────────────────────────────────────────
  const renderSummary = () => {
    const allProblems = ROOMS.flatMap((r) => r.problems);
    const seriousCount = allProblems.filter((p) => discoveredProblems.includes(p.id) && p.severity === "serious").length;
    const modCount = allProblems.filter((p) => discoveredProblems.includes(p.id) && p.severity === "moderate").length;
    const minorCount = allProblems.filter((p) => discoveredProblems.includes(p.id) && p.severity === "minor").length;

    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up">
        <div className="text-center space-y-4">
          <Sparkles className="w-16 h-16 text-orange-500 mx-auto" />
          <h2 className="text-4xl font-bold">Property Health Report</h2>
          <p className="text-xl text-slate-600">
            You discovered {discoveredProblems.length} out of {totalProblems} hidden issues.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-red-600">{seriousCount}</div>
              <div className="text-sm font-medium text-red-800 uppercase tracking-wider">Serious</div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-orange-600">{modCount}</div>
              <div className="text-sm font-medium text-orange-800 uppercase tracking-wider">Moderate</div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-yellow-600">{minorCount}</div>
              <div className="text-sm font-medium text-yellow-800 uppercase tracking-wider">Minor</div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-slate-50 p-8 rounded-xl border space-y-6">
          <h3 className="text-2xl font-bold text-center">Ready to protect your investment?</h3>
          <p className="text-center text-slate-600">
            Don't let minor wear and tear turn into major structural repairs. Let our professionals
            handle the hard work.
          </p>
          <div className="flex justify-center">
            <Button asChild size="lg" className="w-full md:w-auto">
              <Link href="/contact">Book a Professional Inspection</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // ── Root ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {phase === "intro" && renderIntro()}
        {phase === "map" && renderMap()}
        {phase === "room" && renderRoom()}
        {phase === "summary" && renderSummary()}
      </div>

      {/* Problem Detail Modal */}
      <Dialog open={!!selectedProblem} onOpenChange={() => setSelectedProblem(null)}>
        {selectedProblem && (
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <div className="flex items-center justify-between mt-2">
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <selectedProblem.icon className="w-6 h-6 text-slate-700" />
                  {selectedProblem.name}
                </DialogTitle>
                <Badge className={getSeverityColor(selectedProblem.severity)}>
                  {selectedProblem.severity}
                </Badge>
              </div>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <p className="text-slate-600">{selectedProblem.description}</p>

              <div>
                <h4 className="font-semibold mb-2">Common Symptoms:</h4>
                <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                  {selectedProblem.symptoms.map((sym, i) => (
                    <li key={i}>{sym}</li>
                  ))}
                </ul>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="diy">
                  <AccordionTrigger className="text-sm font-semibold">
                    DIY Fixes & Maintenance
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc pl-5 text-sm text-slate-600 space-y-2 mt-2">
                      {selectedProblem.diyTips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="bg-slate-100 p-4 rounded-lg border border-slate-200">
                <h4 className="font-semibold text-sm mb-1 text-slate-800">When to Call a Pro:</h4>
                <p className="text-sm text-slate-600">{selectedProblem.whenToCallPro}</p>
              </div>

              {selectedProblem.serviceLink && (
                <Button asChild className="w-full bg-orange-600 hover:bg-orange-700">
                  <Link href={selectedProblem.serviceLink}>
                    {selectedProblem.serviceLabel ?? "View Service"}
                  </Link>
                </Button>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
