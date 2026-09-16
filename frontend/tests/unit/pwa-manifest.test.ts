import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("PWA Progressive Web App Suite", () => {
  const publicDir = path.resolve(__dirname, "../../public");

  it("should have a valid public/manifest.json matching PWA requirements", () => {
    const manifestPath = path.join(publicDir, "manifest.json");
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifestContent = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    expect(manifestContent.name).toContain("LearnTrack");
    expect(manifestContent.short_name).toBe("LearnTrack");
    expect(manifestContent.start_url).toBe("/");
    expect(manifestContent.display).toBe("standalone");
    expect(manifestContent.orientation).toBe("portrait");
    expect(manifestContent.theme_color).toBe("#09090b");
    expect(manifestContent.background_color).toBe("#09090b");

    // Icons validation
    expect(Array.isArray(manifestContent.icons)).toBe(true);
    const icon192 = manifestContent.icons.find((i: any) => i.sizes === "192x192");
    const icon512 = manifestContent.icons.find((i: any) => i.sizes === "512x512" && i.purpose !== "maskable");
    const maskable512 = manifestContent.icons.find((i: any) => i.purpose === "maskable");

    expect(icon192).toBeDefined();
    expect(icon512).toBeDefined();
    expect(maskable512).toBeDefined();
  });

  it("should have all required PWA icon files present in public/icons/", () => {
    const iconsDir = path.join(publicDir, "icons");
    expect(fs.existsSync(iconsDir)).toBe(true);

    const requiredIcons = [
      "icon-192x192.png",
      "icon-512x512.png",
      "icon-maskable-512x512.png",
      "apple-touch-icon.png",
      "favicon-32x32.png",
      "favicon-16x16.png",
    ];

    for (const icon of requiredIcons) {
      const iconPath = path.join(iconsDir, icon);
      expect(fs.existsSync(iconPath)).toBe(true);
      const stat = fs.statSync(iconPath);
      expect(stat.size).toBeGreaterThan(100);
    }
  });

  it("should have a production-safe Service Worker in public/sw.js", () => {
    const swPath = path.join(publicDir, "sw.js");
    expect(fs.existsSync(swPath)).toBe(true);

    const swContent = fs.readFileSync(swPath, "utf-8");
    // Ensure API caching bypass rules are present
    expect(swContent).toContain("onrender.com");
    expect(swContent).toContain("/api/");
    expect(swContent).toContain("POST");
    expect(swContent).toContain("offline.html");
  });

  it("should have a dedicated offline.html fallback page", () => {
    const offlinePath = path.join(publicDir, "offline.html");
    expect(fs.existsSync(offlinePath)).toBe(true);

    const offlineContent = fs.readFileSync(offlinePath, "utf-8");
    expect(offlineContent).toContain("offline");
    expect(offlineContent).toContain("LearnTrack");
  });
});
