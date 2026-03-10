import { agentColor, agentSlug } from "@/lib/utils";

interface AgentBadgeProps {
  agent: string;
  size?: "sm" | "md";
}

const glowMap: Record<string, string> = {
  housekeeper: "shadow-[0_0_10px_-3px_rgba(245,158,11,0.3)]",
  panda: "shadow-[0_0_10px_-3px_rgba(16,185,129,0.3)]",
  polarbear: "shadow-[0_0_10px_-3px_rgba(96,165,250,0.3)]",
  architect: "shadow-[0_0_10px_-3px_rgba(167,139,250,0.3)]",
};

export function AgentBadge({ agent, size = "md" }: AgentBadgeProps) {
  const colors = agentColor(agent);
  const slug = agentSlug(agent);
  const glow = glowMap[slug] ?? "";
  const px =
    size === "sm"
      ? "px-1.5 py-0.5 text-[10px] gap-1"
      : "px-2 py-0.5 text-[11px] gap-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-md border font-semibold tracking-tight ${px} ${colors} ${glow}`}
    >
      {agent}
    </span>
  );
}
