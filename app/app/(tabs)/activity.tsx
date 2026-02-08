import { useState, useCallback } from "react";
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, TextInput } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";

interface ActivityItem {
  type: "expense" | "settlement";
  id: string;
  createdAt: string;
  data: any;
}

type FilterType = "all" | "expenses" | "settlements";

export default function ActivityScreen() {
  const userId = useAuthStore((s) => s.user?.id);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["activity"],
    queryFn: () => apiGet<{ activities: ActivityItem[] }>("/activity"),
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [])
  );

  const activities = data?.activities || [];
  
  const filteredActivities = activities.filter(item => {
    // 1. Filter by Type
    if (filter === "expenses" && item.type !== "expense") return false;
    if (filter === "settlements" && item.type !== "settlement") return false;

    // 2. Filter by Search
    if (!search) return true;
    const q = search.toLowerCase();
    
    if (item.type === "expense") {
      return (
        item.data.title?.toLowerCase().includes(q) || 
        item.data.creator?.name?.toLowerCase().includes(q) ||
        item.data.group?.name?.toLowerCase().includes(q) ||
        item.data.totalAmount?.toString().includes(q)
      );
    } else {
       // Settlement
       return (
         item.data.fromUser?.name?.toLowerCase().includes(q) ||
         item.data.toUser?.name?.toLowerCase().includes(q) ||
         item.data.amount?.toString().includes(q)
       );
    }
  });

  function handlePress(item: ActivityItem) {
    if (item.type === "expense") {
      router.push(`/expense/${item.id}`);
    }
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + 
           `, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  return (
    <SafeAreaView className="flex-1 bg-[#020617]" edges={['top']}>
      <View className="flex-1 px-5">
        {/* Header */}
        <View className="mb-6 mt-4 flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-white">Activity</Text>
            <Text className="text-slate-500 text-sm">Your recent transactions</Text>
          </View>
          <TouchableOpacity 
            onPress={() => setShowSearch(!showSearch)}
            className={`h-10 w-10 rounded-xl items-center justify-center ${showSearch ? 'bg-primary' : 'bg-slate-800'}`}
          >
            <Ionicons name="search" size={20} color={showSearch ? "#020617" : "#94a3b8"} />
          </TouchableOpacity>
        </View>

        {showSearch && (
          <View className="mb-4 bg-slate-900 rounded-xl border border-slate-800 p-1 flex-row items-center">
            <View className="h-10 w-10 items-center justify-center ml-2">
              <Ionicons name="search" size={20} color="#64748b" />
            </View>
            <TextInput
              className="flex-1 px-3 py-3 text-white "
              placeholder="Search expenses..."
              placeholderTextColor="#475569"
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")} className="mr-3">
                <Ionicons name="close-circle" size={18} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Filter Tabs */}
        <View className="flex-row bg-slate-900 rounded-xl p-1 mb-4">
          {[
            { key: "all", label: "All" },
            { key: "expenses", label: "Expenses" },
            { key: "settlements", label: "Payments" },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key as FilterType)}
              className={`flex-1 py-2.5 rounded-lg ${filter === f.key ? 'bg-slate-700' : ''}`}
            >
              <Text className={`text-center font-bold text-sm ${filter === f.key ? 'text-white' : 'text-slate-500'}`}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <ActivityIndicator color="#38bdf8" size="large" className="mt-20" />
        ) : (
          <FlatList
            data={filteredActivities}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#38bdf8" />
            }
            renderItem={({ item }) => {
              const isSettlement = item.type === "settlement";
              
              return (
                <TouchableOpacity 
                  className="mb-3 bg-slate-900/50 rounded-xl p-4 border border-slate-800"
                  onPress={() => handlePress(item)}
                  activeOpacity={isSettlement ? 1 : 0.7}
                >
                  <View className="flex-row items-start">
                    <View className={`h-10 w-10 rounded-xl items-center justify-center mr-3 ${isSettlement ? 'bg-amber-500/20' : 'bg-emerald-500/20'}`}>
                      <Ionicons 
                        name={isSettlement ? "swap-horizontal" : "receipt"} 
                        size={18} 
                        color={isSettlement ? "#f59e0b" : "#10b981"} 
                      />
                    </View>
                    
                    <View className="flex-1">
                      {isSettlement ? (
                        <>
                          <Text className="text-white font-bold">
                            {item.data.fromUser?.name} paid {item.data.toUser?.name}
                          </Text>
                          <Text className="text-slate-500 text-xs mt-0.5">{formatDate(item.createdAt)}</Text>
                        </>
                      ) : (
                        <>
                          <Text className="text-white font-bold">{item.data.title}</Text>
                          <View className="flex-row items-center mt-0.5">
                            <Text className="text-slate-500 text-xs">
                              {item.data.creator?.name} • {formatDate(item.createdAt)}
                            </Text>
                          </View>
                          {item.data.group && (
                            <View className="flex-row items-center mt-1">
                              <Ionicons name="people" size={12} color="#475569" />
                              <Text className="text-slate-500 text-xs ml-1">{item.data.group.name}</Text>
                            </View>
                          )}
                        </>
                      )}
                    </View>
                    
                    <View className="items-end">
                      <Text className={`font-bold text-lg ${isSettlement ? 'text-amber-400' : 'text-emerald-400'}`}>
                        ₹{Number(isSettlement ? item.data.amount : item.data.totalAmount).toFixed(0)}
                      </Text>
                      {!isSettlement && (
                        <Text className="text-slate-600 text-xs">{item.data.category}</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View className="mt-20 items-center">
                <View className="bg-slate-900/50 p-6 rounded-full mb-4">
                  <Ionicons name="search" size={32} color="#334155" />
                </View>
                <Text className="text-slate-400 font-bold">{search ? "No results found" : "No activity yet"}</Text>
                <Text className="text-slate-600 text-sm mt-1">{search ? "Try a different search term" : "Start adding expenses to see them here"}</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
