import { beforeEach, describe, expect, it, vi } from "vitest"

const listUsers = vi.fn()
const getUserByEmail = vi.fn()
const createUser = vi.fn()
const updateUser = vi.fn()
const getBoardMemberByUser = vi.fn()
const updateBoardMember = vi.fn()
const hashPassword = vi.fn()
const revokeAllUserTokens = vi.fn()
const toAuthUser = vi.fn()

vi.mock("./admin.repository.js", () => ({
  listUsers,
  getUserByEmail,
  createUser,
  updateUser,
  getBoardMemberByUser,
  updateBoardMember,
}))

vi.mock("../auth/auth.service.js", () => ({
  hashPassword,
  revokeAllUserTokens,
  toAuthUser,
}))

const service = await import("./admin.service.js")

describe("admin user service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hashPassword.mockResolvedValue("hashed-password")
    toAuthUser.mockImplementation((id: string) => Promise.resolve({ id, email: "user@example.com", name: "User", role: "MANGAKA", isActive: true }))
  })

  it("lists admin users through repository", async () => {
    listUsers.mockResolvedValue([{ email: "a@example.com" }])

    await expect(service.listAdminUsersService()).resolves.toHaveLength(1)
    expect(listUsers).toHaveBeenCalled()
  })

  it("creates user with lowercased email and hashed password", async () => {
    getUserByEmail.mockResolvedValue(null)
    createUser.mockResolvedValue({ id: "user1" })

    const result = await service.createAdminUserService({ email: "New@Example.com", password: "Password123", name: "New User", role: "ASSISTANT" })

    expect(createUser).toHaveBeenCalledWith(expect.objectContaining({ email: "new@example.com", passwordHash: "hashed-password", role: "ASSISTANT" }))
    expect(result).toMatchObject({ id: "user1" })
  })

  it("revokes tokens after role update and disables stale board member when role is not BOARD", async () => {
    updateUser.mockResolvedValue({ id: "user1" })
    getBoardMemberByUser.mockResolvedValue({ userId: "user1" })

    await service.updateAdminUserRoleService("user1", "EDITOR")

    expect(updateBoardMember).toHaveBeenCalledWith("user1", { isActive: false, isChair: false })
    expect(revokeAllUserTokens).toHaveBeenCalledWith("user1")
  })

  it("blocks admin from suspending own account", async () => {
    await expect(service.suspendAdminUserService("admin1", "admin1")).rejects.toThrow("Admin cannot suspend their own account")
    expect(updateUser).not.toHaveBeenCalled()
  })

  it("activates a suspended user", async () => {
    updateUser.mockResolvedValue({ id: "user1" })

    const result = await service.activateAdminUserService("user1")

    expect(updateUser).toHaveBeenCalledWith("user1", { isActive: true })
    expect(result).toMatchObject({ id: "user1" })
  })
})
