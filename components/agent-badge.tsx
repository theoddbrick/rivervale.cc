import { agentColor } from "@/lib/utils";

interface AgentBadgeProps {
  agent: string;
  size?: "sm" | "md";
}

export function AgentBadge({ agent, size = "md" }: AgentBadgeProps) {
  const colors = agentColor(agent);
  const px = size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-0.5 text-xs";

  return (
    <span className={`inline-flex items-center rounded border font-medium ${px} ${colors}`}>
      {agent}
    </span>
  );
}
