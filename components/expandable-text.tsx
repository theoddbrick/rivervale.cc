"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  className?: string;
  mono?: boolean;
  errorStyle?: boolean;
}

export function ExpandableText({
  text,
  maxLength = 80,
  className = "",
  mono = false,
  errorStyle = false,
}: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = text.length > maxLength;

  if (!needsTruncation) {
    return (
      <span
        className={`${errorStyle ? "text-red-400" : ""} ${mono ? "font-mono" : ""} ${className}`}
      >
        {text}
      </span>
    );
  }

  return (
    <div className={className}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-left w-full group"
      >
        <span
          className={`${errorStyle ? "text-red-400" : ""} ${mono ? "font-mono" : ""} text-[12px] break-words whitespace-pre-wrap`}
        >
          {expanded ? text : `${text.slice(0, maxLength)}…`}
        </span>
        <span className="inline-flex items-center ml-1 text-rv-accent/60 group-hover:text-rv-accent transition-colors">
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </span>
      </button>
    </div>
  );
}

interface ExpandableRowDetailProps {
  title: string;
  description?: string | null;
  details?: Record<string, unknown> | null;
}

export function ExpandableRowDetail({
  title,
  description,
  details,
}: ExpandableRowDetailProps) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = !!description || (details && Object.keys(details).length > 0);

  return (
    <div className="max-w-md">
      <p className="text-rv-text text-[13px] leading-snug">{title}</p>
      {hasMore && (
        <>
          {!expanded && description && (
            <p className="text-rv-subtle text-[12px] mt-0.5 line-clamp-1">
              {description}
            </p>
          )}
          {expanded && (
            <div className="mt-1.5 space-y-1">
              {description && (
                <p className="text-rv-subtle text-[12px] whitespace-pre-wrap break-words">
                  {description}
                </p>
              )}
              {details && Object.keys(details).length > 0 && (
                <pre className="text-[11px] text-rv-subtle/80 bg-rv-muted/30 rounded-md p-2 overflow-x-auto font-mono">
                  {JSON.stringify(details, null, 2)}
                </pre>
              )}
            </div>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-rv-accent/60 hover:text-rv-accent text-[11px] mt-0.5 inline-flex items-center gap-0.5 transition-colors"
          >
            {expanded ? (
              <>
                Less <ChevronUp size={11} />
              </>
            ) : (
              <>
                More <ChevronDown size={11} />
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
