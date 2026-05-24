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
  RotateCcw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

type IdeaCategory = "business" | "marketing" | "technology" | "personal" | "new-venture";
type StackPlatform = "google-drive" | "claude-ai" | "video-marketing" | "homebase" | "new-company" | "personal";
type StackStatus = "active" | "stalled" | "planning" | "done";

interface Idea {
  id: string; title: string; content: string;
  category: IdeaCategory; createdAt: string;
}
interface StackItem {
  id: string; platform: StackPlatform; title: string;
  note: string; status: StackStatus; updatedAt: string;
}
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
  done:     { label: "Done",     badge: "text-violet-500/60 bg-violet-900/15" },
};

const BRIEF_SECTIONS: Record<string, { icon: React.ReactNode; color: string; border: string }> = {
  "STATE OF PLAY": {
    icon: <Activity className="w-3.5 h-3.5" />,
    color: "text-emerald-400",
    border: "border-emerald-800/30",
  },
  "WATCH POINT": {
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    color: "text-amber-400",
    border: "border-amber-800/30",
  },
  "THE QUESTION": {
    icon: <Sparkles className="w-3.5 h-3.5" />,
    color: "text-violet-400",
    border: "border-violet-800/30",
  },
};

const BRIEF_FOLLOW_UPS = [
  "Let's dig into the Watch Point",
  "Help me answer The Question",
  "What do I do first, right now?",
  "I see it differently — here's why",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildStackContext(stack: StackItem[]): string {
  const live = stack.filter((s) => s.status !== "done");
  if (!live.length) return "";
  return `Blake's active work:\n${live
    .map((s) => `- [${STACK_PLATFORMS[s.platform].label}] ${s.title} — ${STACK_STATUSES[s.status].label}${s.note ? " | " + s.note : ""}`)
    .join("\n")}`;
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
      const trimmed = line.trim();
      if (trimmed) current.body += (current.body ? " " : "") + trimmed;
    }
  }
  if (current) sections.push(current);
  return sections;
}

function renderMarkdown(text: string): React.ReactNode {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## "))
      return <p key={i} className="font-bold text-white mt-3 mb-1 text-sm">{line.slice(3)}</p>;
    if (line.startsWith("### "))
      return <p key={i} className="font-semibold text-violet-200 mt-2 mb-0.5 text-sm">{line.slice(4)}</p>;
    if (line.startsWith("- ") || line.startsWith("• "))
      return (
        <div key={i} className="flex gap-2 my-0.5 text-sm">
          <span className="text-violet-500 shrink-0 mt-0.5">·</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      );
    const num = line.match(/^(\d+)\.\s(.+)/);
    if (num)
      return (
        <div key={i} className="flex gap-2 my-0.5 text-sm">
          <span className="text-violet-500 shrink-0 w-4">{num[1]}.</span>
          <span>{renderInline(num[2])}</span>
        </div>
      );
    if (!line.trim()) return <div key={i} className="h-2" />;
    return <p key={i} className="my-0.5 text-sm">{renderInline(line)}</p>;
  });
}

function renderInline(text: string): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>
      : part
  );
}

// ── Star Field ────────────────────────────────────────────────────────────────

