import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { getToolLabel, ToolCallBadge } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

// --- getToolLabel unit tests ---

test("getToolLabel: str_replace_editor create with path", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "src/components/App.tsx" })).toBe("Creating App.tsx");
});

test("getToolLabel: str_replace_editor str_replace with path", () => {
  expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "src/Button.tsx" })).toBe("Editing Button.tsx");
});

test("getToolLabel: str_replace_editor insert with path", () => {
  expect(getToolLabel("str_replace_editor", { command: "insert", path: "src/index.tsx" })).toBe("Editing index.tsx");
});

test("getToolLabel: str_replace_editor view with path", () => {
  expect(getToolLabel("str_replace_editor", { command: "view", path: "src/App.tsx" })).toBe("Viewing App.tsx");
});

test("getToolLabel: str_replace_editor undo_edit with path", () => {
  expect(getToolLabel("str_replace_editor", { command: "undo_edit", path: "src/App.tsx" })).toBe("Undoing edit in App.tsx");
});

test("getToolLabel: str_replace_editor missing command defaults to Editing with path", () => {
  expect(getToolLabel("str_replace_editor", { path: "src/App.tsx" })).toBe("Editing App.tsx");
});

test("getToolLabel: str_replace_editor create with no path", () => {
  expect(getToolLabel("str_replace_editor", { command: "create" })).toBe("Creating file");
});

test("getToolLabel: str_replace_editor with empty args", () => {
  expect(getToolLabel("str_replace_editor", {})).toBe("Editing file");
});

test("getToolLabel: file_manager rename with path", () => {
  expect(getToolLabel("file_manager", { command: "rename", path: "src/OldName.tsx" })).toBe("Renaming OldName.tsx");
});

test("getToolLabel: file_manager delete with path", () => {
  expect(getToolLabel("file_manager", { command: "delete", path: "src/Unused.tsx" })).toBe("Deleting Unused.tsx");
});

test("getToolLabel: file_manager missing command with path", () => {
  expect(getToolLabel("file_manager", { path: "src/App.tsx" })).toBe("Managing App.tsx");
});

test("getToolLabel: file_manager with no path", () => {
  expect(getToolLabel("file_manager", { command: "rename" })).toBe("Renaming file");
});

test("getToolLabel: unknown tool falls back to tool name", () => {
  expect(getToolLabel("some_other_tool", { command: "create", path: "file.ts" })).toBe("some_other_tool");
});

test("getToolLabel: extracts basename from nested path", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "a/b/c/Component.tsx" })).toBe("Creating Component.tsx");
});

// --- ToolCallBadge render tests ---

test("ToolCallBadge shows label and green dot when state is result", () => {
  render(
    <ToolCallBadge
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "create", path: "src/App.tsx" },
        state: "result",
        result: "Success",
      }}
    />
  );

  expect(screen.getByText("Creating App.tsx")).toBeDefined();
  const dot = document.querySelector(".bg-emerald-500");
  expect(dot).not.toBeNull();
});

test("ToolCallBadge shows label and spinner when state is call", () => {
  render(
    <ToolCallBadge
      toolInvocation={{
        toolCallId: "2",
        toolName: "str_replace_editor",
        args: { command: "str_replace", path: "src/Button.tsx" },
        state: "call",
      }}
    />
  );

  expect(screen.getByText("Editing Button.tsx")).toBeDefined();
  const spinner = document.querySelector(".animate-spin");
  expect(spinner).not.toBeNull();
});

test("ToolCallBadge shows label and spinner when state is partial-call", () => {
  render(
    <ToolCallBadge
      toolInvocation={{
        toolCallId: "3",
        toolName: "str_replace_editor",
        args: { command: "create", path: "src/Card.tsx" },
        state: "partial-call",
      }}
    />
  );

  expect(screen.getByText("Creating Card.tsx")).toBeDefined();
  const spinner = document.querySelector(".animate-spin");
  expect(spinner).not.toBeNull();
});

test("ToolCallBadge shows label for file_manager delete", () => {
  render(
    <ToolCallBadge
      toolInvocation={{
        toolCallId: "4",
        toolName: "file_manager",
        args: { command: "delete", path: "src/Old.tsx" },
        state: "result",
        result: "Deleted",
      }}
    />
  );

  expect(screen.getByText("Deleting Old.tsx")).toBeDefined();
});
