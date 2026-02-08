import { useRef, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";

interface Group {
  id: string;
  name: string;
  description?: string | null;
  members: Array<{ user: { id: string; name: string; avatarUrl?: string } }>;
}

export default function GroupsScreen() {
  const { data: groups, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["groups"],
    queryFn: () => apiGet<Group[]>("/groups"),
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [])
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#020617] items-center justify-center">
        <Text className="text-slate-400">Loading groups...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#020617]" edges={['top']}>
      <FlatList
        data={groups ?? []}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#38bdf8" />
        }
        ListHeaderComponent={
          <View className="mb-6 mt-4 flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-white">Groups</Text>
              <Text className="text-slate-500 text-sm">Manage your shared expenses</Text>
            </View>
            <TouchableOpacity 
              onPress={() => router.push("/new/group")}
              className="bg-primary h-10 w-10 rounded-xl items-center justify-center"
            >
              <Ionicons name="add" size={22} color="#020617" />
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View className="py-16 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 items-center justify-center">
            <View className="bg-slate-800/50 p-5 rounded-full mb-4">
              <Ionicons name="people-outline" size={32} color="#475569" />
            </View>
            <Text className="text-slate-400 font-bold">No groups yet</Text>
            <Text className="text-slate-600 text-sm mt-1">Create a group to start splitting</Text>
            <TouchableOpacity 
              onPress={() => router.push("/new/group")}
              className="mt-4 bg-primary px-5 py-2.5 rounded-xl"
            >
              <Text className="text-[#020617] font-bold">Create Group</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => router.push(`/group/${item.id}`)}
            className="bg-slate-900/50 rounded-xl p-4 mb-3 border border-slate-800 flex-row items-center"
          >
            <View className="h-12 w-12 rounded-xl bg-indigo-500/20 items-center justify-center mr-4">
              <Ionicons name="people" size={22} color="#818cf8" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-base">{item.name}</Text>
              {item.description && (
                <Text className="text-slate-500 text-sm" numberOfLines={1}>{item.description}</Text>
              )}
              <Text className="text-slate-600 text-xs mt-1">{item.members.length} members</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#475569" />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
