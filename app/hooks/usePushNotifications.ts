import { useState, useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { apiPost } from "@/lib/api";
import Constants from "expo-constants";
import { useAuthStore } from "@/store/authStore";

export function usePushNotifications() {
    const [expoPushToken, setExpoPushToken] = useState("");
    const [notification, setNotification] = useState<Notifications.Notification>();
    const notificationListener = useRef<Notifications.Subscription | null>(null);
    const responseListener = useRef<Notifications.Subscription | null>(null);

    const { user } = useAuthStore();

    useEffect(() => {
        if (!user) return;

        registerForPushNotificationsAsync().then((token) => {
            if (token) {
                setExpoPushToken(token);
                // Register token with backend
                apiPost("/users/push-token", {
                    token,
                    device: Platform.OS
                }).catch(err => console.log("[Push] Registration skipped or failed:", err.message));
            }
        });

        notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
            setNotification(notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
            console.log(response);
        });

        return () => {
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, []);

    return { expoPushToken, notification };
}

async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF231F7C",
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== "granted") {
            console.log("Failed to get push token for push notification!");
            return;
        }

        try {
            const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
            if (!projectId) {
                console.error("Project ID not found in expo config");
            }
            token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        } catch (e) {
            console.error("Error getting Expo Push Token:", e);
        }
    } else {
        console.log("Must use physical device for Push Notifications");
    }

    return token;
}
