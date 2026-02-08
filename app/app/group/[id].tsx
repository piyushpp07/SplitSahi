import { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiDelete } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import * as Clipboard from 'expo-clipboard';

interface Group {
  id: string;
  name: string;
  description?: string;
  createdById: string;
  members: Array<{ userId: string; role: string; user: { id: string; name: string; email: string; avatarUrl?: string } }>;
}

interface Expense {
  id: string;
  title: string;
  totalAmount: number;
  category: string;
  createdAt: string;
  creator: { id: string; name: string };
}

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [showMembers, setShowMembers] = useState(false);
  const [showExpenses, setShowExpenses] = useState(true);

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ["group", id] });
      queryClient.invalidateQueries({ queryKey: ["expenses", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", id] });
    }, [id])
  );

  const { data: group, isLoading } = useQuery({
    queryKey: ["group", id],
    queryFn: () => apiGet<Group>(`/groups/${id}`),
  });

  const { data: expenses } = useQuery({
    queryKey: ["expenses", id],
    queryFn: () => apiGet<Expense[]>(`/expenses?groupId=${id}`),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiDelete(`/groups/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      router.back();
    },
    onError: (e) => Alert.alert("Error", e.message),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (expenseId: string) => apiDelete(`/expenses/${expenseId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e) => Alert.alert("Error", e.message),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => apiDelete(`/groups/${id}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", id] });
    },
    onError: (e) => Alert.alert("Error", e.message),
  });

  const isAdmin = group?.members.find(m => m.userId === currentUserId)?.role === "ADMIN";

  function handleDelete() {
    Alert.alert("Delete Group", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate() }
    ]);
  }

  function handleDeleteExpense(expenseId: string, title: string) {
    Alert.alert("Delete Expense", `Remove "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteExpenseMutation.mutate(expenseId) }
    ]);
  }

  async function handleInvite() {
    await Clipboard.setStringAsync(`Join my group "${group?.name}" on SplitSahiSe! Code: ${group?.id}`);
    Alert.alert("Copied!", "Group invite code copied to clipboard.");
  }

  if (isLoading) return <View className="flex-1 bg-[#020617] items-center justify-center"><ActivityIndicator color="#38bdf8" /></View>;
  if (!group) return <View className="flex-1 bg-[#020617] items-center justify-center"><Text className="text-white">Group not found</Text></View>;

  return (
    <SafeAreaView className="flex-1 bg-[#020617]" edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6 mt-2">
            <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 bg-slate-800 rounded-xl items-center justify-center">
              <Ionicons name="arrow-back" size={20} color="#94a3b8" />
            </TouchableOpacity>
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={handleInvite} className="h-10 w-10 bg-slate-800 rounded-xl items-center justify-center">
                <Ionicons name="share-outline" size={20} color="#38bdf8" />
              </TouchableOpacity>
              {isAdmin && (
                <TouchableOpacity onPress={handleDelete} className="h-10 w-10 bg-red-500/10 rounded-xl items-center justify-center">
                  <Ionicons name="trash-outline" size={20} color="#f87171" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View className="items-center mb-8">
            <View className="h-20 w-20 rounded-2xl bg-slate-800 items-center justify-center mb-4">
              <Ionicons name="people" size={32} color="#818cf8" />
            </View>
            <Text className="text-2xl font-bold text-white text-center mb-1">{group.name}</Text>
            <Text className="text-slate-500 text-sm text-center px-10">
              {group.description || "No description"}
            </Text>
          </View>

          {/* Quick Stats */}
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1 bg-slate-900/50 rounded-xl p-4 border border-slate-800">
              <Text className="text-slate-500 text-xs font-bold mb-1">Members</Text>
              <Text className="text-white font-bold text-xl">{group.members.length}</Text>
            </View>
            <View className="flex-1 bg-slate-900/50 rounded-xl p-4 border border-slate-800">
              <Text className="text-slate-500 text-xs font-bold mb-1">Expenses</Text>
              <Text className="text-white font-bold text-xl">{expenses?.length || 0}</Text>
            </View>
          </View>

          {/* Members Section */}
          <TouchableOpacity 
            className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 flex-row items-center mb-3"
            onPress={() => setShowMembers(!showMembers)}
          >
            <Ionicons name="people" size={18} color="#94a3b8" />
            <Text className="text-white font-bold text-sm flex-1 ml-3">Members</Text>
            <Ionicons name={showMembers ? "chevron-up" : "chevron-down"} size={16} color="#475569" />
          </TouchableOpacity>

          {showMembers && (
            <View className="bg-slate-900/20 rounded-xl p-2 mb-4 gap-1">
              {group.members.map((m) => (
                <View key={m.userId} className="p-3 flex-row items-center border-b border-slate-800 last:border-0">
                  <View className="h-8 w-8 rounded-lg bg-slate-800 items-center justify-center mr-3">
                    <Text className="text-xs text-white font-bold">{m.user.name[0]}</Text>
                  </View>
                  <Text className="text-white  flex-1 text-sm">{m.user.name}</Text>
                  <Text className={`text-xs font-bold mr-3 ${m.role === 'ADMIN' ? 'text-primary' : 'text-slate-500'}`}>{m.role === 'ADMIN' ? 'Admin' : 'Member'}</Text>
                  {isAdmin && m.userId !== currentUserId && (
                    <TouchableOpacity onPress={() => removeMemberMutation.mutate(m.userId)}>
                      <Ionicons name="close-circle" size={18} color="#f87171" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Expenses Section */}
          <TouchableOpacity 
            className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 flex-row items-center mb-3"
            onPress={() => setShowExpenses(!showExpenses)}
          >
            <Ionicons name="receipt" size={18} color="#94a3b8" />
            <Text className="text-white font-bold text-sm flex-1 ml-3">Expenses</Text>
            <Ionicons name={showExpenses ? "chevron-up" : "chevron-down"} size={16} color="#475569" />
          </TouchableOpacity>

          {showExpenses && (
            <View className="bg-slate-900/20 rounded-xl p-2 mb-4">
              {expenses && expenses.length > 0 ? (
                <View className="gap-2">
                  {expenses.map((exp) => (
                    <TouchableOpacity 
                      key={exp.id} 
                      className="p-3 flex-row items-center bg-slate-900/40 rounded-lg border border-slate-800"
                      onPress={() => router.push(`/expense/${exp.id}`)}
                    >
                      <View className="flex-1">
                        <Text className="text-white font-bold text-sm" numberOfLines={1}>{exp.title}</Text>
                        <Text className="text-slate-500 text-xs mt-0.5">
                          {exp.creator?.name} • {exp.category}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-white font-bold text-sm">₹{Number(exp.totalAmount).toFixed(0)}</Text>
                        {(exp.creator?.id === currentUserId || isAdmin) && (
                          <TouchableOpacity 
                            onPress={() => handleDeleteExpense(exp.id, exp.title)}
                            className="mt-1 px-2 py-0.5"
                            >
                            <Text className="text-red-400 text-[10px] ">Delete</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View className="p-6 items-center">
                  <Text className="text-slate-500 text-sm">No expenses yet</Text>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity 
              className="flex-1 bg-primary rounded-xl h-12 items-center justify-center"
              onPress={() => router.push({ pathname: "/new/expense", params: { groupId: group.id } })}
            >
              <Text className="text-[#020617] font-bold text-sm">Add Expense</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-1 bg-slate-800 rounded-xl h-12 items-center justify-center border border-slate-700"
              onPress={() => router.push({ pathname: "/new/settlement", params: { groupId: group.id } })}
            >
              <Text className="text-white font-bold text-sm">Settle Up</Text>
            </TouchableOpacity>
          </View>

          {/* Balance Section */}
          <GroupBalances groupId={group.id} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function GroupBalances({ groupId }: { groupId: string }) {
  const { data } = useQuery({
    queryKey: ["dashboard", groupId],
    queryFn: () => apiGet<any>(`/dashboard?groupId=${groupId}`),
  });

  const transactions = data?.simplifiedTransactions || [];
  const youOwe = data?.youOwe || 0;
  const youAreOwed = data?.youAreOwed || 0;

  return (
    <View className="mt-8">
      {/* Balance Summary */}
      <View className="flex-row gap-3 mb-6">
        <View className="flex-1 bg-red-500/10 rounded-xl p-4 border border-red-500/20">
          <Text className="text-red-400 text-xs font-bold mb-1">You Owe</Text>
          <Text className="text-red-400 font-bold text-xl">₹{youOwe.toFixed(0)}</Text>
        </View>
        <View className="flex-1 bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
          <Text className="text-emerald-400 text-xs font-bold mb-1">You Get</Text>
          <Text className="text-emerald-400 font-bold text-xl">₹{youAreOwed.toFixed(0)}</Text>
        </View>
      </View>

      {transactions.length > 0 && (
        <>
          <Text className="text-slate-500 font-bold text-xs mb-3">Who owes who</Text>
          <View className="gap-2">
            {transactions.map((t: any, i: number) => (
              <View key={i} className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 flex-row items-center">
                <View className="flex-1">
                  <View className="flex-row items-center flex-wrap">
                    <Text className="text-white  text-sm">{t.fromUser?.name}</Text>
                    <Text className="text-slate-500 text-xs mx-2">owes</Text>
                    <Text className="text-white  text-sm">{t.toUser?.name}</Text>
                  </View>
                  <Text className="text-emerald-400 font-bold text-sm mt-1">₹{t.amount.toFixed(2)}</Text>
                </View>
                <TouchableOpacity 
                  className="bg-slate-800 px-4 py-2 rounded-lg"
                  onPress={() => router.push({
                    pathname: "/new/settlement",
                    params: { toUserId: t.toUserId, amount: t.amount.toString(), groupId }
                  })}
                >
                  <Text className="text-white font-bold text-xs">Settle</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}
