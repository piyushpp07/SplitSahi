import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";

const ACTIONS = [
  { id: "expense", title: "Add Expense", icon: "receipt", color: "#10b981", description: "Split a bill with friends or group" },
  { id: "settlement", title: "Record Payment", icon: "cash", color: "#f59e0b", description: "Mark a payment you made or received" },
  { id: "group", title: "Create Group", icon: "people", color: "#818cf8", description: "Start a new group for trips or shared bills" },
  { id: "friend", title: "Add Friend", icon: "person-add", color: "#38bdf8", description: "Connect with someone new" },
];

export default function NewIndex() {
  const { colors, isDark } = useTheme();
  
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 24, justifyContent: 'center' }}>
      <View style={{ marginBottom: 40 }}>
        <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>What would you like to do?</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Choose an action below</Text>
      </View>

      <View style={{ gap: 16 }}>
        {ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            activeOpacity={0.7}
            onPress={() => router.push(`/new/${action.id}`)}
            style={{ 
              backgroundColor: colors.surface, 
              borderRadius: 16, 
              padding: 20, 
              borderWidth: 1, 
              borderColor: colors.border, 
              flexDirection: 'row', 
              alignItems: 'center',
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2
            }}
          >
            <View 
              style={{ 
                height: 48, width: 48, borderRadius: 12, 
                alignItems: 'center', justifyContent: 'center', 
                marginRight: 16, 
                backgroundColor: isDark ? action.color + '20' : action.color + '15' 
              }}
            >
              <Ionicons name={action.icon as any} size={24} color={action.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 16, marginBottom: 2 }}>{action.title}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{action.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={() => router.back()}
        style={{ 
          marginTop: 40, alignSelf: 'center', 
          height: 56, width: 56, borderRadius: 28, 
          backgroundColor: colors.surface, 
          alignItems: 'center', justifyContent: 'center', 
          borderWidth: 1, borderColor: colors.border 
        }}
      >
        <Ionicons name="close" size={28} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}
