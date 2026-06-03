import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import type { AuthVerifier } from "../auth/auth.middleware.js";
import type { AuthUser, SystemRole, UserRepository } from "../auth/auth.service.js";
import type { NotificationRepository } from "./notification.repository.js";
import type { Notification } from "./notification.repository.js";

const now = "2026-06-03T00:00:00.000Z";
const userId1 = "507f1f77bcf86cd799439aa1";
const userId2 = "507f1f77bcf86cd799439aa2";
const notifId1 = "507f1f77bcf86cd799439bb1";
const notifId2 = "507f1f77bcf86cd799439bb2";
const notifId3 = "507f1f77bcf86cd799439bb3";

function createAuthUser(clerkId: string, id: string, systemRole: SystemRole): AuthUser {
  return {
    id,
    clerkId,
    email: `${clerkId}@example.com`,
    fullName: clerkId,
    avatarUrl: null,
    systemRole,
    requestedSystemRole: null,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now
  };
}

const user1 = createAuthUser("clerk_notif_user1", userId1, "MANGAKA");
const user2 = createAuthUser("clerk_notif_user2", userId2, "ASSISTANT");

function createVerifier(clerkId: string, systemRole: SystemRole | null = null): AuthVerifier {
  return {
    async verify() {
      return { clerkId, systemRole, status: "ACTIVE" as const };
    },
    async verifyWithProfile() {
      return { clerkId, email: `${clerkId}@example.com`, fullName: clerkId, avatarUrl: null };
    }
  };
}

function createUserRepository(): UserRepository {
  const users = [user1, user2];
  const byClerkId = new Map(users.map((u) => [u.clerkId, u]));
  const byId = new Map(users.map((u) => [u.id, u]));
  return {
    async findByClerkId(clerkId) {
      return byClerkId.get(clerkId) ?? null;
    },
    async upsertFromProfile(profile) {
      return byClerkId.get(profile.clerkId) ?? createAuthUser(profile.clerkId, `gen_${profile.clerkId}`, "MANGAKA");
    },
    async updateOnboarding() {
      throw new Error("not needed");
    },
    async findById(id) {
      return byId.get(id) ?? null;
    }
  };
}

function makeNotif(overrides: Partial<Notification> & { id: string; userId: string }): Notification {
  return {
    id: overrides.id,
    userId: overrides.userId,
    type: overrides.type ?? "TASK_ASSIGNED",
    title: overrides.title ?? "Test notification",
    message: overrides.message ?? "Test message",
    isRead: overrides.isRead ?? false,
    link: overrides.link,
    createdAt: now,
    updatedAt: now
  };
}

const allUsers = [user1, user2];

