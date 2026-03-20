"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bot, SendHorizonal, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export function AiSuggestionChat({
  ticketId,
  originalSuggestion,
  onSuggestionRefined,
}: {
  ticketId: string;
  originalSuggestion: string;
  onSuggestionRefined: (refinedSuggestion: string) => void;
}) {
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: "initial",
      role: "assistant",
      content: `I've analyzed this ticket and suggested: "${originalSuggestion.substring(0, 100)}..." Feel free to ask me questions about this suggestion or request modifications. What would you like to adjust?`,
      timestamp: Date.now(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendQuestion() {
    if (!inputValue.trim()) return;

    const userMessage: AiMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: inputValue,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setLoading(true);

    try {
      const response = await api.post(`/admin/ai-refine`, {
        ticketId,
        originalSuggestion,
        question: inputValue,
        context: messages.map((m) => ({ role: m.role, content: m.content })),
      });

      const refinedSuggestion = response.data.data.refinedSuggestion;
      const aiReply = response.data.data.reply;

      const assistantMessage: AiMessage = {
        id: `msg-${Date.now()}-ai`,
        role: "assistant",
        content: aiReply,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      onSuggestionRefined(refinedSuggestion);
      toast.success("Suggestion refined");
    } catch (error) {
      toast.error("Failed to refine suggestion");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col space-y-3 rounded-xl border border-[#e4d4bb] bg-[#fff9ef] p-3">
      <div className="flex items-center gap-1.5">
        <Bot className="size-4 text-[#8d7447]" />
        <p className="text-sm font-semibold text-slate-900">Ask AI to refine</p>
      </div>

      <div
        ref={scrollRef}
        className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-[#e4d4bb] bg-white p-2.5"
      >
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-2.5 py-1.5 text-xs ${
                msg.role === "user"
                  ? "bg-[#293446] text-[#fff8eb]"
                  : "bg-slate-100 text-slate-900"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-slate-100 px-2.5 py-1.5">
              <Loader2 className="size-3 animate-spin text-slate-500" />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) {
              sendQuestion();
            }
          }}
          placeholder="Ask to refine, simplify, or modify..."
          className="bg-[#fffaf2] text-xs"
          disabled={loading}
        />
        <Button
          size="sm"
          onClick={sendQuestion}
          disabled={loading || !inputValue.trim()}
          className="bg-[#8d7447] text-[#fff7ea] hover:bg-[#7a6139]"
        >
          <SendHorizonal className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
