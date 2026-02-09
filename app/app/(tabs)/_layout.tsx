import { Tabs, router } from "expo-router";
import { Platform, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";
import { useTheme } from "@/contexts/ThemeContext";

function TabIcon({ icon, focused, colors, isDark }: { icon: any; focused: boolean; colors: any; isDark: boolean }) {
  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { 
          scale: withSpring(focused ? 1.1 : 1, {
            damping: 10,
            stiffness: 100,
          }) 
        }
      ],
    };
  }, [focused]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(
        focused ? colors.surfaceActive : 'transparent',
        { duration: 200 }
      ),
    };
  }, [focused, colors.surfaceActive]);

  return (
    <Animated.View style={[styles.tabIconContainer, animatedContainerStyle]}>
      <Animated.View style={animatedIconStyle}>
        <Ionicons 
          name={focused ? icon : `${icon}-outline`} 
          size={24} 
          color={focused ? colors.primary : colors.textTertiary} 
        />
      </Animated.View>
    </Animated.View>
  );
}

export default function TabsLayout() {
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          bottom: Platform.OS === "ios" ? 32 : 20,
          left: 20,
          right: 20,
          height: 72,
          backgroundColor: colors.surface,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: colors.border,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          paddingBottom: 0,
          paddingTop: 0,
        },
        tabBarItemStyle: {
          height: 72,
          paddingVertical: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="home" focused={focused} colors={colors} isDark={isDark} />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: "Groups",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="people" focused={focused} colors={colors} isDark={isDark} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "Add",
          tabBarIcon: ({ focused }) => (
            <View style={[
              styles.addButton,
              { 
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
              }
            ]}>
              <Ionicons name="add" size={32} color={isDark ? "#000000" : "#FFFFFF"} />
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
            <TabIcon icon="receipt" focused={focused} colors={colors} isDark={isDark} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="person" focused={focused} colors={colors} isDark={isDark} />
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
    height: 48,
    width: 48,
    borderRadius: 24, // Circular container for premium feel
  },
  addButton: {
    height: 54, // Centered vertically in 72px bar
    width: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, // Softer shadow
    shadowRadius: 6,
    elevation: 4,
  },
});
