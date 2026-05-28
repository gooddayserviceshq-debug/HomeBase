import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send, Sparkles, Lightbulb, Activity,
  Download, Copy, Trash2, Plus, X,
  TrendingUp, Users, FileText, BarChart2,
  Zap, Target, RefreshCw, Layers, AlertTriangle,
  RotateCcw, MessageSquare, ChevronUp,
  Mic, MicOff, Volume2, VolumeX,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ── Types ─────────────────────────────────────────────────────────────────────
type IdeaCategory = "business" | "marketing" | "technology" | "personal" | "new-venture";
type StackPlatform = "google-drive" | "claude-ai" | "video-marketing" | "homebase" | "new-company" | "personal";
type StackStatus = "active" | "stalled" | "planning" | "done";
type MobileTab = "chat" | "stack" | "pulse" | "ideas";

interface Idea { id: string; title: string; content: string; category: IdeaCategory; createdAt: string; }
interface StackItem { id: string; platform: StackPlatform; title: string; note: string; status: StackStatus; updatedAt: string; }
interface Message { role: "user" | "assistant"; content: string; }
interface BriefSection { title: string; body: string; }

// ── Config ────────────────────────────────────────────────────────────────────
const IDEA_CATEGORIES: Record<IdeaCategory, { label: string; color: string; bg: string }> = {
  business:      { label: "Business",    color: "text-blue-300",    bg: "bg-blue-900/25 border-blue-700/40" },
  marketing:     { label: "Marketing",   color: "text-emerald-300", bg: "bg-emerald-900/25 border-emerald-700/40" },
  technology:    { label: "Technology",  color: "text-violet-300",  bg: "bg-violet-900/25 border-violet-700/40" },
  personal:      { label: "Personal",    color: "text-amber-300",   bg: "bg-amber-900/25 border-amber-700/40" },
  "new-venture": { label: "New Venture", color: "text-pink-300",    bg: "bg-pink-900/25 border-pink-700/40" },
};

const STACK_PLATFORMS: Record<StackPlatform, { label: string; emoji: string; color: string }> = {
  "google-drive":    { label: "Google Drive",    emoji: "📁", color: "text-blue-300" },
  "claude-ai":       { label: "Claude AI",       emoji: "✦",  color: "text-violet-300" },
  "video-marketing": { label: "Video Marketing", emoji: "🎬", color: "text-pink-300" },
  "homebase":        { label: "HomeBase",        emoji: "🏠", color: "text-emerald-300" },
  "new-company":     { label: "New Venture",     emoji: "🚀", color: "text-amber-300" },
  "personal":        { label: "Personal",        emoji: "◎",  color: "text-indigo-300" },
};

const STACK_STATUSES: Record<StackStatus, { label: string; badge: string }> = {
  active:   { label: "Active",   badge: "text-emerald-400 bg-emerald-900/30" },
  stalled:  { label: "Stalled",  badge: "text-amber-400 bg-amber-900/30" },
  planning: { label: "Planning", badge: "text-blue-400 bg-blue-900/30" },
  done:     { label: "Done",     badge: "text-violet-500/50 bg-violet-900/15" },
};

const BRIEF_SECTIONS: Record<string, { icon: React.ReactNode; color: string; glow: string; label: string }> = {
  "STATE OF PLAY": { icon: <Activity className="w-4 h-4" />,      color: "text-emerald-400", glow: "shadow-emerald-900/60", label: "State of Play" },
  "WATCH POINT":   { icon: <AlertTriangle className="w-4 h-4" />, color: "text-amber-400",   glow: "shadow-amber-900/60",   label: "Watch Point" },
  "THE QUESTION":  { icon: <Sparkles className="w-4 h-4" />,      color: "text-violet-400",  glow: "shadow-violet-900/60",  label: "The Question" },
};

const BRIEF_FOLLOW_UPS = [
  "Dig into the Watch Point",
  "Help me answer The Question",
  "What do I do first, right now?",
  "I see it differently",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildStackContext(stack: StackItem[]): string {
  const live = stack.filter((s) => s.status !== "done");
  if (!live.length) return "";
  return `Blake's active work:\n${live.map((s) =>
    `- [${STACK_PLATFORMS[s.platform].label}] ${s.title} — ${STACK_STATUSES[s.status].label}${s.note ? " | " + s.note : ""}`
  ).join("\n")}`;
}

function parseBrief(content: string): BriefSection[] {
  const sections: BriefSection[] = [];
  let current: BriefSection | null = null;
  for (const line of content.split("\n")) {
    const header = line.match(/^\*\*([A-Z ]+)\*\*$/);
    if (header) {
      if (current) sections.push(current);
      current = { title: header[1], body: "" };
    } else if (current) {
      const t = line.trim();
      if (t) current.body += (current.body ? " " : "") + t;
    }
  }
  if (current) sections.push(current);
  return sections;
}

function renderMarkdown(text: string): React.ReactNode {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## "))  return <p key={i} className="font-bold text-white mt-3 mb-1 text-sm">{line.slice(3)}</p>;
    if (line.startsWith("### ")) return <p key={i} className="font-semibold text-violet-200 mt-2 mb-0.5 text-sm">{line.slice(4)}</p>;
    if (line.startsWith("- ") || line.startsWith("• "))
      return <div key={i} className="flex gap-2 my-0.5 text-sm"><span className="text-violet-500 shrink-0 mt-0.5">·</span><span>{renderInline(line.slice(2))}</span></div>;
    const num = line.match(/^(\d+)\.\s(.+)/);
    if (num) return <div key={i} className="flex gap-2 my-0.5 text-sm"><span className="text-violet-500 shrink-0 w-4">{num[1]}.</span><span>{renderInline(num[2])}</span></div>;
    if (!line.trim()) return <div key={i} className="h-2" />;
    return <p key={i} className="my-0.5 text-sm">{renderInline(line)}</p>;
  });
}

