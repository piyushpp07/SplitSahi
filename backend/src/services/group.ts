import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";

export class GroupService {
    static async getUserGroups(userId: string) {
        return prisma.group.findMany({
            where: { members: { some: { userId } } },
            include: {
                creator: { select: { id: true, name: true, username: true, avatarUrl: true, emoji: true } },
                members: {
                    include: {
                        user: { select: { id: true, name: true, username: true, avatarUrl: true, email: true, emoji: true } }
                    }
                },
            },
            orderBy: { updatedAt: "desc" },
        });
    }

    static async getGroupById(groupId: string, userId: string) {
        const group = await prisma.group.findFirst({
            where: { id: groupId, members: { some: { userId } } },
            include: {
                creator: { select: { id: true, name: true, username: true, avatarUrl: true, emoji: true } },
                members: {
                    include: {
                        user: { select: { id: true, name: true, username: true, avatarUrl: true, email: true, emoji: true } }
                    }
                },
            },
        });
        if (!group) throw new AppError(404, "Group not found", "NOT_FOUND");
        return group;
    }

    static async createGroup(userId: string, data: { name: string; description?: string; emoji?: string; memberIds?: string[] }) {
        return prisma.group.create({
            data: {
                name: data.name,
                description: data.description,
                emoji: data.emoji,
                createdById: userId,
                members: {
                    create: [
                        { userId, role: "ADMIN" },
                        ...(Array.isArray(data.memberIds)
                            ? data.memberIds
                                .filter((id) => id !== userId)
                                .map((id) => ({ userId: id, role: "MEMBER" as const }))
                            : []),
                    ],
                },
            },
            include: {
                creator: { select: { id: true, name: true, username: true, avatarUrl: true, emoji: true } },
                members: {
                    include: {
                        user: { select: { id: true, name: true, username: true, avatarUrl: true, emoji: true } }
                    }
                },
            },
        });
    }

    static async updateGroup(groupId: string, userId: string, data: { name?: string; description?: string; emoji?: string }) {
        const admin = await prisma.groupMember.findFirst({
            where: { groupId, userId, role: "ADMIN" },
        });
        if (!admin) throw new AppError(403, "Only admins can update group", "FORBIDDEN");

        return prisma.group.update({
            where: { id: groupId },
            data,
            include: {
                creator: { select: { id: true, name: true, username: true, avatarUrl: true, emoji: true } },
                members: {
                    include: {
                        user: { select: { id: true, name: true, username: true, avatarUrl: true, emoji: true } }
                    }
                },
            },
        });
    }

    static async deleteGroup(groupId: string, userId: string) {
        const admin = await prisma.groupMember.findFirst({
            where: { groupId, userId, role: "ADMIN" },
        });
        if (!admin) throw new AppError(403, "Only admins can delete group", "FORBIDDEN");

        return prisma.group.delete({ where: { id: groupId } });
    }

    static async joinGroup(userId: string, groupId: string) {
        const group = await prisma.group.findUnique({
            where: { id: groupId },
            include: {
                members: { select: { userId: true } },
            },
        });

        if (!group) {
            throw new AppError(404, "Group not found", "NOT_FOUND");
        }

        const isMember = group.members.some((m) => m.userId === userId);
        if (isMember) {
            throw new AppError(400, "Already a member", "ALREADY_MEMBER");
        }

        await prisma.groupMember.create({
            data: { groupId, userId, role: "MEMBER" },
        });

        return this.getGroupById(groupId, userId);
    }

    static async addMember(groupId: string, adminUserId: string, targetUserId: string) {
        const admin = await prisma.groupMember.findFirst({
            where: { groupId, userId: adminUserId, role: "ADMIN" },
        });
        if (!admin) throw new AppError(403, "Only admins can add members", "FORBIDDEN");

        const existing = await prisma.groupMember.findFirst({
            where: { groupId, userId: targetUserId }
        });
        if (existing) throw new AppError(400, "User already in group", "ALREADY_MEMBER");

        await prisma.groupMember.create({
            data: { groupId, userId: targetUserId, role: "MEMBER" },
        });

        return this.getGroupById(groupId, adminUserId);
    }

    static async removeMember(groupId: string, requesterUserId: string, targetUserId: string) {
        const requester = await prisma.groupMember.findFirst({
            where: { groupId, userId: requesterUserId },
        });

        if (!requester) throw new AppError(403, "Not authorized", "FORBIDDEN");

        if (requester.role !== "ADMIN" && requesterUserId !== targetUserId) {
            throw new AppError(403, "Only admins can remove other members", "FORBIDDEN");
        }

        return prisma.groupMember.deleteMany({
            where: { groupId, userId: targetUserId },
        });
    }
}
