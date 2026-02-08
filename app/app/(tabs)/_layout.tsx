import { Tabs, router } from "expo-router";
import { Platform, View, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";

function TabIcon({ icon, focused }: { icon: any; focused: boolean }) {
  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { 
          scale: withSpring(focused ? 1.2 : 1, {
            damping: 12,
            stiffness: 100,
          }) 
        }
      ],
      opacity: withTiming(focused ? 1 : 0.5, { duration: 200 }),
    };
  }, [focused]);

  const animatedPillStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(focused ? 20 : 0, { damping: 12 }),
      opacity: withTiming(focused ? 1 : 0, { duration: 150 }),
    };
  }, [focused]);

  return (
    <View style={styles.tabIconContainer}>
      <Animated.View style={[styles.activePill, animatedPillStyle]} />
      <Animated.View style={animatedIconStyle}>
        <Ionicons 
          name={focused ? icon : `${icon}-outline`} 
          size={26} 
          color={focused ? "#38bdf8" : "#94a3b8"} 
        />
      </Animated.View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          bottom: Platform.OS === "ios" ? 28 : 20,
          left: 40,
          right: 40,
          height: 54,
          backgroundColor: Platform.OS === "ios" ? "transparent" : "rgba(11, 19, 43, 0.98)",
          borderRadius: 27,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: "rgba(56, 189, 248, 0.15)",
          elevation: 15,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.4,
          shadowRadius: 15,
          paddingBottom: 0,
        },
        tabBarItemStyle: {
          height: 54,
        },
        tabBarBackground: () => (
          Platform.OS === "ios" ? (
            <BlurView intensity={90} tint="dark" style={{ ...StyleSheet.absoluteFillObject, borderRadius: 27, overflow: 'hidden' }} />
          ) : null
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="stats-chart" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: "Groups",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="people" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "Add",
          tabBarIcon: ({ focused }) => (
            <View className="h-14 w-14 rounded-full bg-primary items-center justify-center shadow-lg shadow-primary/30 -mt-4 border-4 border-[#020617]">
              <Ionicons name="add" size={32} color="#020617" />
            </View>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push("/new");
          },
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: "Activity",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="list" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="person" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 54,
    width: 60,
    paddingTop: 6,
  },
  activePill: {
    position: "absolute",
    top: 0,
    width: 16,
    height: 2,
    backgroundColor: "#38bdf8",
    borderRadius: 1,
    shadowColor: "#38bdf8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
});
