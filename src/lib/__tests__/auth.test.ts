// @vitest-environment node
import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

const { createSession, getSession } = await import("@/lib/auth");

describe("createSession", () => {
  beforeEach(() => vi.clearAllMocks());

  test("sets a cookie named auth-token", async () => {
    await createSession("user-1", "user@example.com");

    expect(mockCookieStore.set).toHaveBeenCalledOnce();
    const [name] = mockCookieStore.set.mock.calls[0];
    expect(name).toBe("auth-token");
  });

  test("cookie is httpOnly, sameSite lax, and path /", async () => {
    await createSession("user-1", "user@example.com");

    const [, , options] = mockCookieStore.set.mock.calls[0];
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
  });

  test("cookie expires in approximately 7 days", async () => {
    const before = Date.now();
    await createSession("user-1", "user@example.com");
    const after = Date.now();

    const [, , options] = mockCookieStore.set.mock.calls[0];
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    expect(options.expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
    expect(options.expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
  });

  test("cookie value is a signed JWT string", async () => {
    await createSession("user-1", "user@example.com");

    const [, token] = mockCookieStore.set.mock.calls[0];
    // JWTs are three base64url segments separated by dots
    expect(token.split(".")).toHaveLength(3);
  });

  test("encodes userId and email into the JWT payload", async () => {
    await createSession("user-42", "hello@example.com");

    const [, token] = mockCookieStore.set.mock.calls[0];
    const payloadJson = Buffer.from(token.split(".")[1], "base64url").toString("utf8");
    const payload = JSON.parse(payloadJson);

    expect(payload.userId).toBe("user-42");
    expect(payload.email).toBe("hello@example.com");
  });
});

describe("getSession", () => {
  beforeEach(() => vi.clearAllMocks());

  test("returns null when the auth-token cookie is absent", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    expect(await getSession()).toBeNull();
  });

  test("returns null for a syntactically invalid token", async () => {
    mockCookieStore.get.mockReturnValue({ value: "not.a.jwt" });

    expect(await getSession()).toBeNull();
  });

  test("returns null for a token signed with the wrong secret", async () => {
    // Sign with a different secret so verification fails
    const { SignJWT } = await import("jose");
    const wrongSecret = new TextEncoder().encode("wrong-secret");
    const token = await new SignJWT({ userId: "x", email: "x@x.com" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(wrongSecret);

    mockCookieStore.get.mockReturnValue({ value: token });

    expect(await getSession()).toBeNull();
  });

  test("returns null for an expired token", async () => {
    const { SignJWT } = await import("jose");
    const secret = new TextEncoder().encode("development-secret-key");
    const token = await new SignJWT({ userId: "u1", email: "u@example.com" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("-1s") // already expired
      .sign(secret);

    mockCookieStore.get.mockReturnValue({ value: token });

    expect(await getSession()).toBeNull();
  });

  test("returns the session payload for a valid token", async () => {
    // Generate a real token via createSession and capture it
    let capturedToken = "";
    mockCookieStore.set.mockImplementation((_name: string, token: string) => {
      capturedToken = token;
    });
    await createSession("user-7", "valid@example.com");

    mockCookieStore.get.mockReturnValue({ value: capturedToken });
    const session = await getSession();

    expect(session).not.toBeNull();
    expect(session?.userId).toBe("user-7");
    expect(session?.email).toBe("valid@example.com");
  });

  test("returned session includes an expiresAt date roughly 7 days out", async () => {
    let capturedToken = "";
    mockCookieStore.set.mockImplementation((_name: string, token: string) => {
      capturedToken = token;
    });
    const before = Date.now();
    await createSession("user-7", "valid@example.com");
    const after = Date.now();

    mockCookieStore.get.mockReturnValue({ value: capturedToken });
    const session = await getSession();

    const expiresAt = new Date(session!.expiresAt).getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    expect(expiresAt).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
    expect(expiresAt).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
  });
});
