import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

import { useAuth } from "@/hooks/use-auth";
import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAnonWorkData).mockReturnValue(null);
  vi.mocked(getProjects).mockResolvedValue([]);
  vi.mocked(createProject).mockResolvedValue({ id: "new-proj" } as any);
});

describe("useAuth — initial state", () => {
  test("isLoading starts as false", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoading).toBe(false);
  });

  test("exposes signIn and signUp functions", () => {
    const { result } = renderHook(() => useAuth());
    expect(typeof result.current.signIn).toBe("function");
    expect(typeof result.current.signUp).toBe("function");
  });
});

describe("useAuth — signIn", () => {
  test("calls signInAction with the supplied credentials", async () => {
    vi.mocked(signInAction).mockResolvedValue({ success: false });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "password123");
    });

    expect(signInAction).toHaveBeenCalledWith("user@example.com", "password123");
  });

  test("isLoading is true while signIn is in-flight", async () => {
    let resolveSignIn!: (value: any) => void;
    vi.mocked(signInAction).mockReturnValue(
      new Promise((resolve) => { resolveSignIn = resolve; })
    );

    const { result } = renderHook(() => useAuth());

    // Sync act flushes the setIsLoading(true) state update that happens before
    // the first await inside signIn, without waiting for the promise to resolve.
    let signInCall: Promise<any> | undefined;
    act(() => {
      signInCall = result.current.signIn("user@example.com", "password123");
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveSignIn({ success: false });
      await signInCall;
    });
  });

  test("isLoading returns to false after signIn resolves", async () => {
    vi.mocked(signInAction).mockResolvedValue({ success: false, error: "Invalid credentials" });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "wrong");
    });

    expect(result.current.isLoading).toBe(false);
  });

  test("isLoading returns to false even when signIn throws", async () => {
    vi.mocked(signInAction).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.signIn("user@example.com", "password123");
      } catch {}
    });

    expect(result.current.isLoading).toBe(false);
  });

  test("returns the result from signInAction", async () => {
    vi.mocked(signInAction).mockResolvedValue({ success: false, error: "Invalid credentials" });

    const { result } = renderHook(() => useAuth());

    let returnValue: any;
    await act(async () => {
      returnValue = await result.current.signIn("user@example.com", "wrong");
    });

    expect(returnValue).toEqual({ success: false, error: "Invalid credentials" });
  });

  test("does not navigate when signIn fails", async () => {
    vi.mocked(signInAction).mockResolvedValue({ success: false, error: "Invalid credentials" });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "wrong");
    });

    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe("useAuth — signUp", () => {
  test("calls signUpAction with the supplied credentials", async () => {
    vi.mocked(signUpAction).mockResolvedValue({ success: false });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("new@example.com", "password123");
    });

    expect(signUpAction).toHaveBeenCalledWith("new@example.com", "password123");
  });

  test("isLoading is true while signUp is in-flight", async () => {
    let resolveSignUp!: (value: any) => void;
    vi.mocked(signUpAction).mockReturnValue(
      new Promise((resolve) => { resolveSignUp = resolve; })
    );

    const { result } = renderHook(() => useAuth());

    let signUpCall: Promise<any> | undefined;
    act(() => {
      signUpCall = result.current.signUp("new@example.com", "password123");
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveSignUp({ success: false });
      await signUpCall;
    });
  });

  test("isLoading returns to false after signUp resolves", async () => {
    vi.mocked(signUpAction).mockResolvedValue({ success: false, error: "Email taken" });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("taken@example.com", "password123");
    });

    expect(result.current.isLoading).toBe(false);
  });

  test("isLoading returns to false even when signUp throws", async () => {
    vi.mocked(signUpAction).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.signUp("user@example.com", "password123");
      } catch {}
    });

    expect(result.current.isLoading).toBe(false);
  });

  test("returns the result from signUpAction", async () => {
    vi.mocked(signUpAction).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAuth());

    let returnValue: any;
    await act(async () => {
      returnValue = await result.current.signUp("new@example.com", "password123");
    });

    expect(returnValue).toEqual({ success: true });
  });

  test("does not navigate when signUp fails", async () => {
    vi.mocked(signUpAction).mockResolvedValue({ success: false, error: "Email already registered" });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("existing@example.com", "password123");
    });

    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe("useAuth — post-sign-in navigation", () => {
  test("migrates anon work into a new project and redirects to it", async () => {
    vi.mocked(signInAction).mockResolvedValue({ success: true });
    vi.mocked(getAnonWorkData).mockReturnValue({
      messages: [{ role: "user", content: "make a button" }],
      fileSystemData: { "/": { type: "directory" } },
    });
    vi.mocked(createProject).mockResolvedValue({ id: "anon-proj" } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "password123");
    });

    expect(createProject).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: "user", content: "make a button" }],
        data: { "/": { type: "directory" } },
      })
    );
    expect(clearAnonWork).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/anon-proj");
  });

  test("anon project name contains 'Design from'", async () => {
    vi.mocked(signInAction).mockResolvedValue({ success: true });
    vi.mocked(getAnonWorkData).mockReturnValue({
      messages: [{ role: "user", content: "hello" }],
      fileSystemData: {},
    });
    vi.mocked(createProject).mockResolvedValue({ id: "x" } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "password123");
    });

    expect(createProject).toHaveBeenCalledWith(
      expect.objectContaining({ name: expect.stringContaining("Design from") })
    );
  });

  test("skips anon migration when anon data has zero messages", async () => {
    vi.mocked(signInAction).mockResolvedValue({ success: true });
    vi.mocked(getAnonWorkData).mockReturnValue({ messages: [], fileSystemData: {} });
    vi.mocked(getProjects).mockResolvedValue([{ id: "proj-1" } as any]);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "password123");
    });

    expect(createProject).not.toHaveBeenCalled();
    expect(clearAnonWork).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/proj-1");
  });

  test("redirects to the most recent existing project when no anon work", async () => {
    vi.mocked(signInAction).mockResolvedValue({ success: true });
    vi.mocked(getProjects).mockResolvedValue([
      { id: "recent" } as any,
      { id: "older" } as any,
    ]);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "password123");
    });

    expect(mockPush).toHaveBeenCalledWith("/recent");
    expect(createProject).not.toHaveBeenCalled();
  });

  test("creates a blank project when user has no existing projects and no anon work", async () => {
    vi.mocked(signInAction).mockResolvedValue({ success: true });
    vi.mocked(getProjects).mockResolvedValue([]);
    vi.mocked(createProject).mockResolvedValue({ id: "brand-new" } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "password123");
    });

    expect(createProject).toHaveBeenCalledWith(
      expect.objectContaining({ messages: [], data: {} })
    );
    expect(mockPush).toHaveBeenCalledWith("/brand-new");
  });

  test("same post-sign-in navigation logic runs after signUp succeeds", async () => {
    vi.mocked(signUpAction).mockResolvedValue({ success: true });
    vi.mocked(getProjects).mockResolvedValue([{ id: "proj-42" } as any]);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("new@example.com", "password123");
    });

    expect(mockPush).toHaveBeenCalledWith("/proj-42");
  });

  test("does not fetch projects when anon work is present with messages", async () => {
    vi.mocked(signInAction).mockResolvedValue({ success: true });
    vi.mocked(getAnonWorkData).mockReturnValue({
      messages: [{ role: "user", content: "hello" }],
      fileSystemData: {},
    });
    vi.mocked(createProject).mockResolvedValue({ id: "x" } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "password123");
    });

    expect(getProjects).not.toHaveBeenCalled();
  });
});
