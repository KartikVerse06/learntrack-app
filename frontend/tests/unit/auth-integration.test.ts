import { describe, it, expect, beforeEach, vi } from "vitest";
import Cookies from "js-cookie";
import {
  getClientAuthToken,
  setClientAuthToken,
  removeClientAuthToken,
} from "@/lib/api/client";

class MockStorage implements Storage {
  private store: Record<string, string> = {};
  get length() {
    return Object.keys(this.store).length;
  }
  key(index: number) {
    return Object.keys(this.store)[index] ?? null;
  }
  getItem(key: string) {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }
  removeItem(key: string) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

const mockLocalStorage = new MockStorage();
const mockSessionStorage = new MockStorage();
let cookieMap: Record<string, string> = {};

describe("Frontend Client Auth State & Session Management", () => {
  beforeEach(() => {
    cookieMap = {};
    (global as any).document = {
      get cookie() {
        return Object.entries(cookieMap)
          .map(([k, v]) => `${k}=${v}`)
          .join("; ");
      },
      set cookie(val: string) {
        const [pair] = val.split(";");
        const [name, ...rest] = pair.split("=");
        const key = name.trim();
        const value = rest.join("=").trim();
        if (
          !value ||
          val.toLowerCase().includes("max-age=0") ||
          val.toLowerCase().includes("expires=thu, 01 jan 1970")
        ) {
          delete cookieMap[key];
        } else {
          cookieMap[key] = value;
        }
      },
    };
    (global as any).window = {
      location: { protocol: "https:" },
    };
    (global as any).localStorage = mockLocalStorage;
    (global as any).sessionStorage = mockSessionStorage;
    mockLocalStorage.clear();
    mockSessionStorage.clear();
    Cookies.remove("learntrack_token");
    Cookies.remove("token");
    vi.restoreAllMocks();
  });

  it("sets and retrieves client auth token from cookies and localStorage", () => {
    const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-payload";
    setClientAuthToken(testToken);

    expect(getClientAuthToken()).toBe(testToken);
    expect(Cookies.get("learntrack_token")).toBe(testToken);
    expect(localStorage.getItem("learntrack_token")).toBe(testToken);
  });

  it("removes client auth token comprehensively on logout", () => {
    const testToken = "token-to-be-removed";
    setClientAuthToken(testToken);
    sessionStorage.setItem("some_key", "some_value");

    expect(getClientAuthToken()).toBe(testToken);

    removeClientAuthToken();

    expect(getClientAuthToken()).toBeUndefined();
    expect(Cookies.get("learntrack_token")).toBeUndefined();
    expect(Cookies.get("token")).toBeUndefined();
    expect(localStorage.getItem("learntrack_token")).toBeNull();
    expect(sessionStorage.getItem("some_key")).toBeNull();
  });

  it("returns undefined when no auth token is stored", () => {
    expect(getClientAuthToken()).toBeUndefined();
  });
});