function createNotificationRepository(initial: Notification[]): NotificationRepository {
  let store = [...initial];
  let counter = 100;
  return {
    async create(data) {
      const notif = makeNotif({
        id: `gen_${++counter}`,
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link
      });
      store.push(notif);
      return notif;
    },
    async listByUser(userId, opts = {}) {
      const { limit = 30, skip = 0 } = opts;
      return store
        .filter((n) => n.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(skip, skip + limit);
    },
    async countUnread(userId) {
      return store.filter((n) => n.userId === userId && !n.isRead).length;
    },
    async markRead(id, userId) {
      const idx = store.findIndex((n) => n.id === id && n.userId === userId);
      if (idx === -1) return null;
      store[idx] = { ...store[idx], isRead: true };
      return store[idx];
    },
    async markAllRead(userId) {
      store = store.map((n) => (n.userId === userId ? { ...n, isRead: true } : n));
    },
    async delete(id, userId) {
      const before = store.length;
      store = store.filter((n) => !(n.id === id && n.userId === userId));
      return store.length < before;
    }
  };
}

// â”€â”€â”€ Tests â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe("GET /api/notifications â€” unauthenticated", () => {
  it("returns 401 when no token provided", async () => {
    const notifRepo = createNotificationRepository([]);
    const app = createApp({
      authVerifier: createVerifier("clerk_notif_user1"),
      userRepository: createUserRepository(),
      notificationRepository: notifRepo
    });
    const res = await request(app).get("/api/notifications");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/notifications â€” user-scoped", () => {
  it("returns only the current user's notifications", async () => {
    const notifRepo = createNotificationRepository([
      makeNotif({ id: notifId1, userId: userId1, title: "For user1" }),
      makeNotif({ id: notifId2, userId: userId2, title: "For user2" })
    ]);
    const app = createApp({
      authVerifier: createVerifier("clerk_notif_user1"),
      userRepository: createUserRepository(),
      notificationRepository: notifRepo
    });
    const res = await request(app)
      .get("/api/notifications")
      .set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const titles = res.body.data.map((n: any) => n.title);
    expect(titles).toContain("For user1");
    expect(titles).not.toContain("For user2");
  });
});

describe("GET /api/notifications/unread-count", () => {
  it("returns correct unread count for current user", async () => {
    const notifRepo = createNotificationRepository([
      makeNotif({ id: notifId1, userId: userId1, isRead: false }),
      makeNotif({ id: notifId2, userId: userId1, isRead: true }),
      makeNotif({ id: notifId3, userId: userId2, isRead: false })
    ]);
    const app = createApp({
      authVerifier: createVerifier("clerk_notif_user1"),
      userRepository: createUserRepository(),
      notificationRepository: notifRepo
    });
    const res = await request(app)
      .get("/api/notifications/unread-count")
      .set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(1);
  });
});

describe("PATCH /api/notifications/:id/read", () => {
  it("marks own notification as read", async () => {
    const notifRepo = createNotificationRepository([
      makeNotif({ id: notifId1, userId: userId1, isRead: false })
    ]);
    const app = createApp({
      authVerifier: createVerifier("clerk_notif_user1"),
      userRepository: createUserRepository(),
      notificationRepository: notifRepo
    });
    const res = await request(app)
      .patch(`/api/notifications/${notifId1}/read`)
      .set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
    expect(res.body.data.isRead).toBe(true);
  });

  it("returns 404 when notification belongs to another user", async () => {
    const notifRepo = createNotificationRepository([
      makeNotif({ id: notifId2, userId: userId2, isRead: false })
    ]);
    const app = createApp({
      authVerifier: createVerifier("clerk_notif_user1"),
      userRepository: createUserRepository(),
      notificationRepository: notifRepo
    });
    const res = await request(app)
      .patch(`/api/notifications/${notifId2}/read`)
      .set("Authorization", "Bearer token");
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/notifications/read-all", () => {
  it("marks all own notifications as read", async () => {
    const notifRepo = createNotificationRepository([
      makeNotif({ id: notifId1, userId: userId1, isRead: false }),
      makeNotif({ id: notifId2, userId: userId1, isRead: false }),
      makeNotif({ id: notifId3, userId: userId2, isRead: false })
    ]);
    const app = createApp({
      authVerifier: createVerifier("clerk_notif_user1"),
      userRepository: createUserRepository(),
      notificationRepository: notifRepo
    });
    await request(app)
      .patch("/api/notifications/read-all")
      .set("Authorization", "Bearer token");
    // Verify unread count for user1 is now 0
    const countRes = await request(app)
      .get("/api/notifications/unread-count")
      .set("Authorization", "Bearer token");
    expect(countRes.body.data.count).toBe(0);
  });
});

describe("DELETE /api/notifications/:id", () => {
  it("deletes own notification", async () => {
    const notifRepo = createNotificationRepository([
      makeNotif({ id: notifId1, userId: userId1 })
    ]);
    const app = createApp({
      authVerifier: createVerifier("clerk_notif_user1"),
      userRepository: createUserRepository(),
      notificationRepository: notifRepo
    });
    const res = await request(app)
      .delete(`/api/notifications/${notifId1}`)
      .set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
    expect(res.body.data.deleted).toBe(true);
  });

  it("returns 404 when notification belongs to another user", async () => {
    const notifRepo = createNotificationRepository([
      makeNotif({ id: notifId2, userId: userId2 })
    ]);
    const app = createApp({
      authVerifier: createVerifier("clerk_notif_user1"),
      userRepository: createUserRepository(),
      notificationRepository: notifRepo
    });
    const res = await request(app)
      .delete(`/api/notifications/${notifId2}`)
      .set("Authorization", "Bearer token");
    expect(res.status).toBe(404);
  });
});