function renderInline(text: string): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i} className="font-semibold text-white">{p.slice(2, -2)}</strong>
      : p
  );
}

// ── Star Field ────────────────────────────────────────────────────────────────
function StarField() {
  const stars = Array.from({ length: 70 }, (_, i) => ({
    id: i, x: (i * 137.508) % 100, y: (i * 97.312) % 100,
    size: i % 7 === 0 ? 2 : 1, delay: (i * 0.19) % 6, duration: 3 + (i % 4),
    opacity: 0.12 + (i % 4) * 0.08,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      <style>{`
        @keyframes twinkle { 0%,100%{opacity:0} 40%,60%{opacity:var(--so)} }
        @keyframes drift   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes orb-pulse { 0%,100%{box-shadow:0 0 24px 4px rgba(139,92,246,.18)} 50%{box-shadow:0 0 48px 14px rgba(139,92,246,.38)} }
        @keyframes card-glow { 0%,100%{border-color:rgba(109,40,217,.2)} 50%{border-color:rgba(139,92,246,.45)} }
        @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
      {stars.map((s) => (
        <div key={s.id} className="absolute rounded-full bg-white"
          style={{ left:`${s.x}%`, top:`${s.y}%`, width:`${s.size}px`, height:`${s.size}px`,
            ["--so" as string]: s.opacity,
            animation:`twinkle ${s.duration}s ${s.delay}s infinite, drift ${s.duration*1.6}s ${s.delay}s infinite ease-in-out` }} />
      ))}
    </div>
  );
}

// ── Shared stat card ──────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, urgent=false }: { icon:React.ReactNode; label:string; value:string|number; color:string; urgent?:boolean }) {
  const c:Record<string,string> = {
    emerald:"text-emerald-400 bg-emerald-900/20 border-emerald-800/30",
    blue:"text-blue-400 bg-blue-900/20 border-blue-800/30",
    violet:"text-violet-400 bg-violet-900/20 border-violet-800/30",
    amber:"text-amber-400 bg-amber-900/20 border-amber-800/30",
    indigo:"text-indigo-400 bg-indigo-900/20 border-indigo-800/30",
    pink:"text-pink-400 bg-pink-900/20 border-pink-800/30",
  };
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${c[color]} ${urgent?"ring-1 ring-amber-500/40":""}`}>
      <div className={c[color].split(" ")[0]}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-violet-400/60 text-xs truncate">{label}</p>
        <p className="text-white font-bold text-lg leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Andromada() {
  const { toast } = useToast();

  const [messages, setMessages]         = useState<Message[]>([]);
  const [input, setInput]               = useState("");
  const [isStreaming, setIsStreaming]   = useState(false);
  const [mobileTab, setMobileTab]       = useState<MobileTab>("chat");
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef      = useRef<HTMLTextAreaElement>(null);

  const [briefContent, setBriefContent]     = useState<string>(() => {
    const today = new Date().toDateString();
    if (localStorage.getItem("andromada-brief-date") === today) return localStorage.getItem("andromada-brief") || "";
    return "";
  });
  const [briefStreaming, setBriefStreaming] = useState(false);

  const [ideas, setIdeas]           = useState<Idea[]>(() => { try { return JSON.parse(localStorage.getItem("andromada-ideas")||"[]"); } catch { return []; } });
  const [showIdeaForm, setShowIdeaForm] = useState(false);
  const [newIdea, setNewIdea]           = useState<{title:string;content:string;category:IdeaCategory}>({title:"",content:"",category:"business"});

  const [stack, setStack]               = useState<StackItem[]>(() => { try { return JSON.parse(localStorage.getItem("andromada-stack")||"[]"); } catch { return []; } });
  const [showStackForm, setShowStackForm] = useState(false);
  const [newStack, setNewStack]           = useState<{platform:StackPlatform;title:string;note:string;status:StackStatus}>({platform:"google-drive",title:"",note:"",status:"active"});

  const { data: analytics, refetch: refetchAnalytics } = useQuery<any>({ queryKey:["/api/ceo/analytics"], retry:false });

  // ── Voice state ────────────────────────────────────────────────────────────
  const [autoSpeak, setAutoSpeak]     = useState(() => localStorage.getItem("andromada-voice") !== "off");
  const [isSpeaking, setIsSpeaking]   = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthRef       = useRef<SpeechSynthesisUtterance | null>(null);

  const stripMarkdown = (text: string) =>
    text
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/#{1,6}\s/g, "")
      .replace(/^[-•]\s/gm, "")
      .replace(/^\d+\.\s/gm, "")
      .replace(/\n{2,}/g, ". ")
      .replace(/\n/g, " ")
      .trim();

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    stopSpeaking();
    const clean = stripMarkdown(text);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    const voices = window.speechSynthesis.getVoices();

    // Prefer a natural-sounding female voice
    const preferred = voices.find(v =>
      v.name === "Samantha" ||
      v.name.includes("Google UK English Female") ||
      v.name.includes("Microsoft Zira") ||
      v.name.includes("Karen") ||
      v.name.includes("Moira") ||
      (v.name.toLowerCase().includes("female") && v.lang.startsWith("en"))
    ) || voices.find(v => v.lang.startsWith("en")) || voices[0];

    if (preferred) utterance.voice = preferred;
    utterance.rate  = 0.93;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend   = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [stopSpeaking]);

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast({ title: "Microphone not supported", description: "Try Chrome or Safari" }); return; }

    stopSpeaking();
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    recognition.onstart  = () => setIsListening(true);
    recognition.onend    = () => setIsListening(false);
    recognition.onerror  = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as any[])
        .map((r: any) => r[0].transcript)
        .join("");
      setInput(transcript);
      if (event.results[event.results.length - 1].isFinal) {
        setIsListening(false);
        sendMessage(transcript);
      }
    };

    recognition.start();
  }, [stopSpeaking, toast, sendMessage]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  // Auto-speak when streaming finishes
  const prevStreamingRef = useRef(false);
  useEffect(() => {
    if (prevStreamingRef.current && !isStreaming && autoSpeak && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === "assistant" && last.content) speak(last.content);
    }
    prevStreamingRef.current = isStreaming;
  }, [isStreaming, messages, autoSpeak, speak]);

  useEffect(() => { localStorage.setItem("andromada-voice", autoSpeak ? "on" : "off"); }, [autoSpeak]);

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);
  useEffect(() => { localStorage.setItem("andromada-ideas", JSON.stringify(ideas)); }, [ideas]);
  useEffect(() => { localStorage.setItem("andromada-stack", JSON.stringify(stack)); }, [stack]);

  // ── Brief ──────────────────────────────────────────────────────────────────
  const generateBrief = useCallback(async () => {
    setBriefContent(""); setBriefStreaming(true);
    const briefPrompt = `Generate Blake's daily brief. Use exactly these three bold headers on their own lines:\n\n**STATE OF PLAY**\n[1–2 sentences: what's moving vs stalled]\n\n**WATCH POINT**\n[1–2 sentences: the honest gap or risk needing attention]\n\n**THE QUESTION**\n[One sharp actionable question to answer today]\n\nUnder 120 words total. Start directly with **STATE OF PLAY**.`;
    try {
      const res = await fetch("/api/andromada/chat", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ messages:[{role:"user",content:briefPrompt}], context:buildStackContext(stack) }) });
      const reader = res.body!.getReader(); const dec = new TextDecoder(); let content = "";
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        for (const line of dec.decode(value).split("\n")) {
          if (!line.startsWith("data: ")) continue; const d = line.slice(6); if (d==="[DONE]") break;
          try { const p = JSON.parse(d); if (p.text) { content += p.text; setBriefContent(content); } } catch {}
        }
      }
      localStorage.setItem("andromada-brief", content);
      localStorage.setItem("andromada-brief-date", new Date().toDateString());
    } catch {} finally { setBriefStreaming(false); }
  }, [stack]);

  useEffect(() => {
    if (localStorage.getItem("andromada-brief-date") !== new Date().toDateString()) generateBrief();
  }, []); // eslint-disable-line

  // ── Chat ───────────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return;
    const userMsg:Message = { role:"user", content:content.trim() };
    const updated = [...messages, userMsg];
    setMessages([...updated, {role:"assistant",content:""}]);
    setInput(""); setIsStreaming(true);
    try {
      const res = await fetch("/api/andromada/chat", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ messages:updated, context:buildStackContext(stack) }) });
      if (!res.ok) throw new Error();
      const reader = res.body!.getReader(); const dec = new TextDecoder(); let ac = "";
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        for (const line of dec.decode(value).split("\n")) {
          if (!line.startsWith("data: ")) continue; const d = line.slice(6); if (d==="[DONE]") break;
          try { const p = JSON.parse(d); if (p.text) { ac+=p.text; setMessages(prev => { const c=[...prev]; c[c.length-1]={role:"assistant",content:ac}; return c; }); } } catch {}
        }
      }
    } catch { toast({title:"Connection error",variant:"destructive"}); setMessages(p=>p.slice(0,-1)); }
    finally { setIsStreaming(false); setTimeout(()=>inputRef.current?.focus(),50); }
  }, [messages, isStreaming, toast, stack]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  // ── Ideas ──────────────────────────────────────────────────────────────────
  const addIdea = () => {
    if (!newIdea.title.trim()) return;
    setIdeas(p=>[{id:Date.now().toString(),...newIdea,title:newIdea.title.trim(),content:newIdea.content.trim(),createdAt:new Date().toISOString()},...p]);
    setNewIdea({title:"",content:"",category:"business"}); setShowIdeaForm(false); toast({title:"Idea captured"});
  };

  const exportAll = () => {
    if (!ideas.length && !stack.length) { toast({title:"Nothing to export yet"}); return; }
    const ideaSections = Object.entries(IDEA_CATEGORIES).map(([cat,cfg]) => {
      const ci = ideas.filter(i=>i.category===cat); if (!ci.length) return null;
      return `## ${cfg.label}\n\n${ci.map(i=>`### ${i.title}\n${i.content||"_No details_"}\n_${new Date(i.createdAt).toLocaleDateString()}_`).join("\n\n")}`;
    }).filter(Boolean).join("\n\n---\n\n");
    const stackSection = stack.length ? `## Active Stack\n\n${stack.map(s=>`**[${STACK_PLATFORMS[s.platform].label}]** ${s.title} — ${STACK_STATUSES[s.status].label}${s.note?"\n> "+s.note:""}`).join("\n\n")}` : "";
    const briefSection = briefContent ? `## Today's Brief\n\n${briefContent}` : "";
    const md = [`# Andromada Export — Blake McConnell\n_${new Date().toLocaleDateString()}_`,briefSection,stackSection,ideaSections].filter(Boolean).join("\n\n---\n\n");
    const blob = new Blob([md],{type:"text/markdown"}); const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download=`andromada-${new Date().toISOString().slice(0,10)}.md`; a.click(); URL.revokeObjectURL(url);
    toast({title:"Exported"});
  };

  // ── Stack ──────────────────────────────────────────────────────────────────
  const addStackItem = () => {
    if (!newStack.title.trim()) return;
    setStack(p=>[{id:Date.now().toString(),...newStack,title:newStack.title.trim(),updatedAt:new Date().toISOString()},...p]);
    setNewStack({platform:"google-drive",title:"",note:"",status:"active"}); setShowStackForm(false); toast({title:"Added to stack"});
  };
  const updateStackStatus = (id:string,status:StackStatus) =>
    setStack(p=>p.map(s=>s.id===id?{...s,status,updatedAt:new Date().toISOString()}:s));

  // ── Derived ────────────────────────────────────────────────────────────────
  const keyMetrics    = analytics?.keyMetrics;
  const activeCount   = stack.filter(s=>s.status!=="done").length;
  const stalledCount  = stack.filter(s=>s.status==="stalled").length;
  const briefSections = parseBrief(briefContent);
  const showBrief     = briefContent || briefStreaming;

  // ── Brief card (shared between mobile and desktop) ─────────────────────────
  const BriefCard = () => (
    <div className="rounded-2xl border overflow-hidden" style={{animation:"card-glow 3s infinite",borderColor:"rgba(109,40,217,.25)"}}>
      <div className="px-4 py-3 border-b border-violet-800/25 flex items-center justify-between" style={{background:"linear-gradient(135deg,rgba(109,40,217,.18),rgba(67,56,202,.1))"}}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-violet-200 text-xs font-bold uppercase tracking-widest">Daily Brief</span>
        </div>
        <span className="text-violet-500/50 text-xs">{new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</span>
      </div>
      {briefStreaming && briefSections.length===0 && (
        <div className="px-5 py-5 flex gap-1.5">
          {[0,150,300].map(d=><div key={d} className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{animationDelay:`${d}ms`}} />)}
        </div>
      )}
      {briefSections.map((section,i) => {
        const cfg = BRIEF_SECTIONS[section.title]; if (!cfg) return null;
        return (
          <div key={i} className={`px-4 py-4 ${i<briefSections.length-1?"border-b border-violet-900/20":""}`}>
            <div className={`flex items-center gap-2 mb-2 ${cfg.color}`}>
              {cfg.icon}
              <span className="text-[10px] font-bold uppercase tracking-widest">{cfg.label}</span>
            </div>
            <p className="text-violet-100 text-sm leading-relaxed">{section.body}</p>
          </div>
        );
      })}
      {briefStreaming && briefSections.length>0 && (
        <div className="px-4 pb-3 flex gap-1">
          {[0,150,300].map(d=><div key={d} className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{animationDelay:`${d}ms`}} />)}
        </div>
      )}
    </div>
  );

  // ── Chat panel content (shared) ────────────────────────────────────────────
  const ChatContent = ({ compact=false }:{compact?:boolean}) => (
    <ScrollArea className="flex-1 px-4 py-5">
      <div className={`${compact?"":"max-w-2xl mx-auto"} space-y-4`}>
        {/* Brief + empty state */}
        {messages.length===0 && (
          <>
            {/* Mobile hero */}
            {compact && (
              <div className="flex flex-col items-center pt-4 pb-2 text-center">
                <div className="relative mb-3">
                  <div className="absolute inset-0 rounded-full blur-2xl scale-150" style={{background:"radial-gradient(circle,rgba(139,92,246,.35),transparent)"}} />
                  <div className="relative w-14 h-14 rounded-full flex items-center justify-center" style={{background:"linear-gradient(135deg,#7c3aed,#4338ca)",animation:"orb-pulse 3s infinite"}}>
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h1 className="text-white font-bold text-xl tracking-[.18em] uppercase mb-1">Andromada</h1>
                <p className="text-violet-400/50 text-xs">
                  {stalledCount>0
                    ? <span className="text-amber-400/80">{stalledCount} item{stalledCount>1?"s":""} stalled</span>
                    : activeCount>0 ? `${activeCount} in motion` : "Your Strategic Partner"}
                </p>
              </div>
            )}

            {/* Brief card */}
            {showBrief && (
              <div className={compact?"":""}>
                <BriefCard />
              </div>
            )}

            {/* Follow-up prompts */}
            {!briefStreaming && showBrief && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {BRIEF_FOLLOW_UPS.map((p,i) => (
                  <button key={i} onClick={()=>sendMessage(p)} disabled={isStreaming}
                    className="text-left px-3 py-2.5 rounded-xl bg-violet-900/15 border border-violet-800/20 text-violet-300 text-xs hover:bg-violet-900/30 hover:border-violet-600/35 transition-all disabled:opacity-40 leading-snug">
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* No brief yet */}
            {!showBrief && (
              <div className="flex flex-col items-center py-10 gap-4">
                {!compact && (
                  <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{background:"linear-gradient(135deg,rgba(124,58,237,.4),rgba(67,56,202,.3))",animation:"orb-pulse 3s infinite"}}>
                    <Sparkles className="w-6 h-6 text-violet-400" />
                  </div>
                )}
                <p className="text-violet-400/50 text-sm text-center">Generating your brief…</p>
              </div>
            )}
          </>
        )}

        {/* Messages */}
        {messages.map((msg,i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role==="user"?"justify-end":"justify-start"}`}>
            {msg.role==="assistant" && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1"
                style={{background:"linear-gradient(135deg,#7c3aed,#4338ca)",animation:isStreaming&&i===messages.length-1?"orb-pulse 1.5s infinite":undefined}}>
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            )}
            <div className={`max-w-[84%] px-4 py-3 rounded-2xl ${
              msg.role==="user"
                ?"bg-violet-700/20 border border-violet-600/20 text-white rounded-tr-sm"
                :"bg-[#0f0f28] border border-violet-900/25 text-violet-100 rounded-tl-sm"}`}>
              {msg.role==="assistant"&&msg.content===""
                ? <div className="flex gap-1 py-1">{[0,150,300].map(d=><div key={d} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{animationDelay:`${d}ms`}} />)}</div>
                : msg.role==="assistant"
                  ? <div className="leading-relaxed">{renderMarkdown(msg.content)}</div>
                  : <p className="text-sm leading-relaxed">{msg.content}</p>}
            </div>
          </div>
        ))}
        <div ref={chatBottomRef} />
      </div>
    </ScrollArea>
  );

  // ── Chat input (shared) ────────────────────────────────────────────────────
  const ChatInput = () => (
    <div className="shrink-0 border-t border-violet-900/20 bg-[#09091e]/90 backdrop-blur p-3">
      {isSpeaking && (
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="flex gap-0.5 items-end h-4">
            {[1,2,3,2,1].map((h,i)=>(
              <div key={i} className="w-0.5 bg-violet-400 rounded-full"
                style={{ height:`${h*4}px`, animation:`wave-bar ${0.6+i*0.1}s ${i*0.1}s infinite ease-in-out alternate` }} />
            ))}
          </div>
          <span className="text-violet-400 text-xs">Speaking…</span>
          <button onClick={stopSpeaking} className="text-violet-500 hover:text-violet-300 ml-auto text-xs underline">stop</button>
          <style>{`@keyframes wave-bar{from{transform:scaleY(0.4)}to{transform:scaleY(1.4)}}`}</style>
        </div>
      )}
      {stack.filter(s=>s.status!=="done").slice(0,3).length>0 && !isSpeaking && (
        <div className="flex gap-1.5 flex-wrap mb-2">
          {stack.filter(s=>s.status!=="done").slice(0,3).map(s=>(
            <span key={s.id} className={`text-[10px] px-2 py-0.5 rounded-full border ${s.status==="stalled"?"bg-amber-900/20 border-amber-800/30 text-amber-400":"bg-violet-900/20 border-violet-800/25 text-violet-400"}`}>
              {STACK_PLATFORMS[s.platform].emoji} {s.title}
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2 items-end">
        {/* Mic button */}
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={isStreaming || isSpeaking}
          className={`shrink-0 h-11 w-11 rounded-xl flex items-center justify-center transition-all ${
            isListening
              ? "bg-red-600/80 text-white"
              : "bg-[#0f0f28] border border-violet-800/30 text-violet-500 hover:text-violet-300 hover:border-violet-600/50 disabled:opacity-40"
          }`}
          style={isListening ? {animation:"orb-pulse 1s infinite"} : undefined}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <Textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening…" : "Talk to Andromada…"} disabled={isStreaming || isListening}
          className="min-h-[44px] max-h-32 resize-none bg-[#0f0f28] border-violet-800/30 text-white placeholder:text-violet-500/35 focus:border-violet-600 rounded-xl text-sm" />

        <Button onClick={()=>sendMessage(input)} disabled={!input.trim()||isStreaming||isListening}
          className="bg-violet-700 hover:bg-violet-600 text-white shrink-0 rounded-xl h-11 px-4">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  // ── Stack panel content (shared) ───────────────────────────────────────────
  const StackContent = () => (
    <>
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-violet-900/20">
        <div>
          <p className="text-white font-semibold text-sm">Active Stack</p>
          <p className="text-violet-500/50 text-xs">Andromada reads this automatically</p>
        </div>
        <Button variant="ghost" size="sm" onClick={()=>setShowStackForm(true)} className="h-8 gap-1.5 text-violet-400 hover:text-violet-200 text-xs">
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>
      {showStackForm && (
        <div className="shrink-0 mx-4 mt-3 bg-[#0f0f28] border border-violet-800/30 rounded-xl p-3 space-y-2">
          <Input autoFocus placeholder="What are you working on?" value={newStack.title}
            onChange={e=>setNewStack(p=>({...p,title:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addStackItem()}
            className="bg-transparent border-violet-800/30 text-white text-sm placeholder:text-violet-600 h-9" />
          <Input placeholder="Quick note (optional)" value={newStack.note}
            onChange={e=>setNewStack(p=>({...p,note:e.target.value}))}
            className="bg-transparent border-violet-800/30 text-white text-xs placeholder:text-violet-600 h-8" />
          <div className="grid grid-cols-2 gap-2">
            <select value={newStack.platform} onChange={e=>setNewStack(p=>({...p,platform:e.target.value as StackPlatform}))}
              className="bg-[#060611] border border-violet-800/30 text-violet-300 text-xs rounded-lg px-2 py-2 focus:outline-none">
              {Object.entries(STACK_PLATFORMS).map(([k,v])=><option key={k} value={k}>{v.emoji} {v.label}</option>)}
            </select>
            <select value={newStack.status} onChange={e=>setNewStack(p=>({...p,status:e.target.value as StackStatus}))}
              className="bg-[#060611] border border-violet-800/30 text-violet-300 text-xs rounded-lg px-2 py-2 focus:outline-none">
              {Object.entries(STACK_STATUSES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={addStackItem} className="flex-1 bg-violet-700 hover:bg-violet-600 text-white text-xs h-8">Add to Stack</Button>
            <Button size="sm" variant="ghost" onClick={()=>setShowStackForm(false)} className="text-violet-500 h-8 w-8 p-0"><X className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
      )}
      <ScrollArea className="flex-1 px-4 py-3">
        {stack.length===0 ? (
          <div className="text-center py-12 space-y-3">
            <Layers className="w-10 h-10 text-violet-700/30 mx-auto" />
            <p className="text-violet-400/40 text-sm font-medium">Nothing tracked yet</p>
            <p className="text-violet-600/30 text-xs max-w-[200px] mx-auto leading-relaxed">Add your Google Drive docs, video projects, Claude builds — anything live across your work.</p>
            <button onClick={()=>setShowStackForm(true)} className="text-violet-400 text-sm hover:text-violet-200 underline">Add first item</button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {stack.map(item=>(
              <div key={item.id} className={`rounded-2xl border p-4 group ${item.status==="stalled"?"border-amber-800/35 bg-amber-900/8":"border-violet-900/25 bg-[#0f0f28]"}`}>
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0">{STACK_PLATFORMS[item.platform].emoji}</span>
                  <div className="flex-1 min-w-0">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${STACK_PLATFORMS[item.platform].color}`}>{STACK_PLATFORMS[item.platform].label}</span>
                    <p className="text-white font-semibold text-sm mt-0.5 leading-snug">{item.title}</p>
                    {item.note && <p className="text-violet-400/45 text-xs mt-1">{item.note}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <select value={item.status} onChange={e=>updateStackStatus(item.id,e.target.value as StackStatus)}
                        className={`text-xs rounded-lg px-2 py-1 border-0 font-semibold cursor-pointer focus:outline-none ${STACK_STATUSES[item.status].badge} bg-transparent`}
                        style={{appearance:"none"}}>
                        {Object.entries(STACK_STATUSES).map(([k,v])=><option key={k} value={k} className="bg-[#0f0f28] text-white">{v.label}</option>)}
                      </select>
                      <span className="text-violet-600/25 text-[10px]">{new Date(item.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button onClick={()=>setStack(p=>p.filter(s=>s.id!==item.id))}
                    className="opacity-0 group-hover:opacity-100 text-violet-600 hover:text-red-400 transition-all shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </>
  );

  // ── Pulse content (shared) ─────────────────────────────────────────────────
  const PulseContent = () => (
    <>
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-violet-900/20">
        <p className="text-white font-semibold text-sm">GDS Live Metrics</p>
        <button onClick={()=>refetchAnalytics()} className="text-violet-500 hover:text-violet-300 transition-colors"><RefreshCw className="w-4 h-4" /></button>
      </div>
      <ScrollArea className="flex-1 px-4 py-3 space-y-2.5">
        {keyMetrics ? (
          <div className="space-y-2.5">
            <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Est. Revenue"      value={`$${Number(keyMetrics.totalRevenue).toFixed(0)}`}  color="emerald" />
            <StatCard icon={<FileText className="w-4 h-4" />}   label="Total Quotes"      value={keyMetrics.totalQuotes}                             color="blue" />
            <StatCard icon={<Users className="w-4 h-4" />}      label="Total Customers"   value={keyMetrics.totalCustomers}                          color="violet" />
            <StatCard icon={<Target className="w-4 h-4" />}     label="Pending Inquiries" value={keyMetrics.pendingInquiries}                        color="amber" urgent={keyMetrics.pendingInquiries>0} />
            <StatCard icon={<Zap className="w-4 h-4" />}        label="Active Warranties" value={keyMetrics.activeWarranties}                        color="indigo" />
            <StatCard icon={<BarChart2 className="w-4 h-4" />}  label="Avg Quote Value"   value={`$${Number(keyMetrics.avgQuoteValue).toFixed(0)}`}  color="pink" />
            <StatCard icon={<Users className="w-4 h-4" />}      label="Repeat Rate"       value={`${keyMetrics.repeatCustomerRate}%`}                color="emerald" />
          </div>
        ) : (
          <div className="text-center py-12 space-y-3">
            <Activity className="w-10 h-10 text-violet-700/30 mx-auto" />
            <p className="text-violet-400/40 text-sm">Loading platform data…</p>
          </div>
        )}
      </ScrollArea>
    </>
  );

  // ── Ideas content (shared) ─────────────────────────────────────────────────
  const IdeasContent = () => (
    <>
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-violet-900/20">
        <p className="text-white font-semibold text-sm">Ideas Lab</p>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={async()=>{
            if(!ideas.length){toast({title:"No ideas yet"});return;}
            await navigator.clipboard.writeText(ideas.map(i=>`[${IDEA_CATEGORIES[i.category].label}] ${i.title}${i.content?"\n"+i.content:""}`).join("\n\n"));
            toast({title:"Copied"});}} className="h-8 w-8 p-0 text-violet-500 hover:text-violet-300"><Copy className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="sm" onClick={exportAll} className="h-8 w-8 p-0 text-violet-500 hover:text-violet-300"><Download className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="sm" onClick={()=>setShowIdeaForm(true)} className="h-8 w-8 p-0 text-violet-400 hover:text-violet-200"><Plus className="w-3.5 h-3.5" /></Button>
        </div>
      </div>
      {showIdeaForm && (
        <div className="shrink-0 mx-4 mt-3 bg-[#0f0f28] border border-violet-800/30 rounded-xl p-3 space-y-2">
          <Input autoFocus placeholder="Idea title…" value={newIdea.title}
            onChange={e=>setNewIdea(p=>({...p,title:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addIdea()}
            className="bg-transparent border-violet-800/30 text-white text-sm placeholder:text-violet-600 h-9" />
          <Textarea placeholder="Details (optional)…" value={newIdea.content}
            onChange={e=>setNewIdea(p=>({...p,content:e.target.value}))}
            className="bg-transparent border-violet-800/30 text-white text-xs placeholder:text-violet-600 min-h-[56px] resize-none" />
          <select value={newIdea.category} onChange={e=>setNewIdea(p=>({...p,category:e.target.value as IdeaCategory}))}
            className="w-full bg-[#060611] border border-violet-800/30 text-violet-300 text-xs rounded-lg px-2 py-2 focus:outline-none">
            {Object.entries(IDEA_CATEGORIES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
          <div className="flex gap-2">
            <Button size="sm" onClick={addIdea} className="flex-1 bg-violet-700 hover:bg-violet-600 text-white text-xs h-8">Capture</Button>
            <Button size="sm" variant="ghost" onClick={()=>setShowIdeaForm(false)} className="text-violet-500 h-8 w-8 p-0"><X className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
      )}
      <ScrollArea className="flex-1 px-4 py-3">
        {ideas.length===0 ? (
          <div className="text-center py-12 space-y-3">
            <Lightbulb className="w-10 h-10 text-violet-700/30 mx-auto" />
            <p className="text-violet-400/40 text-sm font-medium">No ideas captured yet</p>
            <button onClick={()=>setShowIdeaForm(true)} className="text-violet-400 text-sm hover:text-violet-200 underline">Add your first</button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {ideas.map(idea=>(
              <div key={idea.id} className={`rounded-2xl border p-4 group ${IDEA_CATEGORIES[idea.category].bg}`}>
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${IDEA_CATEGORIES[idea.category].color}`}>{IDEA_CATEGORIES[idea.category].label}</span>
                    <p className="text-white font-semibold text-sm mt-0.5 leading-snug">{idea.title}</p>
                    {idea.content && <p className="text-violet-300/50 text-xs mt-1 leading-relaxed line-clamp-3">{idea.content}</p>}
                    <p className="text-violet-500/30 text-[10px] mt-2">{new Date(idea.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button onClick={()=>setIdeas(p=>p.filter(i=>i.id!==idea.id))}
                    className="opacity-0 group-hover:opacity-100 text-violet-600 hover:text-red-400 transition-all mt-0.5 shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </>
  );

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen bg-[#060611] flex flex-col overflow-hidden relative">
      <StarField />

      {/* ── Shared header ── */}
      <div className="shrink-0 border-b border-violet-900/25 bg-[#09091e]/92 backdrop-blur px-4 py-3 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{background:"linear-gradient(135deg,#7c3aed,#4338ca)",animation:(briefStreaming||isStreaming)?"orb-pulse 2s infinite":undefined}}>
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-sm tracking-wide">Andromada</span>
            {stalledCount>0
              ? <span className="ml-2 text-amber-400/80 text-xs">· {stalledCount} stalled</span>
              : activeCount>0 ? <span className="ml-2 text-violet-500/60 text-xs">· {activeCount} in motion</span> : null}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Voice toggle */}
          <button
            onClick={() => { if (isSpeaking) stopSpeaking(); setAutoSpeak(p => !p); }}
            className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${autoSpeak ? "text-violet-300 bg-violet-900/30" : "text-violet-600 hover:text-violet-400"}`}
            title={autoSpeak ? "Voice on — tap to mute" : "Voice off — tap to enable"}
          >
            {autoSpeak ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <Button variant="ghost" size="sm" onClick={generateBrief} disabled={briefStreaming}
            className="text-violet-500 hover:text-violet-300 h-7 w-7 p-0">
            <RotateCcw className={`w-3.5 h-3.5 ${briefStreaming?"animate-spin":""}`} />
          </Button>
          <Button variant="ghost" size="sm" onClick={exportAll} className="text-violet-500 hover:text-violet-300 h-7 w-7 p-0">
            <Download className="w-3.5 h-3.5" />
          </Button>
          <div className="flex items-center gap-1 ml-1">
            {isSpeaking
              ? <><div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" /><span className="text-violet-400 text-xs font-medium">Speaking</span></>
              : <><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /><span className="text-emerald-400 text-xs font-medium">Live</span></>
            }
          </div>
        </div>
      </div>

      {/* ── MOBILE layout (< md) ── */}
      <div className="flex md:hidden flex-1 flex-col overflow-hidden relative z-10">
        {/* Mobile panels */}
        {mobileTab==="chat" && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <ChatContent compact={true} />
            <ChatInput />
          </div>
        )}
        {mobileTab==="stack" && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <StackContent />
          </div>
        )}
        {mobileTab==="pulse" && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <PulseContent />
          </div>
        )}
        {mobileTab==="ideas" && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <IdeasContent />
          </div>
        )}

        {/* Mobile bottom nav */}
        <div className="shrink-0 border-t border-violet-900/25 bg-[#09091e]/95 backdrop-blur px-2 py-2 grid grid-cols-4 gap-1">
          {([
            { id:"chat",  icon:<MessageSquare className="w-5 h-5" />, label:"Chat" },
            { id:"stack", icon:<Layers className="w-5 h-5" />,        label:"Stack", badge: activeCount },
            { id:"pulse", icon:<Activity className="w-5 h-5" />,      label:"Pulse" },
            { id:"ideas", icon:<Lightbulb className="w-5 h-5" />,     label:"Ideas", badge: ideas.length },
          ] as {id:MobileTab;icon:React.ReactNode;label:string;badge?:number}[]).map(tab=>(
            <button key={tab.id} onClick={()=>setMobileTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-all relative ${mobileTab===tab.id?"text-violet-300 bg-violet-900/30":"text-violet-600 hover:text-violet-400"}`}>
              <div className="relative">
                {tab.icon}
                {tab.badge!=null && tab.badge>0 && (
                  <span className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] text-white flex items-center justify-center font-bold leading-none ${tab.id==="stack"&&stalledCount>0?"bg-amber-500":"bg-violet-600"}`}>
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── DESKTOP layout (>= md) ── */}
      <div className="hidden md:flex flex-1 overflow-hidden relative z-10">
        {/* Chat */}
        <div className="flex flex-1 flex-col min-w-0 border-r border-violet-900/20">
          <ChatContent />
          <ChatInput />
        </div>
        {/* Right panel */}
        <div className="w-72 xl:w-80 shrink-0 flex flex-col bg-[#07071a]/90 backdrop-blur">
          <Tabs defaultValue="stack" className="flex flex-col h-full">
            <TabsList className="shrink-0 bg-transparent border-b border-violet-900/20 rounded-none px-2 pt-2 gap-0.5 h-auto pb-0">
              <TabsTrigger value="stack" className="data-[state=active]:bg-violet-900/30 data-[state=active]:text-violet-200 text-violet-500 rounded-lg rounded-b-none text-xs flex gap-1.5 py-2 px-2.5">
                <Layers className="w-3 h-3" /> Stack
                {activeCount>0&&<span className={`text-[10px] rounded-full px-1.5 py-0.5 leading-none ${stalledCount>0?"bg-amber-700/50 text-amber-300":"bg-violet-700/50 text-violet-300"}`}>{activeCount}</span>}
              </TabsTrigger>
              <TabsTrigger value="pulse" className="data-[state=active]:bg-violet-900/30 data-[state=active]:text-violet-200 text-violet-500 rounded-lg rounded-b-none text-xs flex gap-1.5 py-2 px-2.5">
                <Activity className="w-3 h-3" /> Pulse
              </TabsTrigger>
              <TabsTrigger value="ideas" className="data-[state=active]:bg-violet-900/30 data-[state=active]:text-violet-200 text-violet-500 rounded-lg rounded-b-none text-xs flex gap-1.5 py-2 px-2.5">
                <Lightbulb className="w-3 h-3" /> Ideas
                {ideas.length>0&&<span className="bg-violet-700/50 text-violet-300 text-[10px] rounded-full px-1.5 py-0.5 leading-none">{ideas.length}</span>}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="stack" className="flex-1 overflow-hidden m-0 flex flex-col"><StackContent /></TabsContent>
            <TabsContent value="pulse" className="flex-1 overflow-hidden m-0 flex flex-col"><PulseContent /></TabsContent>
            <TabsContent value="ideas" className="flex-1 overflow-hidden m-0 flex flex-col"><IdeasContent /></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
