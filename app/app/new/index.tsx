import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const ACTIONS = [
  { id: "expense", title: "Add Expense", icon: "receipt", color: "#10b981", description: "Split a bill with friends or group" },
  { id: "settlement", title: "Record Payment", icon: "cash", color: "#f59e0b", description: "Mark a payment you made or received" },
  { id: "group", title: "Create Group", icon: "people", color: "#818cf8", description: "Start a new group for trips or shared bills" },
  { id: "friend", title: "Add Friend", icon: "person-add", color: "#38bdf8", description: "Connect with someone new" },
];

export default function NewIndex() {
  return (
    <View className="flex-1 bg-[#020617] p-6 justify-center">
      <View className="mb-10">
        <Text className="text-3xl font-bold text-white mb-2">What would you like to do?</Text>
        <Text className="text-slate-500 text-sm">Choose an action below</Text>
      </View>

      <View className="gap-4">
        {ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            activeOpacity={0.7}
            onPress={() => router.push(`/new/${action.id}`)}
            className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800 flex-row items-center"
          >
            <View 
              className="h-12 w-12 rounded-xl items-center justify-center mr-4"
              style={{ backgroundColor: action.color + '20' }}
            >
              <Ionicons name={action.icon as any} size={24} color={action.color} />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-base mb-0.5">{action.title}</Text>
              <Text className="text-slate-500 text-xs">{action.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#475569" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={() => router.back()}
        className="mt-10 self-center h-14 w-14 rounded-full bg-slate-800 items-center justify-center"
      >
        <Ionicons name="close" size={28} color="#94a3b8" />
      </TouchableOpacity>
    </View>
  );
}
