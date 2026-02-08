import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";
import { View, Text, Animated, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { setToastHandler } from "@/lib/notifications";

const { width } = Dimensions.get("window");

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Return a no-op if used outside provider
    return { showToast: (msg: string) => console.log("Toast:", msg) };
  }
  return context;
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -50,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => onRemove());
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const getStyles = () => {
    switch (toast.type) {
      case "success":
        return { bg: "#10b98130", border: "#10b98160", icon: "checkmark-circle", color: "#10b981" };
      case "error":
        return { bg: "#ef444430", border: "#ef444460", icon: "close-circle", color: "#ef4444" };
      case "warning":
        return { bg: "#f59e0b30", border: "#f59e0b60", icon: "warning", color: "#f59e0b" };
      default:
        return { bg: "#38bdf830", border: "#38bdf860", icon: "information-circle", color: "#38bdf8" };
    }
  };

  const styles = getStyles();

  return (
    <Animated.View
      style={[
        toastStyles.toast,
        {
          opacity,
          transform: [{ translateY }],
          backgroundColor: styles.bg,
          borderColor: styles.border,
        },
      ]}
    >
      <Ionicons name={styles.icon as any} size={20} color={styles.color} />
      <Text style={[toastStyles.text, { color: "#fff" }]} numberOfLines={2}>{toast.message}</Text>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev.slice(-2), { id, message, type }]); // Keep max 3 toasts
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Register global toast handler for notifications
  useEffect(() => {
    setToastHandler(showToast);
    return () => setToastHandler(null);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={toastStyles.container} pointerEvents="box-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const toastStyles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    width: width - 32,
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  text: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
});
