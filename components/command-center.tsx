"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AgentName, CommandType } from "@/lib/types";
import { Send, RotateCcw, Stethoscope, RefreshCw, HeartPulse, Activity, Check, X } from "lucide-react";

const AGENTS: { label: string; value: AgentName }[] = [
  { label: "Housekeeper", value: "\u{1F3E0} Housekeeper" },
  { label: "Panda", value: "\u{1F43C} Panda" },
  { label: "PolarBear", value: "\u{1F43B}\u200D\u2744\uFE0F PolarBear" },
  { label: "Architect", value: "\u{1F527} Architect" },
];

const AGENT_BORDER_COLORS: Record<string, string> = {
  "\u{1F3E0} Housekeeper": "border-amber-400/30 hover:border-amber-400/50",
  "\u{1F43C} Panda": "border-emerald-400/30 hover:border-emerald-400/50",
  "\u{1F43B}\u200D\u2744\uFE0F PolarBear": "border-blue-400/30 hover:border-blue-400/50",
  "\u{1F527} Architect": "border-violet-400/30 hover:border-violet-400/50",
};

const AGENT_TEXT_COLORS: Record<string, string> = {
  "\u{1F3E0} Housekeeper": "text-amber-400",
  "\u{1F43C} Panda": "text-emerald-400",
  "\u{1F43B}\u200D\u2744\uFE0F PolarBear": "text-blue-400",
  "\u{1F527} Architect": "text-violet-400",
};

type Toast = { type: "success" | "error"; message: string } | null;

export function CommandCenter() {
  const [selectedAgent, setSelectedAgent] = useState<AgentName>(AGENTS[0].value);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const showToast = (t: Toast) => {
    setToast(t);
    setTimeout(() => setToast(null), 3000);
  };

  const sendCommand = async (
    commandType: CommandType,
    targetAgent: AgentName | null,
    payload: Record<string, unknown> = {}
  ) => {
    setSending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("dashboard_commands").insert({
        command_type: commandType,
        target_agent: targetAgent,
        payload,
        status: "pending" as const,
      } as never);
      if (error) throw error;
      showToast({ type: "success", message: `Command queued: ${commandType}` });
      if (commandType === "message_agent") setMessage("");
    } catch (err) {
      showToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to send command",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[13px] font-medium shadow-2xl animate-in ${
            toast.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {toast.type === "success" ? <Check size={14} /> : <X size={14} />}
          {toast.message}
        </div>
      )}

      {/* Message Agent */}
      <div className="card p-5">
        <h3 className="text-rv-text text-[13px] font-semibold mb-3 flex items-center gap-2">
          <Send size={13} className="text-rv-accent" />
          Message Agent
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value as AgentName)}
            className="px-3 py-1.5 rounded-lg bg-rv-surface border border-rv-border text-rv-text text-[13px] focus:outline-none focus:border-rv-accent/40 transition-colors sm:w-44"
          >
            {AGENTS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message to send..."
            rows={2}
            className="flex-1 px-3 py-2 rounded-lg bg-rv-surface border border-rv-border text-rv-text text-[13px] placeholder:text-rv-subtle/40 focus:outline-none focus:border-rv-accent/40 transition-colors resize-none"
          />
          <button
            onClick={() =>
              sendCommand("message_agent", selectedAgent, { message })
            }
            disabled={sending || !message.trim()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-rv-accent/[0.12] hover:bg-rv-accent/20 text-rv-accent-hover text-[13px] font-medium transition-colors border border-rv-accent/[0.15] disabled:opacity-40 disabled:cursor-not-allowed self-end sm:self-stretch"
          >
            <Send size={13} />
            Send
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-5">
        <h3 className="text-rv-text text-[13px] font-semibold mb-3 flex items-center gap-2">
          <RefreshCw size={13} className="text-rv-accent" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {/* System commands */}
          <button
            onClick={() => sendCommand("restart_gateway", null)}
            disabled={sending}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-rv-surface border border-rv-border hover:border-rv-accent/30 text-rv-text text-[12px] font-medium transition-colors disabled:opacity-40"
          >
            <RotateCcw size={13} className="text-orange-400" />
            Restart Gateway
          </button>
          <button
            onClick={() => sendCommand("run_doctor", null)}
            disabled={sending}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-rv-surface border border-rv-border hover:border-rv-accent/30 text-rv-text text-[12px] font-medium transition-colors disabled:opacity-40"
          >
            <Stethoscope size={13} className="text-pink-400" />
            Run Doctor
          </button>
          <button
            onClick={() => sendCommand("sync_crons", null)}
            disabled={sending}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-rv-surface border border-rv-border hover:border-rv-accent/30 text-rv-text text-[12px] font-medium transition-colors disabled:opacity-40"
          >
            <RefreshCw size={13} className="text-cyan-400" />
            Sync Crons
          </button>

          {/* Per-agent actions */}
          {AGENTS.map((a) => (
            <button
              key={`hb-${a.value}`}
              onClick={() => sendCommand("force_heartbeat", a.value)}
              disabled={sending}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg bg-rv-surface border text-[12px] font-medium transition-colors disabled:opacity-40 ${AGENT_BORDER_COLORS[a.value] ?? "border-rv-border hover:border-rv-accent/30"}`}
            >
              <HeartPulse
                size={13}
                className={AGENT_TEXT_COLORS[a.value] ?? "text-rv-subtle"}
              />
              <span className="text-rv-text">Heartbeat</span>
              <span
                className={`text-[10px] ${AGENT_TEXT_COLORS[a.value] ?? "text-rv-subtle"}`}
              >
                {a.label}
              </span>
            </button>
          ))}
          {AGENTS.map((a) => (
            <button
              key={`hc-${a.value}`}
              onClick={() => sendCommand("trigger_healthcheck", a.value)}
              disabled={sending}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg bg-rv-surface border text-[12px] font-medium transition-colors disabled:opacity-40 ${AGENT_BORDER_COLORS[a.value] ?? "border-rv-border hover:border-rv-accent/30"}`}
            >
              <Activity
                size={13}
                className={AGENT_TEXT_COLORS[a.value] ?? "text-rv-subtle"}
              />
              <span className="text-rv-text">Health Check</span>
              <span
                className={`text-[10px] ${AGENT_TEXT_COLORS[a.value] ?? "text-rv-subtle"}`}
              >
                {a.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
