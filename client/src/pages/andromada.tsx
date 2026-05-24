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
  Zap, Target, RefreshCw, Layers,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ── Types ──────────────────────────────────────────────────────────────────

type IdeaCategory = "business" | "marketing" | "technology" | "personal" | "new-venture";
type StackPlatform = "google-drive" | "claude-ai" | "video-marketing" | "homebase" | "new-company" | "personal";
type StackStatus = "active" | "stalled" | "planning" | "done";

interface Idea {
  id: string;
  title: string;
  content: string;
  category: IdeaCategory;
  createdAt: string;
}

interface StackItem {
  id: string;
  platform: StackPlatform;
  title: string;
  note: string;
  status: StackStatus;
  updatedAt: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

// ── Config ─────────────────────────────────────────────────────────────────

const IDEA_CATEGORIES: Record<IdeaCategory, { label: string; color: string; bg: string }> = {
  business:       { label: "Business",     color: "text-blue-300",    bg: "bg-blue-900/25 border-blue-700/40" },
  marketing:      { label: "Marketing",    color: "text-emerald-300", bg: "bg-emerald-900/25 border-emerald-700/40" },
  technology:     { label: "Technology",   color: "text-violet-300",  bg: "bg-violet-900/25 border-violet-700/40" },
  personal:       { label: "Personal",     color: "text-amber-300",   bg: "bg-amber-900/25 border-amber-700/40" },
  "new-venture":  { label: "New Venture",  color: "text-pink-300",    bg: "bg-pink-900/25 border-pink-700/40" },
};

const STACK_PLATFORMS: Record<StackPlatform, { label: string; emoji: string; color: string }> = {
  "google-drive":    { label: "Google Drive",    emoji: "📁", color: "text-blue-300" },
  "claude-ai":       { label: "Claude AI",       emoji: "✦",  color: "text-violet-300" },
  "video-marketing": { label: "Video Marketing", emoji: "🎬", color: "text-pink-300" },
  "homebase":        { label: "HomeBase",        emoji: "🏠", color: "text-emerald-300" },
  "new-company":     { label: "New Venture",     emoji: "🚀", color: "text-amber-300" },
  "personal":        { label: "Personal",        emoji: "◎",  color: "text-indigo-300" },
};

const STACK_STATUSES: Record<StackStatus, { label: string; dot: string; badge: string }> = {
  active:   { label: "Active",    dot: "bg-emerald-400", badge: "text-emerald-400 bg-emerald-900/30" },
  stalled:  { label: "Stalled",   dot: "bg-amber-400",   badge: "text-amber-400 bg-amber-900/30" },
  planning: { label: "Planning",  dot: "bg-blue-400",    badge: "text-blue-400 bg-blue-900/30" },
  done:     { label: "Done",      dot: "bg-violet-600",  badge: "text-violet-500/60 bg-violet-900/15" },
};

const QUICK_PROMPTS = [
  "I'm juggling Google Drive, video marketing, and HomeBase — what's actually priority one?",
  "Be straight with me: am I spreading too thin?",
  "Connect the dots on everything I'm building — what's the real throughline?",
  "What should I finish before I start anything new?",
  "What's the video marketing play for GDS this month?",
  "Where is the biggest gap between what I'm doing and what moves the needle?",
];

// ── Sub-components ─────────────────────────────────────────────────────────

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

// ── Helpers ────────────────────────────────────────────────────────────────

function buildStackContext(stack: StackItem[]): string {
  const live = stack.filter((s) => s.status !== "done");
  if (!live.length) return "";
  const lines = live.map(
    (s) =>
      `- [${STACK_PLATFORMS[s.platform].label}] ${s.title} — ${STACK_STATUSES[s.status].label}${s.note ? " | " + s.note : ""}`
  );
  return `Blake's active work across platforms:\n${lines.join("\n")}`;
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function Andromada() {
  const { toast } = useToast();

  // Chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Ideas
  const [ideas, setIdeas] = useState<Idea[]>(() => {
    try { return JSON.parse(localStorage.getItem("andromada-ideas") || "[]"); } catch { return []; }
  });
  const [showIdeaForm, setShowIdeaForm] = useState(false);
  const [newIdea, setNewIdea] = useState<{ title: string; content: string; category: IdeaCategory }>({
    title: "", content: "", category: "business",
  });

  // Active Stack
  const [stack, setStack] = useState<StackItem[]>(() => {
    try { return JSON.parse(localStorage.getItem("andromada-stack") || "[]"); } catch { return []; }
  });
  const [showStackForm, setShowStackForm] = useState(false);
  const [newStack, setNewStack] = useState<{ platform: StackPlatform; title: string; note: string; status: StackStatus }>({
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

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return;

    const userMsg: Message = { role: "user", content: content.trim() };
    const updated = [...messages, userMsg];
    setMessages([...updated, { role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);

    const context = buildStackContext(stack);

    try {
      const response = await fetch("/api/andromada/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated, context }),
      });

      if (!response.ok) throw new Error("Connection failed");

      const reader = response.body!.getReader();
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
      toast({ title: "Connection error", description: "Unable to reach Andromada", variant: "destructive" });
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
    const idea: Idea = {
      id: Date.now().toString(),
      title: newIdea.title.trim(),
      content: newIdea.content.trim(),
      category: newIdea.category,
      createdAt: new Date().toISOString(),
    };
    setIdeas((prev) => [idea, ...prev]);
    setNewIdea({ title: "", content: "", category: "business" });
    setShowIdeaForm(false);
    toast({ title: "Idea captured" });
  };

  const exportIdeas = () => {
    if (!ideas.length) { toast({ title: "No ideas to export" }); return; }
    const sections = Object.entries(IDEA_CATEGORIES).map(([cat, cfg]) => {
      const catIdeas = ideas.filter((i) => i.category === cat);
      if (!catIdeas.length) return null;
      return `## ${cfg.label}\n\n${catIdeas.map((i) =>
        `### ${i.title}\n${i.content || "_No details_"}\n_${new Date(i.createdAt).toLocaleDateString()}_`
      ).join("\n\n")}`;
    }).filter(Boolean).join("\n\n---\n\n");

    const stackSection = stack.length
      ? `\n\n---\n\n## Active Stack Snapshot\n\n${stack.map((s) =>
          `**[${STACK_PLATFORMS[s.platform].label}]** ${s.title} — ${STACK_STATUSES[s.status].label}${s.note ? "\n> " + s.note : ""}`
        ).join("\n\n")}`
      : "";

    const md = `# Andromada Export — Blake McConnell\n_${new Date().toLocaleDateString()}_\n\n${sections}${stackSection}`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `andromada-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${ideas.length} ideas + stack snapshot` });
  };

  const copyIdeas = async () => {
    if (!ideas.length) { toast({ title: "No ideas to copy" }); return; }
    const text = ideas.map((i) =>
      `[${IDEA_CATEGORIES[i.category].label}] ${i.title}${i.content ? "\n" + i.content : ""}`
    ).join("\n\n");
    await navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  // ── Active Stack ──────────────────────────────────────────────────────────
  const addStackItem = () => {
    if (!newStack.title.trim()) return;
    const item: StackItem = {
      id: Date.now().toString(),
      platform: newStack.platform,
      title: newStack.title.trim(),
      note: newStack.note.trim(),
      status: newStack.status,
      updatedAt: new Date().toISOString(),
    };
    setStack((prev) => [item, ...prev]);
    setNewStack({ platform: "google-drive", title: "", note: "", status: "active" });
    setShowStackForm(false);
    toast({ title: "Added to stack" });
  };

  const updateStackStatus = (id: string, status: StackStatus) => {
    setStack((prev) => prev.map((s) => s.id === id ? { ...s, status, updatedAt: new Date().toISOString() } : s));
  };

  const deleteStackItem = (id: string) => setStack((prev) => prev.filter((s) => s.id !== id));

  const keyMetrics = analytics?.keyMetrics;
  const activeStackCount = stack.filter((s) => s.status !== "done").length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen bg-[#070712] flex flex-col overflow-hidden">

      {/* Header */}
      <div className="shrink-0 border-b border-violet-900/30 bg-[#0b0b20] px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-900/40">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base tracking-wide leading-none">Andromada</h1>
            <p className="text-violet-400/70 text-xs mt-0.5">
              Blake's Strategic Partner
              {activeStackCount > 0 && (
                <span className="ml-2 text-amber-400/80">· {activeStackCount} in motion</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Chat ── */}
        <div className="flex flex-1 flex-col min-w-0 border-r border-violet-900/25">
          <ScrollArea className="flex-1 px-4 py-5">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[320px] text-center gap-6 px-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-700/40 to-indigo-900/40 border border-violet-600/25 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-white text-xl font-semibold mb-1.5">What needs to move today, Blake?</h2>
                  <p className="text-violet-300/55 text-sm max-w-xs mx-auto leading-relaxed">
                    I see what's in your stack. I'll connect the dots honestly — not just tell you what you want to hear.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {QUICK_PROMPTS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(p)}
                      disabled={isStreaming}
                      className="text-left px-3 py-2.5 rounded-lg bg-violet-900/15 border border-violet-800/25 text-violet-300 text-xs hover:bg-violet-900/35 hover:border-violet-600/40 transition-all disabled:opacity-40"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-5 max-w-2xl mx-auto">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center shrink-0 mt-1">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-violet-700/25 border border-violet-600/25 text-white rounded-tr-sm"
                        : "bg-[#10102a] border border-violet-900/35 text-violet-100 rounded-tl-sm"
                    }`}>
                      {msg.role === "assistant" && msg.content === "" ? (
                        <div className="flex gap-1 py-1">
                          {[0, 150, 300].map((d) => (
                            <div key={d} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                          ))}
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="shrink-0 border-t border-violet-900/25 bg-[#0b0b20]/60 p-4">
            {stack.length > 0 && (
              <div className="max-w-2xl mx-auto mb-2 flex gap-1.5 flex-wrap">
                {stack.filter((s) => s.status !== "done").slice(0, 3).map((s) => (
                  <span key={s.id} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-900/25 border border-violet-800/30 text-violet-400">
                    {STACK_PLATFORMS[s.platform].emoji} {s.title}
                  </span>
                ))}
                {stack.filter((s) => s.status !== "done").length > 3 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-900/15 text-violet-500">
                    +{stack.filter((s) => s.status !== "done").length - 3} more in context
                  </span>
                )}
              </div>
            )}
            <div className="max-w-2xl mx-auto flex gap-2 items-end">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Talk to Andromada… (Shift+Enter for new line)"
                className="min-h-[44px] max-h-36 resize-none bg-[#10102a] border-violet-800/35 text-white placeholder:text-violet-500/40 focus:border-violet-600 rounded-xl text-sm"
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
        <div className="w-72 xl:w-80 shrink-0 flex flex-col bg-[#08081a]">
          <Tabs defaultValue="stack" className="flex flex-col h-full">
            <TabsList className="shrink-0 bg-transparent border-b border-violet-900/25 rounded-none px-2 pt-2 gap-0.5 h-auto pb-0">
              <TabsTrigger value="stack" className="data-[state=active]:bg-violet-900/35 data-[state=active]:text-violet-200 text-violet-500 rounded-lg rounded-b-none text-xs flex gap-1.5 py-2 px-2.5">
                <Layers className="w-3 h-3" /> Stack
                {activeStackCount > 0 && (
                  <span className="bg-amber-700/50 text-amber-300 text-[10px] rounded-full px-1.5 py-0.5 leading-none">{activeStackCount}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="pulse" className="data-[state=active]:bg-violet-900/35 data-[state=active]:text-violet-200 text-violet-500 rounded-lg rounded-b-none text-xs flex gap-1.5 py-2 px-2.5">
                <Activity className="w-3 h-3" /> Pulse
              </TabsTrigger>
              <TabsTrigger value="ideas" className="data-[state=active]:bg-violet-900/35 data-[state=active]:text-violet-200 text-violet-500 rounded-lg rounded-b-none text-xs flex gap-1.5 py-2 px-2.5">
                <Lightbulb className="w-3 h-3" /> Ideas
                {ideas.length > 0 && (
                  <span className="bg-violet-700/50 text-violet-300 text-[10px] rounded-full px-1.5 py-0.5 leading-none">{ideas.length}</span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ── Active Stack ── */}
            <TabsContent value="stack" className="flex-1 overflow-hidden m-0 flex flex-col">
              <div className="shrink-0 flex items-center justify-between px-3 pt-3 pb-2">
                <div>
                  <p className="text-violet-400/50 text-[10px] font-medium uppercase tracking-wider">Active Stack</p>
                  <p className="text-violet-500/40 text-[10px] mt-0.5">Andromada sees this as context</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowStackForm(true)} className="h-6 w-6 p-0 text-violet-500 hover:text-violet-300">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>

              {showStackForm && (
                <div className="shrink-0 mx-3 mb-2 bg-[#10102a] border border-violet-800/35 rounded-xl p-3 space-y-2">
                  <Input
                    autoFocus
                    placeholder="What are you working on?"
                    value={newStack.title}
                    onChange={(e) => setNewStack((p) => ({ ...p, title: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addStackItem()}
                    className="bg-transparent border-violet-800/35 text-white text-sm placeholder:text-violet-600 h-8"
                  />
                  <Input
                    placeholder="Quick note (optional)"
                    value={newStack.note}
                    onChange={(e) => setNewStack((p) => ({ ...p, note: e.target.value }))}
                    className="bg-transparent border-violet-800/35 text-white text-xs placeholder:text-violet-600 h-7"
                  />
                  <div className="grid grid-cols-2 gap-1.5">
                    <select
                      value={newStack.platform}
                      onChange={(e) => setNewStack((p) => ({ ...p, platform: e.target.value as StackPlatform }))}
                      className="bg-[#07071a] border border-violet-800/35 text-violet-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-violet-600"
                    >
                      {Object.entries(STACK_PLATFORMS).map(([k, v]) => (
                        <option key={k} value={k}>{v.emoji} {v.label}</option>
                      ))}
                    </select>
                    <select
                      value={newStack.status}
                      onChange={(e) => setNewStack((p) => ({ ...p, status: e.target.value as StackStatus }))}
                      className="bg-[#07071a] border border-violet-800/35 text-violet-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-violet-600"
                    >
                      {Object.entries(STACK_STATUSES).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addStackItem} className="flex-1 bg-violet-700 hover:bg-violet-600 text-white text-xs h-7">
                      Add to Stack
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowStackForm(false)} className="text-violet-500 h-7 w-7 p-0">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}

              <ScrollArea className="flex-1 px-3 pb-3">
                {stack.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <Layers className="w-7 h-7 text-violet-700/40 mx-auto" />
                    <p className="text-violet-500/40 text-xs">Nothing in your stack yet.</p>
                    <p className="text-violet-600/30 text-[10px] leading-relaxed max-w-[180px] mx-auto">
                      Add what you're actively working on — Google Drive, video marketing, new builds. Andromada tracks it all.
                    </p>
                    <button onClick={() => setShowStackForm(true)} className="text-violet-400 text-xs hover:text-violet-200 underline">
                      Add first item
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stack.map((item) => (
                      <div key={item.id} className="rounded-xl border border-violet-900/30 bg-[#0f0f28] p-3 group">
                        <div className="flex items-start gap-2">
                          <span className="text-base mt-0.5 shrink-0">{STACK_PLATFORMS[item.platform].emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={`text-[10px] font-medium ${STACK_PLATFORMS[item.platform].color}`}>
                                {STACK_PLATFORMS[item.platform].label}
                              </span>
                            </div>
                            <p className="text-white text-sm font-medium leading-snug">{item.title}</p>
                            {item.note && <p className="text-violet-400/50 text-xs mt-0.5">{item.note}</p>}
                            <div className="flex items-center gap-2 mt-1.5">
                              <select
                                value={item.status}
                                onChange={(e) => updateStackStatus(item.id, e.target.value as StackStatus)}
                                className={`text-[10px] rounded px-1.5 py-0.5 border-0 font-medium cursor-pointer focus:outline-none ${STACK_STATUSES[item.status].badge} bg-transparent`}
                                style={{ appearance: "none" }}
                              >
                                {Object.entries(STACK_STATUSES).map(([k, v]) => (
                                  <option key={k} value={k} className="bg-[#10102a] text-white">{v.label}</option>
                                ))}
                              </select>
                              <span className="text-violet-600/30 text-[10px]">
                                {new Date(item.updatedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteStackItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 text-violet-600 hover:text-red-400 transition-all shrink-0 mt-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* ── Platform Pulse ── */}
            <TabsContent value="pulse" className="flex-1 overflow-auto m-0 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-violet-400/50 text-[10px] font-medium uppercase tracking-wider">GDS Live Metrics</p>
                <button onClick={() => refetchAnalytics()} className="text-violet-500 hover:text-violet-300 transition-colors">
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
              {keyMetrics ? (
                <>
                  <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Est. Revenue"       value={`$${Number(keyMetrics.totalRevenue).toFixed(0)}`}    color="emerald" />
                  <StatCard icon={<FileText className="w-4 h-4" />}   label="Total Quotes"       value={keyMetrics.totalQuotes}                               color="blue" />
                  <StatCard icon={<Users className="w-4 h-4" />}      label="Total Customers"    value={keyMetrics.totalCustomers}                            color="violet" />
                  <StatCard icon={<Target className="w-4 h-4" />}     label="Pending Inquiries"  value={keyMetrics.pendingInquiries}                          color="amber" urgent={keyMetrics.pendingInquiries > 0} />
                  <StatCard icon={<Zap className="w-4 h-4" />}        label="Active Warranties"  value={keyMetrics.activeWarranties}                          color="indigo" />
                  <StatCard icon={<BarChart2 className="w-4 h-4" />}  label="Avg Quote Value"    value={`$${Number(keyMetrics.avgQuoteValue).toFixed(0)}`}    color="pink" />
                  <StatCard icon={<Users className="w-4 h-4" />}      label="Repeat Rate"        value={`${keyMetrics.repeatCustomerRate}%`}                  color="emerald" />
                </>
              ) : (
                <div className="text-violet-500/40 text-xs text-center py-10 space-y-2">
                  <Activity className="w-6 h-6 mx-auto opacity-30" />
                  <p>Loading platform data…</p>
                  <p className="text-[10px]">Sign in to view live stats</p>
                </div>
              )}
            </TabsContent>

            {/* ── Ideas Lab ── */}
            <TabsContent value="ideas" className="flex-1 overflow-hidden m-0 flex flex-col">
              <div className="shrink-0 flex items-center justify-between px-3 pt-3 pb-2">
                <p className="text-violet-400/50 text-[10px] font-medium uppercase tracking-wider">Ideas Lab</p>
                <div className="flex gap-0.5">
                  <Button variant="ghost" size="sm" onClick={copyIdeas}      className="h-6 w-6 p-0 text-violet-500 hover:text-violet-300"><Copy className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="sm" onClick={exportIdeas}    className="h-6 w-6 p-0 text-violet-500 hover:text-violet-300"><Download className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowIdeaForm(true)} className="h-6 w-6 p-0 text-violet-500 hover:text-violet-300"><Plus className="w-3 h-3" /></Button>
                </div>
              </div>

              {showIdeaForm && (
                <div className="shrink-0 mx-3 mb-2 bg-[#10102a] border border-violet-800/35 rounded-xl p-3 space-y-2">
                  <Input
                    autoFocus
                    placeholder="Idea title…"
                    value={newIdea.title}
                    onChange={(e) => setNewIdea((p) => ({ ...p, title: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addIdea()}
                    className="bg-transparent border-violet-800/35 text-white text-sm placeholder:text-violet-600 h-8"
                  />
                  <Textarea
                    placeholder="Details (optional)…"
                    value={newIdea.content}
                    onChange={(e) => setNewIdea((p) => ({ ...p, content: e.target.value }))}
                    className="bg-transparent border-violet-800/35 text-white text-xs placeholder:text-violet-600 min-h-[52px] resize-none"
                  />
                  <select
                    value={newIdea.category}
                    onChange={(e) => setNewIdea((p) => ({ ...p, category: e.target.value as IdeaCategory }))}
                    className="w-full bg-[#07071a] border border-violet-800/35 text-violet-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-violet-600"
                  >
                    {Object.entries(IDEA_CATEGORIES).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
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
                    <Lightbulb className="w-7 h-7 text-violet-700/40 mx-auto" />
                    <p className="text-violet-500/40 text-xs">No ideas yet.</p>
                    <button onClick={() => setShowIdeaForm(true)} className="text-violet-400 text-xs hover:text-violet-200 underline">
                      Capture your first idea
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {ideas.map((idea) => (
                      <div key={idea.id} className={`rounded-xl border p-3 group ${IDEA_CATEGORIES[idea.category].bg}`}>
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <span className={`text-[10px] font-semibold uppercase tracking-wider ${IDEA_CATEGORIES[idea.category].color}`}>
                              {IDEA_CATEGORIES[idea.category].label}
                            </span>
                            <p className="text-white text-sm font-medium mt-0.5 leading-snug">{idea.title}</p>
                            {idea.content && <p className="text-violet-300/55 text-xs mt-1 leading-relaxed line-clamp-3">{idea.content}</p>}
                            <p className="text-violet-500/35 text-[10px] mt-1.5">{new Date(idea.createdAt).toLocaleDateString()}</p>
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
