import { prisma } from "../lib/prisma.js";
import { Expo, ExpoPushMessage } from "expo-server-sdk";

const expo = new Expo();

export enum ActivityType {
    EXPENSE_ADDED = "EXPENSE_ADDED",
    EXPENSE_UPDATED = "EXPENSE_UPDATED",
    EXPENSE_DELETED = "EXPENSE_DELETED",
    SETTLEMENT_MADE = "SETTLEMENT_MADE",
    SETTLEMENT_COMPLETED = "SETTLEMENT_COMPLETED",
    GROUP_CREATED = "GROUP_CREATED",
    FRIEND_ADDED = "FRIEND_ADDED",
}

interface ActivityConfig {
    userId: string;
    type: ActivityType;
    targetId?: string;
    groupId?: string;
    data?: any;
}

export async function logActivity(config: ActivityConfig) {
    try {
        const activity = await prisma.activity.create({
            data: {
                userId: config.userId,
                type: config.type as any,
                targetId: config.targetId,
                groupId: config.groupId,
                data: config.data || {},
            },
        });
        return activity;
    } catch (error) {
        console.error("[Activity] Failed to log activity:", error);
    }
}

export async function sendNotification(userId: string, title: string, body: string, activityId?: string) {
    try {
        // 1. Save in-app notification
        await prisma.notification.create({
            data: {
                userId,
                title,
                body,
                activityId,
            },
        });

        // 2. Send push notification if token exists
        const tokens = await prisma.pushToken.findMany({
            where: { userId },
        });

        if (tokens.length === 0) return;

        const messages: ExpoPushMessage[] = [];
        for (const pushToken of tokens) {
            if (!Expo.isExpoPushToken(pushToken.token)) {
                console.error(`[Push] Token ${pushToken.token} is not a valid Expo push token`);
                continue;
            }

            messages.push({
                to: pushToken.token,
                sound: "default",
                title: title,
                body: body,
                data: { activityId },
            });
        }

        const chunks = expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
            try {
                await expo.sendPushNotificationsAsync(chunk);
            } catch (error) {
                console.error("[Push] Error sending chunk:", error);
            }
        }
    } catch (error) {
        console.error("[Notification] Failed to send notification:", error);
    }
}