function StarField() {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: ((i * 137.508) % 100),
    y: ((i * 97.312) % 100),
    size: i % 5 === 0 ? 2 : 1,
    delay: (i * 0.23) % 5,
    duration: 3 + (i % 4),
    opacity: 0.15 + (i % 3) * 0.1,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0; }
          40%, 60% { opacity: var(--star-opacity); }
        }
        @keyframes drift {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
          100% { transform: translateY(0px); }
        }
        @keyframes andromada-pulse {
          0%, 100% { box-shadow: 0 0 20px 2px rgba(139,92,246,0.15); }
          50%        { box-shadow: 0 0 40px 8px rgba(139,92,246,0.35); }
        }
        @keyframes brief-glow {
          0%, 100% { border-color: rgba(109,40,217,0.25); }
          50%        { border-color: rgba(139,92,246,0.5); }
        }
      `}</style>
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`, top: `${s.y}%`,
            width: `${s.size}px`, height: `${s.size}px`,
            ["--star-opacity" as string]: s.opacity,
            animation: `twinkle ${s.duration}s ${s.delay}s infinite, drift ${s.duration * 1.5}s ${s.delay}s infinite ease-in-out`,
          }}
        />
      ))}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color, urgent = false }: {
  icon: React.ReactNode; label: string; value: string | number; color: string; urgent?: boolean;
}) {
  const colors: Record<string, string> = {
    emerald: "text-emerald-400 bg-emerald-900/20 border-emerald-800/30",
    blue:    "text-blue-400 bg-blue-900/20 border-blue-800/30",
    violet:  "text-violet-400 bg-violet-900/20 border-violet-800/30",
    amber:   "text-amber-400 bg-amber-900/20 border-amber-800/30",
    indigo:  "text-indigo-400 bg-indigo-900/20 border-indigo-800/30",
    pink:    "text-pink-400 bg-pink-900/20 border-pink-800/30",
  };
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${colors[color]} ${urgent ? "ring-1 ring-amber-500/40" : ""}`}>
      <div className={colors[color].split(" ")[0]}>{icon}</div>
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

  // Chat
  const [messages, setMessages]     = useState<Message[]>([]);
  const [input, setInput]           = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef      = useRef<HTMLTextAreaElement>(null);

  // Daily Brief
  const [briefContent, setBriefContent]   = useState<string>(() => {
    const today = new Date().toDateString();
    if (localStorage.getItem("andromada-brief-date") === today)
      return localStorage.getItem("andromada-brief") || "";
    return "";
  });
  const [briefStreaming, setBriefStreaming] = useState(false);

  // Ideas
  const [ideas, setIdeas]           = useState<Idea[]>(() => {
    try { return JSON.parse(localStorage.getItem("andromada-ideas") || "[]"); } catch { return []; }
  });
  const [showIdeaForm, setShowIdeaForm] = useState(false);
  const [newIdea, setNewIdea]           = useState<{ title: string; content: string; category: IdeaCategory }>({
    title: "", content: "", category: "business",
  });

  // Stack
  const [stack, setStack]             = useState<StackItem[]>(() => {
    try { return JSON.parse(localStorage.getItem("andromada-stack") || "[]"); } catch { return []; }
  });
  const [showStackForm, setShowStackForm] = useState(false);
  const [newStack, setNewStack]           = useState<{ platform: StackPlatform; title: string; note: string; status: StackStatus }>({
    platform: "google-drive", title: "", note: "", status: "active",
  });

  // Analytics
  const { data: analytics, refetch: refetchAnalytics } = useQuery<any>({
    queryKey: ["/api/ceo/analytics"],
    retry: false,
  });

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { localStorage.setItem("andromada-ideas", JSON.stringify(ideas)); }, [ideas]);
  useEffect(() => { localStorage.setItem("andromada-stack", JSON.stringify(stack)); }, [stack]);

  // ── Brief Generator ────────────────────────────────────────────────────────
  const generateBrief = useCallback(async () => {
    setBriefContent("");
    setBriefStreaming(true);

    const context = buildStackContext(stack);
    const briefPrompt = `Generate Blake's daily brief. Respond with exactly these three bold headers on their own lines, each followed by 1–2 sentences:

**STATE OF PLAY**
[What's moving vs stalled across his active work]

**WATCH POINT**
[The one honest gap, risk, or thing he's avoiding that needs attention]

**THE QUESTION**
[One sharp, specific question he should answer today — something that unblocks real progress]

Under 120 words total. Direct. No opener. No sign-off. Start immediately with **STATE OF PLAY**.`;

    try {
      const res = await fetch("/api/andromada/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: briefPrompt }],
          context,
        }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let content = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) { content += parsed.text; setBriefContent(content); }
          } catch {}
        }
      }

      localStorage.setItem("andromada-brief", content);
      localStorage.setItem("andromada-brief-date", new Date().toDateString());
    } catch {
      // fail silently
    } finally {
      setBriefStreaming(false);
    }
  }, [stack]);

  // Auto-generate on first daily open
  useEffect(() => {
    const today = new Date().toDateString();
    if (localStorage.getItem("andromada-brief-date") !== today) {
      generateBrief();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Chat ──────────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return;

    const userMsg: Message = { role: "user", content: content.trim() };
    const updated = [...messages, userMsg];
    setMessages([...updated, { role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);

    try {
      const res = await fetch("/api/andromada/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated, context: buildStackContext(stack) }),
      });

      if (!res.ok) throw new Error();

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              assistantContent += parsed.text;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: assistantContent };
                return copy;
              });
            }
          } catch {}
        }
      }
    } catch {
      toast({ title: "Connection error", variant: "destructive" });
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsStreaming(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [messages, isStreaming, toast, stack]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  // ── Ideas ─────────────────────────────────────────────────────────────────
  const addIdea = () => {
    if (!newIdea.title.trim()) return;
    setIdeas((p) => [{ id: Date.now().toString(), ...newIdea, title: newIdea.title.trim(), content: newIdea.content.trim(), createdAt: new Date().toISOString() }, ...p]);
    setNewIdea({ title: "", content: "", category: "business" });
    setShowIdeaForm(false);
    toast({ title: "Idea captured" });
  };

  const exportAll = () => {
    if (!ideas.length && !stack.length) { toast({ title: "Nothing to export yet" }); return; }

    const ideaSections = Object.entries(IDEA_CATEGORIES).map(([cat, cfg]) => {
      const catIdeas = ideas.filter((i) => i.category === cat);
      if (!catIdeas.length) return null;
      return `## ${cfg.label}\n\n${catIdeas.map((i) => `### ${i.title}\n${i.content || "_No details_"}\n_${new Date(i.createdAt).toLocaleDateString()}_`).join("\n\n")}`;
    }).filter(Boolean).join("\n\n---\n\n");

    const stackSection = stack.length
      ? `## Active Stack\n\n${stack.map((s) => `**[${STACK_PLATFORMS[s.platform].label}]** ${s.title} — ${STACK_STATUSES[s.status].label}${s.note ? "\n> " + s.note : ""}`).join("\n\n")}`
      : "";

    const briefSection = briefContent
      ? `## Today's Brief\n\n${briefContent}`
      : "";

    const md = [`# Andromada Export — Blake McConnell\n_${new Date().toLocaleDateString()}_`, briefSection, stackSection, ideaSections].filter(Boolean).join("\n\n---\n\n");

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `andromada-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Ideas + stack + brief downloaded" });
  };

  // ── Stack ─────────────────────────────────────────────────────────────────
  const addStackItem = () => {
    if (!newStack.title.trim()) return;
    setStack((p) => [{ id: Date.now().toString(), ...newStack, title: newStack.title.trim(), updatedAt: new Date().toISOString() }, ...p]);
    setNewStack({ platform: "google-drive", title: "", note: "", status: "active" });
    setShowStackForm(false);
    toast({ title: "Added to stack" });
  };

  const updateStackStatus = (id: string, status: StackStatus) =>
    setStack((p) => p.map((s) => s.id === id ? { ...s, status, updatedAt: new Date().toISOString() } : s));

  // ── Derived ────────────────────────────────────────────────────────────────
  const keyMetrics = analytics?.keyMetrics;
  const activeStackCount = stack.filter((s) => s.status !== "done").length;
  const stalledCount = stack.filter((s) => s.status === "stalled").length;
  const briefSections = parseBrief(briefContent);
  const showBrief = briefContent || briefStreaming;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen bg-[#060611] flex flex-col overflow-hidden relative">
      <StarField />

      {/* ── Header ── */}
      <div className="shrink-0 border-b border-violet-900/30 bg-[#09091e]/90 backdrop-blur px-5 py-3 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center"
            style={{ animation: (briefStreaming || isStreaming) ? "andromada-pulse 2s infinite" : undefined }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base tracking-wide leading-none">Andromada</h1>
            <p className="text-violet-400/70 text-xs mt-0.5">
              {stalledCount > 0
                ? <span className="text-amber-400/90">{stalledCount} item{stalledCount > 1 ? "s" : ""} stalled — let's talk about it</span>
                : activeStackCount > 0
                ? <span>{activeStackCount} thing{activeStackCount > 1 ? "s" : ""} in motion</span>
                : "Blake's Strategic Partner"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost" size="sm"
            onClick={generateBrief}
            disabled={briefStreaming}
            className="text-violet-500 hover:text-violet-300 text-xs h-7 px-2 gap-1.5"
          >
            <RotateCcw className={`w-3 h-3 ${briefStreaming ? "animate-spin" : ""}`} />
            New Brief
          </Button>
          <Button
            variant="ghost" size="sm"
            onClick={exportAll}
            className="text-violet-500 hover:text-violet-300 text-xs h-7 px-2 gap-1.5"
          >
            <Download className="w-3 h-3" /> Export
          </Button>
          <div className="flex items-center gap-1.5 ml-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden relative z-10">

        {/* ── Chat ── */}
        <div className="flex flex-1 flex-col min-w-0 border-r border-violet-900/20">
          <ScrollArea className="flex-1 px-4 py-5">
            <div className="max-w-2xl mx-auto space-y-6">

              {/* Daily Brief Card */}
              {showBrief && messages.length === 0 && (
                <div
                  className="rounded-2xl border bg-gradient-to-b from-[#0f0f2a] to-[#09091e] overflow-hidden"
                  style={{ animation: "brief-glow 3s infinite" }}
                >
                  {/* Card header */}
                  <div className="px-5 py-3 border-b border-violet-800/25 flex items-center justify-between bg-violet-900/15">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                      <span className="text-violet-300 text-xs font-bold uppercase tracking-widest">Daily Brief</span>
                    </div>
                    <span className="text-violet-500/50 text-xs">
                      {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                    </span>
                  </div>

                  {/* Streaming placeholder */}
                  {briefStreaming && briefSections.length === 0 && (
                    <div className="px-5 py-6 flex gap-1.5">
                      {[0, 150, 300].map((d) => (
                        <div key={d} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  )}

                  {/* Sections */}
                  {briefSections.map((section, i) => {
                    const cfg = BRIEF_SECTIONS[section.title];
                    if (!cfg) return null;
                    return (
                      <div key={i} className={`px-5 py-4 ${i < briefSections.length - 1 ? "border-b border-violet-900/25" : ""}`}>
                        <div className={`flex items-center gap-2 mb-2 ${cfg.color}`}>
                          {cfg.icon}
                          <span className="text-[10px] font-bold uppercase tracking-widest">{section.title}</span>
                        </div>
                        <p className="text-violet-100 text-sm leading-relaxed">{section.body}</p>
                      </div>
                    );
                  })}

                  {/* Still streaming final dot */}
                  {briefStreaming && briefSections.length > 0 && (
                    <div className="px-5 pb-3 flex gap-1">
                      {[0, 150, 300].map((d) => (
                        <div key={d} className="w-1 h-1 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* No brief / no messages: welcome */}
              {!showBrief && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[280px] text-center gap-5 py-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-700/30 to-indigo-900/30 border border-violet-700/20 flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-white text-xl font-semibold mb-1.5">What needs to move today?</h2>
                    <p className="text-violet-300/50 text-sm max-w-xs mx-auto">Andromada is watching your stack and ready to be honest with you.</p>
                  </div>
                </div>
              )}

              {/* Follow-up prompts after brief */}
              {!briefStreaming && showBrief && messages.length === 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {BRIEF_FOLLOW_UPS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(p)}
                      disabled={isStreaming}
                      className="text-left px-3 py-2.5 rounded-lg bg-violet-900/12 border border-violet-800/20 text-violet-300 text-xs hover:bg-violet-900/30 hover:border-violet-600/40 transition-all disabled:opacity-40"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}

              {/* Message history */}
              {messages.length > 0 && (
                <div className="space-y-5">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "assistant" && (
                        <div
                          className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center shrink-0 mt-1"
                          style={{ animation: isStreaming && i === messages.length - 1 ? "andromada-pulse 1.5s infinite" : undefined }}
                        >
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className={`max-w-[82%] px-4 py-3 rounded-2xl ${
                        msg.role === "user"
                          ? "bg-violet-700/20 border border-violet-600/20 text-white rounded-tr-sm"
                          : "bg-[#0f0f28] border border-violet-900/30 text-violet-100 rounded-tl-sm"
                      }`}>
                        {msg.role === "assistant" && msg.content === "" ? (
                          <div className="flex gap-1 py-1">
                            {[0, 150, 300].map((d) => (
                              <div key={d} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                            ))}
                          </div>
                        ) : msg.role === "assistant" ? (
                          <div className="leading-relaxed">{renderMarkdown(msg.content)}</div>
                        ) : (
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input area */}
          <div className="shrink-0 border-t border-violet-900/20 bg-[#09091e]/80 backdrop-blur p-4">
            {stack.filter((s) => s.status !== "done").length > 0 && (
              <div className="max-w-2xl mx-auto mb-2 flex gap-1.5 flex-wrap">
                {stack.filter((s) => s.status !== "done").slice(0, 4).map((s) => (
                  <span key={s.id} className={`text-[10px] px-2 py-0.5 rounded-full border ${s.status === "stalled" ? "bg-amber-900/20 border-amber-800/30 text-amber-400" : "bg-violet-900/20 border-violet-800/25 text-violet-400"}`}>
                    {STACK_PLATFORMS[s.platform].emoji} {s.title}
                  </span>
                ))}
              </div>
            )}
            <div className="max-w-2xl mx-auto flex gap-2 items-end">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Talk to Andromada… (Shift+Enter for new line)"
                className="min-h-[44px] max-h-36 resize-none bg-[#0f0f28] border-violet-800/30 text-white placeholder:text-violet-500/35 focus:border-violet-600 rounded-xl text-sm"
                disabled={isStreaming}
              />
              <Button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isStreaming}
                className="bg-violet-700 hover:bg-violet-600 text-white shrink-0 rounded-xl h-11 px-4"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="w-72 xl:w-80 shrink-0 flex flex-col bg-[#07071a]/90 backdrop-blur">
          <Tabs defaultValue="stack" className="flex flex-col h-full">
            <TabsList className="shrink-0 bg-transparent border-b border-violet-900/20 rounded-none px-2 pt-2 gap-0.5 h-auto pb-0">
              <TabsTrigger value="stack" className="data-[state=active]:bg-violet-900/30 data-[state=active]:text-violet-200 text-violet-500 rounded-lg rounded-b-none text-xs flex gap-1.5 py-2 px-2.5">
                <Layers className="w-3 h-3" /> Stack
                {activeStackCount > 0 && (
                  <span className={`text-[10px] rounded-full px-1.5 py-0.5 leading-none ${stalledCount > 0 ? "bg-amber-700/50 text-amber-300" : "bg-violet-700/50 text-violet-300"}`}>
                    {activeStackCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="pulse" className="data-[state=active]:bg-violet-900/30 data-[state=active]:text-violet-200 text-violet-500 rounded-lg rounded-b-none text-xs flex gap-1.5 py-2 px-2.5">
                <Activity className="w-3 h-3" /> Pulse
              </TabsTrigger>
              <TabsTrigger value="ideas" className="data-[state=active]:bg-violet-900/30 data-[state=active]:text-violet-200 text-violet-500 rounded-lg rounded-b-none text-xs flex gap-1.5 py-2 px-2.5">
                <Lightbulb className="w-3 h-3" /> Ideas
                {ideas.length > 0 && (
                  <span className="bg-violet-700/50 text-violet-300 text-[10px] rounded-full px-1.5 py-0.5 leading-none">{ideas.length}</span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Stack Tab */}
            <TabsContent value="stack" className="flex-1 overflow-hidden m-0 flex flex-col">
              <div className="shrink-0 flex items-center justify-between px-3 pt-3 pb-2">
                <div>
                  <p className="text-violet-400/50 text-[10px] font-bold uppercase tracking-wider">Active Stack</p>
                  <p className="text-violet-500/35 text-[10px]">Andromada reads this automatically</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowStackForm(true)} className="h-6 w-6 p-0 text-violet-500 hover:text-violet-300">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>

              {showStackForm && (
                <div className="shrink-0 mx-3 mb-2 bg-[#0f0f28] border border-violet-800/30 rounded-xl p-3 space-y-2">
                  <Input autoFocus placeholder="What are you working on?"
                    value={newStack.title}
                    onChange={(e) => setNewStack((p) => ({ ...p, title: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addStackItem()}
                    className="bg-transparent border-violet-800/30 text-white text-sm placeholder:text-violet-600 h-8" />
                  <Input placeholder="Quick note (optional)"
                    value={newStack.note}
                    onChange={(e) => setNewStack((p) => ({ ...p, note: e.target.value }))}
                    className="bg-transparent border-violet-800/30 text-white text-xs placeholder:text-violet-600 h-7" />
                  <div className="grid grid-cols-2 gap-1.5">
                    <select value={newStack.platform} onChange={(e) => setNewStack((p) => ({ ...p, platform: e.target.value as StackPlatform }))}
                      className="bg-[#060611] border border-violet-800/30 text-violet-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-violet-600">
                      {Object.entries(STACK_PLATFORMS).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                    </select>
                    <select value={newStack.status} onChange={(e) => setNewStack((p) => ({ ...p, status: e.target.value as StackStatus }))}
                      className="bg-[#060611] border border-violet-800/30 text-violet-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-violet-600">
                      {Object.entries(STACK_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addStackItem} className="flex-1 bg-violet-700 hover:bg-violet-600 text-white text-xs h-7">Add</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowStackForm(false)} className="text-violet-500 h-7 w-7 p-0"><X className="w-3 h-3" /></Button>
                  </div>
                </div>
              )}

              <ScrollArea className="flex-1 px-3 pb-3">
                {stack.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <Layers className="w-7 h-7 text-violet-700/35 mx-auto" />
                    <p className="text-violet-500/35 text-xs">Nothing tracked yet.</p>
                    <p className="text-violet-600/25 text-[10px] max-w-[160px] mx-auto leading-relaxed">Add Google Drive docs, video projects, Claude builds — anything live.</p>
                    <button onClick={() => setShowStackForm(true)} className="text-violet-400 text-xs hover:text-violet-200 underline">Add first item</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stack.map((item) => (
                      <div key={item.id} className={`rounded-xl border p-3 group ${item.status === "stalled" ? "border-amber-800/35 bg-amber-900/10" : "border-violet-900/25 bg-[#0f0f28]"}`}>
                        <div className="flex items-start gap-2">
                          <span className="text-base mt-0.5 shrink-0">{STACK_PLATFORMS[item.platform].emoji}</span>
                          <div className="flex-1 min-w-0">
                            <span className={`text-[10px] font-medium ${STACK_PLATFORMS[item.platform].color}`}>{STACK_PLATFORMS[item.platform].label}</span>
                            <p className="text-white text-sm font-medium leading-snug">{item.title}</p>
                            {item.note && <p className="text-violet-400/45 text-xs mt-0.5">{item.note}</p>}
                            <div className="flex items-center gap-2 mt-1.5">
                              <select value={item.status}
                                onChange={(e) => updateStackStatus(item.id, e.target.value as StackStatus)}
                                className={`text-[10px] rounded px-1.5 py-0.5 border-0 font-semibold cursor-pointer focus:outline-none ${STACK_STATUSES[item.status].badge} bg-transparent`}
                                style={{ appearance: "none" }}>
                                {Object.entries(STACK_STATUSES).map(([k, v]) => <option key={k} value={k} className="bg-[#0f0f28] text-white">{v.label}</option>)}
                              </select>
                              <span className="text-violet-600/25 text-[10px]">{new Date(item.updatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <button onClick={() => setStack((p) => p.filter((s) => s.id !== item.id))}
                            className="opacity-0 group-hover:opacity-100 text-violet-600 hover:text-red-400 transition-all shrink-0 mt-0.5">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Pulse Tab */}
            <TabsContent value="pulse" className="flex-1 overflow-auto m-0 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-violet-400/50 text-[10px] font-bold uppercase tracking-wider">GDS Live Metrics</p>
                <button onClick={() => refetchAnalytics()} className="text-violet-500 hover:text-violet-300 transition-colors">
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
              {keyMetrics ? (
                <>
                  <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Est. Revenue"      value={`$${Number(keyMetrics.totalRevenue).toFixed(0)}`}   color="emerald" />
                  <StatCard icon={<FileText className="w-4 h-4" />}   label="Total Quotes"      value={keyMetrics.totalQuotes}                              color="blue" />
                  <StatCard icon={<Users className="w-4 h-4" />}      label="Total Customers"   value={keyMetrics.totalCustomers}                           color="violet" />
                  <StatCard icon={<Target className="w-4 h-4" />}     label="Pending Inquiries" value={keyMetrics.pendingInquiries}                         color="amber" urgent={keyMetrics.pendingInquiries > 0} />
                  <StatCard icon={<Zap className="w-4 h-4" />}        label="Active Warranties" value={keyMetrics.activeWarranties}                         color="indigo" />
                  <StatCard icon={<BarChart2 className="w-4 h-4" />}  label="Avg Quote Value"   value={`$${Number(keyMetrics.avgQuoteValue).toFixed(0)}`}   color="pink" />
                  <StatCard icon={<Users className="w-4 h-4" />}      label="Repeat Rate"       value={`${keyMetrics.repeatCustomerRate}%`}                 color="emerald" />
                </>
              ) : (
                <div className="text-violet-500/35 text-xs text-center py-10 space-y-2">
                  <Activity className="w-6 h-6 mx-auto opacity-25" />
                  <p>Loading platform data…</p>
                </div>
              )}
            </TabsContent>

            {/* Ideas Tab */}
            <TabsContent value="ideas" className="flex-1 overflow-hidden m-0 flex flex-col">
              <div className="shrink-0 flex items-center justify-between px-3 pt-3 pb-2">
                <p className="text-violet-400/50 text-[10px] font-bold uppercase tracking-wider">Ideas Lab</p>
                <div className="flex gap-0.5">
                  <Button variant="ghost" size="sm" onClick={async () => {
                    if (!ideas.length) { toast({ title: "No ideas yet" }); return; }
                    const text = ideas.map((i) => `[${IDEA_CATEGORIES[i.category].label}] ${i.title}${i.content ? "\n" + i.content : ""}`).join("\n\n");
                    await navigator.clipboard.writeText(text);
                    toast({ title: "Copied" });
                  }} className="h-6 w-6 p-0 text-violet-500 hover:text-violet-300"><Copy className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="sm" onClick={exportAll} className="h-6 w-6 p-0 text-violet-500 hover:text-violet-300"><Download className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowIdeaForm(true)} className="h-6 w-6 p-0 text-violet-500 hover:text-violet-300"><Plus className="w-3 h-3" /></Button>
                </div>
              </div>

              {showIdeaForm && (
                <div className="shrink-0 mx-3 mb-2 bg-[#0f0f28] border border-violet-800/30 rounded-xl p-3 space-y-2">
                  <Input autoFocus placeholder="Idea title…"
                    value={newIdea.title}
                    onChange={(e) => setNewIdea((p) => ({ ...p, title: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addIdea()}
                    className="bg-transparent border-violet-800/30 text-white text-sm placeholder:text-violet-600 h-8" />
                  <Textarea placeholder="Details (optional)…"
                    value={newIdea.content}
                    onChange={(e) => setNewIdea((p) => ({ ...p, content: e.target.value }))}
                    className="bg-transparent border-violet-800/30 text-white text-xs placeholder:text-violet-600 min-h-[52px] resize-none" />
                  <select value={newIdea.category} onChange={(e) => setNewIdea((p) => ({ ...p, category: e.target.value as IdeaCategory }))}
                    className="w-full bg-[#060611] border border-violet-800/30 text-violet-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-violet-600">
                    {Object.entries(IDEA_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addIdea} className="flex-1 bg-violet-700 hover:bg-violet-600 text-white text-xs h-7">Capture</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowIdeaForm(false)} className="text-violet-500 h-7 w-7 p-0"><X className="w-3 h-3" /></Button>
                  </div>
                </div>
              )}

              <ScrollArea className="flex-1 px-3 pb-3">
                {ideas.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <Lightbulb className="w-7 h-7 text-violet-700/35 mx-auto" />
                    <p className="text-violet-500/35 text-xs">No ideas captured yet.</p>
                    <button onClick={() => setShowIdeaForm(true)} className="text-violet-400 text-xs hover:text-violet-200 underline">Add your first</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {ideas.map((idea) => (
                      <div key={idea.id} className={`rounded-xl border p-3 group ${IDEA_CATEGORIES[idea.category].bg}`}>
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${IDEA_CATEGORIES[idea.category].color}`}>
                              {IDEA_CATEGORIES[idea.category].label}
                            </span>
                            <p className="text-white text-sm font-medium mt-0.5 leading-snug">{idea.title}</p>
                            {idea.content && <p className="text-violet-300/50 text-xs mt-1 leading-relaxed line-clamp-3">{idea.content}</p>}
                            <p className="text-violet-500/30 text-[10px] mt-1.5">{new Date(idea.createdAt).toLocaleDateString()}</p>
                          </div>
                          <button onClick={() => setIdeas((p) => p.filter((i) => i.id !== idea.id))}
                            className="opacity-0 group-hover:opacity-100 text-violet-600 hover:text-red-400 transition-all mt-0.5 shrink-0">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
