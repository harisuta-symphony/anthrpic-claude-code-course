"use client";

import { ToolInvocation } from "ai";
import { Loader2 } from "lucide-react";

export function getToolLabel(toolName: string, args: any): string {
  const filename = args?.path ? (args.path as string).split("/").pop() : null;

  if (toolName === "str_replace_editor") {
    const command = args?.command as string | undefined;
    switch (command) {
      case "create":
        return filename ? `Creating ${filename}` : "Creating file";
      case "str_replace":
        return filename ? `Editing ${filename}` : "Editing file";
      case "insert":
        return filename ? `Editing ${filename}` : "Editing file";
      case "view":
        return filename ? `Viewing ${filename}` : "Viewing file";
      case "undo_edit":
        return filename ? `Undoing edit in ${filename}` : "Undoing edit";
      default:
        return filename ? `Editing ${filename}` : "Editing file";
    }
  }

  if (toolName === "file_manager") {
    const command = args?.command as string | undefined;
    switch (command) {
      case "rename":
        return filename ? `Renaming ${filename}` : "Renaming file";
      case "delete":
        return filename ? `Deleting ${filename}` : "Deleting file";
      default:
        return filename ? `Managing ${filename}` : "Managing files";
    }
  }

  return toolName;
}

interface ToolCallBadgeProps {
  toolInvocation: ToolInvocation;
}

export function ToolCallBadge({ toolInvocation }: ToolCallBadgeProps) {
  const label = getToolLabel(toolInvocation.toolName, toolInvocation.args);
  const isDone = toolInvocation.state === "result" && "result" in toolInvocation && toolInvocation.result;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-neutral-700">{label}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{label}</span>
        </>
      )}
    </div>
  );
}
