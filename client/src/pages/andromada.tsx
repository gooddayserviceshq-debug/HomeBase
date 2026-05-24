import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send, Sparkles, Lightbulb, Activity, Command,
  Download, Copy, Trash2, Plus, X, ChevronRight,
  TrendingUp, Users, FileText, Calendar, BarChart2,
  Zap, Target, MessageSquare, RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type IdeaCategory = "business" | "marketing" | "technology" | "personal" | "new-venture";

interface Idea {
  id: string;
  title: string;
  content: string;
  category: IdeaCategory;
  createdAt: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const IDEA_CATEGORIES: Record<IdeaCategory, { label: string; color: string; bg: string }> = {
  business: { label: "Business", color: "text-blue-300", bg: "bg-blue-900/25 border-blue-700/40" },
  marketing: { label: "Marketing", color: "text-emerald-300", bg: "bg-emerald-900/25 border-emerald-700/40" },
  technology: { label: "Technology", color: "text-violet-300", bg: "bg-violet-900/25 border-violet-700/40" },
  personal: { label: "Personal", color: "text-amber-300", bg: "bg-amber-900/25 border-amber-700/40" },
  "new-venture": { label: "New Venture", color: "text-pink-300", bg: "bg-pink-900/25 border-pink-700/40" },
};

const QUICK_PROMPTS = [
  "What should I focus on this week for GDS?",
  "Help me brainstorm a new revenue stream",
  "What marketing moves make sense right now?",
  "Audit my platform — what's missing?",
  "Help me think through hiring my first employee",
  "What would make customers refer us more?",
];

function StatCard({
  icon,
  label,
  value,
  color,
  urgent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  urgent?: boolean;
}) {
  const colors: Record<string, string> = {
    emerald: "text-emerald-400 bg-emerald-900/20 border-emerald-800/30",
    blue: "text-blue-400 bg-blue-900/20 border-blue-800/30",
    violet: "text-violet-400 bg-violet-900/20 border-violet-800/30",
    amber: "text-amber-400 bg-amber-900/20 border-amber-800/30",
    indigo: "text-indigo-400 bg-indigo-900/20 border-indigo-800/30",
    pink: "text-pink-400 bg-pink-900/20 border-pink-800/30",
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border ${colors[color]} ${
        urgent ? "ring-1 ring-amber-500/40" : ""
      }`}
    >
      <div className={colors[color].split(" ")[0]}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-violet-400/60 text-xs truncate">{label}</p>
        <p className="text-white font-bold text-lg leading-tight">{value}</p>
      </div>
    </div>
  );
}

export default function Andromada() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [ideas, setIdeas] = useState<Idea[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("andromada-ideas") || "[]");
    } catch {
      return [];
    }
  });
  const [showIdeaForm, setShowIdeaForm] = useState(false);
  const [newIdea, setNewIdea] = useState<{ title: string; content: string; category: IdeaCategory }>({
    title: "",
    content: "",
    category: "business",
  });

  const { data: analytics, refetch: refetchAnalytics } = useQuery<any>({
    queryKey: ["/api/ceo/analytics"],
    retry: false,
  });

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("andromada-ideas", JSON.stringify(ideas));
  }, [ideas]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      const userMsg: Message = { role: "user", content: content.trim() };
      const updated = [...messages, userMsg];
      setMessages([...updated, { role: "assistant", content: "" }]);
      setInput("");
      setIsStreaming(true);

      try {
        const response = await fetch("/api/andromada/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: updated }),
        });

        if (!response.ok) throw new Error("Connection failed");

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          for (const line of chunk.split("\n")) {
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
    },
    [messages, isStreaming, toast]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

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
    toast({ title: "Idea captured", description: `"${idea.title}" saved to ${IDEA_CATEGORIES[idea.category].label}` });
  };

  const deleteIdea = (id: string) => {
    setIdeas((prev) => prev.filter((i) => i.id !== id));
  };

  const exportIdeas = () => {
    if (ideas.length === 0) {
      toast({ title: "No ideas to export" });
      return;
    }

    const sections = Object.entries(IDEA_CATEGORIES)
      .map(([cat, cfg]) => {
        const catIdeas = ideas.filter((i) => i.category === cat);
        if (!catIdeas.length) return null;
        const items = catIdeas
          .map((i) => `### ${i.title}\n${i.content || "_No details added_"}\n_${new Date(i.createdAt).toLocaleDateString()}_`)
          .join("\n\n");
        return `## ${cfg.label}\n\n${items}`;
      })
      .filter(Boolean)
      .join("\n\n---\n\n");

