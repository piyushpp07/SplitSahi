import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiDelete } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";

interface Expense {
  id: string;
  title: string;
  totalAmount: number;
  currency: string;
  category: string;
  createdAt: string;
  creator: { id: string; name: string };
}

const CATEGORY_ICONS: Record<string, any> = {
  food: "fast-food",
  shopping: "cart",
  travel: "airplane",
  bills: "receipt",
  entertainment: "tv",
  other: "ellipsis-horizontal",
};

export default function ExpensesScreen() {
  const queryClient = useQueryClient();
  const { data: expenses, isLoading, error } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => apiGet<Expense[]>("/expenses"),
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface-dark items-center justify-center">
        <Text className="text-slate-400">Loading expenses...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#020617]">
      <FlatList
        data={expenses ?? []}
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="mb-10 mt-6">
            <Text className="text-slate-500 text-xs font-bold uppercase tracking-[2px] mb-1">Audit Trail</Text>
            <Text className="text-4xl font-bold text-white tracking-tighter">Expenditure</Text>
          </View>
        }
        ListEmptyComponent={
          <View className="py-20 bg-slate-900/30 rounded-[40px] border border-dashed border-slate-800 items-center justify-center">
            <View className="bg-slate-800/40 p-6 rounded-full mb-4">
              <Ionicons name="card-outline" size={32} color="#475569" />
            </View>
            <Text className="text-slate-500 font-bold">No Records</Text>
            <Text className="text-slate-600 text-xs mt-1 ">Add an expense to track it here</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isCreator = item.creator.id === useAuthStore.getState().user?.id;
          
          async function handleDelete() {
            Alert.alert("Delete Expense", "Are you sure? This will remove the expense for everyone.", [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: async () => {
                try {
                  await apiDelete(`/expenses/${item.id}`);
                  queryClient.invalidateQueries({ queryKey: ["expenses"] });
                  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
                } catch (e) {
                  Alert.alert("Error", "Could not delete expense");
                }
              }}
            ]);
          }

          return (
            <View className="bg-slate-900/40 rounded-[32px] p-6 mb-5 border border-white/5 shadow-sm">
              <View className="flex-row items-center justify-between mb-5">
                <View className="flex-row items-center flex-1">
                  <View className="h-12 w-12 rounded-2xl bg-slate-800 items-center justify-center mr-4 border border-white/5">
                    <Ionicons 
                      name={(CATEGORY_ICONS[item.category?.toLowerCase()] || "cash-outline") as any} 
                      size={20} 
                      color="#94a3b8" 
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-lg tracking-tight" numberOfLines={1}>{item.title}</Text>
                    <View className="bg-slate-800/50 self-start px-2 py-0.5 rounded-lg mt-0.5">
                      <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{item.category}</Text>
                    </View>
                  </View>
                </View>
                <View className="items-end flex-row items-center">
                  <Text className="text-white font-bold text-xl tracking-tighter mr-3">
                    ₹{Number(item.totalAmount).toFixed(0)}
                    <Text className="text-slate-500 text-sm font-bold">.{Number(item.totalAmount).toFixed(2).split('.')[1]}</Text>
                  </Text>
                  {isCreator && (
                    <TouchableOpacity onPress={handleDelete}>
                      <Ionicons name="trash-outline" size={18} color="#f87171" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <View className="flex-row items-center justify-between pt-4 border-t border-white/5">
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={12} color="#475569" className="mr-2" />
                  <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                <View className="bg-indigo-500/10 px-2 py-1 rounded-lg">
                  <Text className="text-indigo-400 text-[9px] font-bold uppercase tracking-tighter">{item.creator.name}</Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}
