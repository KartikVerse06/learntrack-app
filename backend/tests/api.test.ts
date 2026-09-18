import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/server.js";
import { prisma } from "../src/lib/db.js";

describe("LearnTrack Backend API End-to-End Integration Suite", () => {
  const testEmail = `api-test-${Date.now()}@learntrack.local`;
  const testPassword = "Password123!";
  let authToken = "";
  let taskId = "";
  let sessionId = "";
  let revisionId = "";

  afterAll(async () => {
    // Cleanup test user and cascaded records
    await prisma.user.deleteMany({
      where: { email: { contains: "api-test-" } },
    });
    await prisma.$disconnect();
  });

  it("1. GET /health should return 200 and database connected", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.database).toBe("connected");
  });

  it("2. POST /api/v1/auth/register should create a user and return token", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "API Tester",
        email: testEmail,
        password: testPassword,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.token).toBeDefined();
    authToken = res.body.data.token;
  });

  it("3. POST /api/v1/auth/login should authenticate user and issue JWT", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  it("4. GET /api/v1/auth/me should return authenticated profile", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail);
  });

  it("5. POST /api/v1/tasks should create a learning task", async () => {
    const res = await request(app)
      .post("/api/v1/tasks")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "Test Decoupled API Task",
        description: "Testing API backend separation",
        priority: "HIGH",
        estimatedSessions: 1,
        plannedDate: new Date().toISOString().slice(0, 10),
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    taskId = res.body.data.id;
  });

  it("6. GET /api/v1/tasks should retrieve user tasks", async () => {
    const res = await request(app)
      .get("/api/v1/tasks")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((t: any) => t.id === taskId)).toBe(true);
  });

  it("7. POST /api/v1/tasks/:id/toggle should toggle status to IN_PROGRESS", async () => {
    const res = await request(app)
      .post(`/api/v1/tasks/${taskId}/toggle`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("IN_PROGRESS");
  });

  it("8. POST /api/v1/focus/start should start a 45m focus session", async () => {
    const res = await request(app)
      .post("/api/v1/focus/start")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ taskId });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.plannedDuration).toBe(2700);
    sessionId = res.body.data.id;
  });

  it("9. POST /api/v1/focus/:id/pause should pause active session", async () => {
    const res = await request(app)
      .post(`/api/v1/focus/${sessionId}/pause`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("PAUSED");
  });

  it("10. POST /api/v1/focus/:id/complete should complete focus session", async () => {
    const res = await request(app)
      .post(`/api/v1/focus/${sessionId}/complete`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ actualDuration: 2700 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("COMPLETED");
  });

  it("11. POST /api/v1/learning-logs should create a reflection log", async () => {
    const res = await request(app)
      .post("/api/v1/learning-logs")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        taskId,
        sessionId,
        whatLearned: "Learned decoupled backend REST architecture",
        whatCompleted: "Backend services and tests",
        confidence: 5,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.whatLearned).toBe("Learned decoupled backend REST architecture");
  });

  it("12. POST /api/v1/revisions/mark-learned should trigger 4-interval spaced revisions", async () => {
    const res = await request(app)
      .post("/api/v1/revisions/mark-learned")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ taskId });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.revisions.length).toBe(4);
    revisionId = res.body.data.revisions[0].id;
  });

  it("13. GET /api/v1/revisions should return scheduled revisions", async () => {
    const res = await request(app)
      .get("/api/v1/revisions?filter=all")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(4);
  });

  it("14. GET /api/v1/calendar/events should return calendar items", async () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const end = new Date(today.getFullYear(), today.getMonth() + 2, 1).toISOString().slice(0, 10);

    const res = await request(app)
      .get(`/api/v1/calendar/events?start=${start}&end=${end}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("15. GET /api/v1/analytics should return analytics data payload", async () => {
    const res = await request(app)
      .get("/api/v1/analytics?range=30d")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary).toBeDefined();
  });

  it("16. POST /api/v1/money/budget should set 50/20/20/10 budget", async () => {
    const now = new Date();
    const res = await request(app)
      .post("/api/v1/money/budget")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        amount: 10000,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.needsAmount).toBe(5000);
    expect(res.body.data.savingsAmount).toBe(2000);
    expect(res.body.data.growthAmount).toBe(2000);
    expect(res.body.data.wantsAmount).toBe(1000);
  });

  it("17. GET /api/v1/reports/stats should return overview report metrics", async () => {
    const res = await request(app)
      .get("/api/v1/reports/stats?range=30d")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalTasks).toBeGreaterThanOrEqual(1);
  });

  it("18. GET /api/v1/reports/download should stream CSV file with headers", async () => {
    const res = await request(app)
      .get("/api/v1/reports/download?type=learning-progress&format=csv&range=30d")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.headers["content-disposition"]).toContain("attachment; filename=");
    expect(res.text.startsWith("\uFEFF")).toBe(true);
  });

  it("19. GET /api/v1/reports/download should stream JSON file with schema", async () => {
    const res = await request(app)
      .get("/api/v1/reports/download?type=complete&format=json&range=30d")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/json");
    const parsed = JSON.parse(res.text);
    expect(parsed.schema).toBe("https://learntrack.app/schemas/report-v1.json");
    expect(parsed.reportType).toBe("complete");
  });

  it("20. Zero-Trust Security: unauthenticated request should be rejected with 401", async () => {
    const res = await request(app).get("/api/v1/tasks");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("21. Invalid JWT: malformed token string should be rejected with 401", async () => {
    const res = await request(app)
      .get("/api/v1/tasks")
      .set("Authorization", "Bearer this.is.not.a.valid.jwt");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("22. Invalid JWT: token signed with wrong secret should be rejected with 401", async () => {
    // Sign a structurally valid JWT with the wrong secret
    const jwt = await import("jsonwebtoken");
    const badToken = jwt.default.sign(
      { userId: "fake-id", email: "attacker@evil.com" },
      "wrong-secret-that-does-not-match-production-key"
    );

    const res = await request(app)
      .get("/api/v1/tasks")
      .set("Authorization", `Bearer ${badToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("23. Ownership isolation (FLOW J): User B cannot read User A's task by ID", async () => {
    // Register a second user (User B)
    const userBEmail = `ownership-test-${Date.now()}@learntrack.local`;
    const regB = await request(app)
      .post("/api/v1/auth/register")
      .send({ name: "User B", email: userBEmail, password: "Password123!" });

    expect(regB.status).toBe(201);
    const userBToken = regB.body.data.token;

    // User B attempts to GET User A's task by its known ID
    const res = await request(app)
      .get(`/api/v1/tasks/${taskId}`)
      .set("Authorization", `Bearer ${userBToken}`);

    // Must be 404 — not 200 and not 403
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);

    // Cleanup User B
    await prisma.user.deleteMany({ where: { email: userBEmail } });
  });
});