    const md = `# Andromada Ideas — Blake McConnell\n_Exported ${new Date().toLocaleDateString()}_\n\n${sections}`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `andromada-ideas-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${ideas.length} ideas downloaded` });
  };

  const copyIdeas = async () => {
    if (!ideas.length) { toast({ title: "No ideas to copy" }); return; }
    const text = ideas
      .map((i) => `[${IDEA_CATEGORIES[i.category].label}] ${i.title}${i.content ? "\n" + i.content : ""}`)
      .join("\n\n");
    await navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${ideas.length} ideas to clipboard` });
  };

  const keyMetrics = analytics?.keyMetrics;

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
            <p className="text-violet-400/70 text-xs mt-0.5">Blake's Platform Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-medium">Live</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/ceo-dashboard")}
            className="text-violet-400 hover:text-white text-xs h-7 px-3"
          >
            CEO Dashboard
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Chat Panel ── */}
        <div className="flex flex-1 flex-col min-w-0 border-r border-violet-900/25">
          <ScrollArea className="flex-1 px-4 py-5">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[320px] text-center gap-6 px-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-700/40 to-indigo-900/40 border border-violet-600/25 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-white text-xl font-semibold mb-1.5">Good to have you, Blake.</h2>
                  <p className="text-violet-300/60 text-sm max-w-xs mx-auto leading-relaxed">
                    I'm Andromada — your strategic partner, operations lens, and idea engine. What are we building today?
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
                    <div
                      className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-violet-700/25 border border-violet-600/25 text-white rounded-tr-sm"
                          : "bg-[#10102a] border border-violet-900/35 text-violet-100 rounded-tl-sm"
                      }`}
                    >
                      {msg.role === "assistant" && msg.content === "" ? (
                        <div className="flex gap-1 py-1">
                          {[0, 150, 300].map((delay) => (
                            <div
                              key={delay}
                              className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
                              style={{ animationDelay: `${delay}ms` }}
                            />
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
            <div className="max-w-2xl mx-auto flex gap-2 items-end">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Andromada… (Shift+Enter for new line)"
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
          <Tabs defaultValue="pulse" className="flex flex-col h-full">
            <TabsList className="shrink-0 bg-transparent border-b border-violet-900/25 rounded-none px-2 pt-2 gap-1 h-auto pb-0">
              <TabsTrigger
                value="pulse"
                className="data-[state=active]:bg-violet-900/35 data-[state=active]:text-violet-200 text-violet-500 rounded-lg rounded-b-none text-xs flex gap-1.5 py-2 px-3 border-b-0"
              >
                <Activity className="w-3 h-3" /> Pulse
              </TabsTrigger>
              <TabsTrigger
                value="ideas"
                className="data-[state=active]:bg-violet-900/35 data-[state=active]:text-violet-200 text-violet-500 rounded-lg rounded-b-none text-xs flex gap-1.5 py-2 px-3"
              >
                <Lightbulb className="w-3 h-3" /> Ideas{" "}
                {ideas.length > 0 && (
                  <span className="bg-violet-700/50 text-violet-300 text-[10px] rounded-full px-1.5 py-0.5 leading-none">
                    {ideas.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="hub"
                className="data-[state=active]:bg-violet-900/35 data-[state=active]:text-violet-200 text-violet-500 rounded-lg rounded-b-none text-xs flex gap-1.5 py-2 px-3"
              >
                <Command className="w-3 h-3" /> Hub
              </TabsTrigger>
            </TabsList>

            {/* Platform Pulse */}
            <TabsContent value="pulse" className="flex-1 overflow-auto m-0 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-violet-400/50 text-[10px] font-medium uppercase tracking-wider">GDS Platform</p>
                <button
                  onClick={() => refetchAnalytics()}
                  className="text-violet-500 hover:text-violet-300 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>

              {keyMetrics ? (
                <>
                  <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Est. Revenue" value={`$${Number(keyMetrics.totalRevenue).toFixed(0)}`} color="emerald" />
                  <StatCard icon={<FileText className="w-4 h-4" />} label="Total Quotes" value={keyMetrics.totalQuotes} color="blue" />
                  <StatCard icon={<Users className="w-4 h-4" />} label="Total Customers" value={keyMetrics.totalCustomers} color="violet" />
                  <StatCard icon={<Target className="w-4 h-4" />} label="Pending Inquiries" value={keyMetrics.pendingInquiries} color="amber" urgent={keyMetrics.pendingInquiries > 0} />
                  <StatCard icon={<Zap className="w-4 h-4" />} label="Active Warranties" value={keyMetrics.activeWarranties} color="indigo" />
                  <StatCard icon={<BarChart2 className="w-4 h-4" />} label="Avg Quote Value" value={`$${Number(keyMetrics.avgQuoteValue).toFixed(0)}`} color="pink" />
                  <StatCard icon={<Users className="w-4 h-4" />} label="Repeat Rate" value={`${keyMetrics.repeatCustomerRate}%`} color="emerald" />
                </>
              ) : (
                <div className="text-violet-500/40 text-xs text-center py-10 space-y-2">
                  <Activity className="w-6 h-6 mx-auto opacity-30" />
                  <p>Loading platform data…</p>
                  <p className="text-[10px]">Sign in to view live stats</p>
                </div>
              )}
            </TabsContent>

            {/* Ideas Lab */}
            <TabsContent value="ideas" className="flex-1 overflow-hidden m-0 flex flex-col">
              <div className="shrink-0 flex items-center justify-between px-3 pt-3 pb-2">
                <p className="text-violet-400/50 text-[10px] font-medium uppercase tracking-wider">Ideas Lab</p>
                <div className="flex gap-0.5">
                  <Button variant="ghost" size="sm" onClick={copyIdeas} className="h-6 w-6 p-0 text-violet-500 hover:text-violet-300">
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={exportIdeas} className="h-6 w-6 p-0 text-violet-500 hover:text-violet-300">
                    <Download className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowIdeaForm(true)} className="h-6 w-6 p-0 text-violet-500 hover:text-violet-300">
                    <Plus className="w-3 h-3" />
                  </Button>
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
                    <Button size="sm" onClick={addIdea} className="flex-1 bg-violet-700 hover:bg-violet-600 text-white text-xs h-7">
                      Capture
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowIdeaForm(false)} className="text-violet-500 h-7 w-7 p-0">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}

              <ScrollArea className="flex-1 px-3 pb-3">
                {ideas.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <Lightbulb className="w-7 h-7 text-violet-700/40 mx-auto" />
                    <p className="text-violet-500/40 text-xs">No ideas yet.</p>
                    <button
                      onClick={() => setShowIdeaForm(true)}
                      className="text-violet-400 text-xs hover:text-violet-200 underline"
                    >
                      Capture your first idea
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {ideas.map((idea) => (
                      <div
                        key={idea.id}
                        className={`rounded-xl border p-3 group relative ${IDEA_CATEGORIES[idea.category].bg}`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <span className={`text-[10px] font-semibold uppercase tracking-wider ${IDEA_CATEGORIES[idea.category].color}`}>
                              {IDEA_CATEGORIES[idea.category].label}
                            </span>
                            <p className="text-white text-sm font-medium mt-0.5 leading-snug">{idea.title}</p>
                            {idea.content && (
                              <p className="text-violet-300/55 text-xs mt-1 leading-relaxed line-clamp-3">{idea.content}</p>
                            )}
                            <p className="text-violet-500/35 text-[10px] mt-1.5">
                              {new Date(idea.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => deleteIdea(idea.id)}
                            className="opacity-0 group-hover:opacity-100 text-violet-600 hover:text-red-400 transition-all mt-0.5 shrink-0"
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

            {/* Command Hub */}
            <TabsContent value="hub" className="flex-1 overflow-auto m-0 p-3 space-y-2">
              <p className="text-violet-400/50 text-[10px] font-medium uppercase tracking-wider mb-3">Command Hub</p>
              {[
                { label: "CEO Dashboard", desc: "Full analytics & insights", href: "/ceo-dashboard", icon: <BarChart2 className="w-4 h-4" /> },
                { label: "Admin Panel", desc: "Orders, bookings, products", href: "/admin", icon: <Command className="w-4 h-4" /> },
                { label: "Quote Requests", desc: "Restoration & cleaning", href: "/admin", icon: <FileText className="w-4 h-4" /> },
                { label: "Book a Service", desc: "Customer booking flow", href: "/book", icon: <Calendar className="w-4 h-4" /> },
                { label: "Contact Center", desc: "Inquiries & support", href: "/contact", icon: <MessageSquare className="w-4 h-4" /> },
                { label: "GDS Products", desc: "Online store", href: "/products", icon: <Zap className="w-4 h-4" /> },
              ].map((item, i) => (
                <a key={i} href={item.href}>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#10102a] border border-violet-900/25 hover:border-violet-700/45 hover:bg-violet-900/15 transition-all group cursor-pointer">
                    <div className="text-violet-500 group-hover:text-violet-300 transition-colors shrink-0">{item.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium leading-tight">{item.label}</p>
                      <p className="text-violet-500/50 text-xs">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-3 h-3 text-violet-700 group-hover:text-violet-400 transition-colors shrink-0" />
                  </div>
                </a>
              ))}

              {/* Idea quick-capture shortcut */}
              <div className="pt-2 border-t border-violet-900/25 mt-3">
                <p className="text-violet-400/50 text-[10px] font-medium uppercase tracking-wider mb-2">Quick Capture</p>
                <button
                  onClick={() => {
                    const tab = document.querySelector('[value="ideas"]') as HTMLButtonElement;
                    tab?.click();
                    setTimeout(() => setShowIdeaForm(true), 100);
                  }}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-violet-900/15 border border-violet-800/25 hover:bg-violet-900/30 transition-all text-left"
                >
                  <Plus className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-violet-300 text-xs">New idea…</span>
                </button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
