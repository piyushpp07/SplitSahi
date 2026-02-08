import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/store/authStore";

interface FriendBalanceData {
  friend: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    upiId?: string;
  };
  balance: number; // Positive = friend owes me
  transactions: Array<{
    type: "expense" | "settlement";
    id: string;
    createdAt: string;
    title?: string;
    amount: number;
    category?: string;
    myShare?: number;
    friendShare?: number;
    group?: { id: string; name: string };
    fromUser?: { id: string; name: string };
    toUser?: { id: string; name: string };
    isFromMe?: boolean;
  }>;
}

export default function FriendDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.user?.id);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["friend-balance", id],
    queryFn: () => apiGet<FriendBalanceData>(`/friend-balance/${id}`),
    enabled: !!id,
  });

  async function openUPI() {
    if (!data?.friend.upiId || !data.balance || data.balance >= 0) return;
    
    const amount = Math.abs(data.balance);
    const upiUrl = `upi://pay?pa=${encodeURIComponent(data.friend.upiId)}&pn=${encodeURIComponent(data.friend.name)}&am=${amount}&cu=INR&tn=SplitSahiSe%20Settlement`;
    
    try {
      await Linking.openURL(upiUrl);
    } catch {
      Alert.alert("Error", "Could not open UPI app");
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#020617] items-center justify-center" edges={['top']}>
        <ActivityIndicator color="#38bdf8" size="large" />
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView className="flex-1 bg-[#020617] items-center justify-center" edges={['top']}>
        <Text className="text-white">Friend not found</Text>
      </SafeAreaView>
    );
  }

  const { friend, balance, transactions } = data;
  const iOwe = balance < 0;
  const absBalance = Math.abs(balance);

  return (
    <SafeAreaView className="flex-1 bg-[#020617]" edges={['top']}>
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center mb-6 mt-4">
          <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 bg-slate-900 rounded-xl items-center justify-center border border-slate-800 mr-4">
            <Ionicons name="arrow-back" size={20} color="#94a3b8" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-[2px]">Friend Details</Text>
            <Text className="text-2xl font-bold text-white tracking-tighter italic">{friend.name}</Text>
          </View>
        </View>

        {/* Friend Card */}
        <View className="bg-slate-900/40 rounded-[28px] p-6 border border-white/5 mb-6">
          <View className="flex-row items-center mb-4">
            <View className="h-16 w-16 rounded-full bg-slate-800 items-center justify-center mr-4 border border-white/10">
              <Text className="text-2xl font-bold text-white">{friend.name.charAt(0)}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-lg">{friend.name}</Text>
              <Text className="text-slate-500 text-xs font-bold">{friend.email}</Text>
              {friend.upiId && (
                <View className="flex-row items-center mt-1">
                  <Ionicons name="card" size={12} color="#38bdf8" />
                  <Text className="text-primary text-xs font-bold ml-1">{friend.upiId}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Balance */}
          <View className={`rounded-2xl p-4 ${iOwe ? 'bg-red-500/10 border border-red-500/20' : absBalance > 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-slate-800/50 border border-slate-700'}`}>
            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">
              {absBalance === 0 ? "All Settled" : iOwe ? "You Owe" : "Owes You"}
            </Text>
            <Text className={`text-3xl font-bold ${iOwe ? 'text-red-400' : absBalance > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
              ₹{absBalance.toFixed(2)}
            </Text>
          </View>

          {/* Actions */}
          {absBalance > 0 && (
            <View className="flex-row gap-3 mt-4">
              {iOwe && friend.upiId && (
                <TouchableOpacity
                  className="flex-1 h-12 rounded-xl bg-primary flex-row items-center justify-center"
                  onPress={openUPI}
                >
                  <Ionicons name="flash" size={18} color="#020617" />
                  <Text className="text-[#020617] font-bold text-xs uppercase tracking-widest ml-2">Pay via UPI</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                className="flex-1 h-12 rounded-xl bg-slate-800 border border-slate-700 flex-row items-center justify-center"
                onPress={() => router.push({
                  pathname: "/new/settlement",
                  params: { toUserId: iOwe ? friend.id : userId, amount: absBalance.toString() }
                })}
              >
                <Ionicons name="receipt" size={18} color="#94a3b8" />
                <Text className="text-slate-400 font-bold text-xs uppercase tracking-widest ml-2">Record</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Transactions Section */}
        <View className="mb-4">
          <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-[2px] mb-4">Transaction History</Text>
          
          {transactions.length === 0 ? (
            <View className="bg-slate-900/30 rounded-[24px] p-8 border border-dashed border-slate-800 items-center">
              <Ionicons name="document-text-outline" size={32} color="#334155" />
              <Text className="text-slate-600 font-bold text-xs mt-3 uppercase tracking-widest">No transactions yet</Text>
            </View>
          ) : (
            <View className="gap-3">
              {transactions.map((t) => {
                const date = new Date(t.createdAt);
                const isExpense = t.type === "expense";
                
                return (
                  <TouchableOpacity
                    key={`${t.type}-${t.id}`}
                    className="bg-slate-900/40 rounded-[20px] p-4 border border-white/5"
                    onPress={() => isExpense ? router.push(`/expense/${t.id}`) : null}
                    activeOpacity={isExpense ? 0.7 : 1}
                  >
                    <View className="flex-row items-start">
                      <View className={`h-10 w-10 rounded-xl items-center justify-center mr-3 ${isExpense ? 'bg-emerald-500/20' : 'bg-indigo-500/20'}`}>
                        <Ionicons 
                          name={isExpense ? "cart" : "swap-horizontal"} 
                          size={18} 
                          color={isExpense ? "#10b981" : "#818cf8"} 
                        />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-white font-bold text-sm" numberOfLines={1}>
                            {isExpense ? t.title : (t.isFromMe ? `You paid ${friend.name}` : `${friend.name} paid you`)}
                          </Text>
                          <Text className={`font-bold text-sm ${isExpense ? 'text-emerald-400' : 'text-indigo-400'}`}>
                            ₹{t.amount.toFixed(0)}
                          </Text>
                        </View>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                            {date.toLocaleDateString()} • {isExpense ? t.category : 'Settlement'}
                          </Text>
                          {isExpense && t.myShare !== undefined && (
                            <Text className="text-slate-500 text-[10px] font-bold">
                              Your share: ₹{t.myShare.toFixed(0)}
                            </Text>
                          )}
                        </View>
                        {isExpense && t.group && (
                          <View className="flex-row items-center mt-1">
                            <Ionicons name="people" size={10} color="#475569" />
                            <Text className="text-slate-600 text-[9px] font-bold uppercase ml-1">{t.group.name}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Add Expense Button */}
        <TouchableOpacity
          className="h-14 rounded-[20px] bg-slate-900 border border-slate-800 items-center justify-center flex-row mt-4"
          onPress={() => router.push("/new/expense")}
        >
          <Ionicons name="add" size={20} color="#38bdf8" />
          <Text className="text-primary font-bold text-xs uppercase tracking-widest ml-2">Add Expense with {friend.name.split(' ')[0]}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
