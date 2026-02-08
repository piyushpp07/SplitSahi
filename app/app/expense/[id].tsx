import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiGet, apiPatch, apiDelete } from "@/lib/api";
import { router, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAvoidingView, Platform } from "react-native";

const CATEGORIES = ["Food", "Transport", "Shopping", "Entertainment", "Bills", "Other"];

interface Expense {
  id: string;
  title: string;
  description?: string;
  totalAmount: number;
  category: string;
  currency: string;
  splitType: string;
  createdById: string;
  groupId?: string;
  group?: { id: string; name: string };
  creator: { id: string; name: string };
  payers: Array<{ userId: string; amountPaid: number; user: { id: string; name: string } }>;
  splits: Array<{ userId: string; amountOwed: number; percentage?: number; user: { id: string; name: string } }>;
  participants: Array<{ userId: string; user: { id: string; name: string } }>;
}

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Other");
  const [saving, setSaving] = useState(false);

  const { data: expense, isLoading } = useQuery({
    queryKey: ["expense", id],
    queryFn: () => apiGet<Expense>(`/expenses/${id}`),
    enabled: !!id,
  });

  useEffect(() => {
    if (expense) {
      setTitle(expense.title);
      setCategory(expense.category || "Other");
    }
  }, [expense]);

  const deleteMutation = useMutation({
    mutationFn: () => apiDelete(`/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      Alert.alert("Success", "Expense deleted");
      router.back();
    },
    onError: (e) => Alert.alert("Error", e.message),
  });

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert("Error", "Title is required");
      return;
    }
    setSaving(true);
    try {
      await apiPatch(`/expenses/${id}`, {
        title: title.trim(),
        category,
      });
      queryClient.invalidateQueries({ queryKey: ["expense", id] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
      setIsEditing(false);
      Alert.alert("Success", "Expense updated");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert("Delete Expense", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate() }
    ]);
  }

  const canEdit = expense?.createdById === currentUserId;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#020617] items-center justify-center" edges={['top']}>
        <ActivityIndicator color="#38bdf8" size="large" />
      </SafeAreaView>
    );
  }

  if (!expense) {
    return (
      <SafeAreaView className="flex-1 bg-[#020617] items-center justify-center" edges={['top']}>
        <Text className="text-white">Expense not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#020617]" edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 px-6"
      >
        <View className="flex-row items-center justify-between mb-6 mt-4">
          <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 bg-slate-900 rounded-xl items-center justify-center border border-slate-800">
            <Ionicons name="arrow-back" size={20} color="#94a3b8" />
          </TouchableOpacity>
          <View className="flex-row gap-2">
            {canEdit && !isEditing && (
              <TouchableOpacity 
                onPress={() => setIsEditing(true)} 
                className="h-10 w-10 bg-slate-900 rounded-xl items-center justify-center border border-slate-800"
              >
                <Ionicons name="pencil" size={18} color="#38bdf8" />
              </TouchableOpacity>
            )}
            {canEdit && (
              <TouchableOpacity 
                onPress={handleDelete} 
                className="h-10 w-10 bg-red-500/10 rounded-xl items-center justify-center border border-red-500/20"
              >
                <Ionicons name="trash" size={18} color="#f87171" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Title */}
          <View className="mb-6">
            <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-[2px] mb-2">Expense Title</Text>
            {isEditing ? (
              <View className="bg-slate-900 rounded-[20px] border border-slate-800 p-1">
                <TextInput
                  className="px-5 py-4 text-white text-xl font-bold"
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Title"
                  placeholderTextColor="#475569"
                />
              </View>
            ) : (
              <Text className="text-white text-3xl font-bold tracking-tighter italic">{expense.title}</Text>
            )}
          </View>

          {/* Amount */}
          <View className="bg-slate-900/40 rounded-[24px] p-6 border border-white/5 mb-6">
            <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-[2px] mb-2">Total Amount</Text>
            <Text className="text-emerald-400 text-4xl font-bold">₹{Number(expense.totalAmount).toFixed(2)}</Text>
          </View>

          {/* Category */}
          <View className="mb-6">
            <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-[2px] mb-3">Category</Text>
            {isEditing ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    className={`px-5 py-2.5 rounded-2xl mr-2 border ${category === cat ? 'bg-primary border-primary' : 'bg-slate-900 border-white/5'}`}
                  >
                    <Text className={`font-bold uppercase tracking-widest text-[9px] ${category === cat ? 'text-[#020617]' : 'text-slate-500'}`}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View className="bg-slate-800 self-start px-4 py-2 rounded-xl">
                <Text className="text-white font-bold text-sm uppercase tracking-widest">{expense.category}</Text>
              </View>
            )}
          </View>

          {/* Split Type */}
          <View className="mb-6">
            <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-[2px] mb-2">Split Type</Text>
            <Text className="text-white font-bold">{expense.splitType}</Text>
          </View>

          {/* Group */}
          {expense.group && (
            <View className="mb-6">
              <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-[2px] mb-2">Group</Text>
              <TouchableOpacity 
                className="bg-slate-900/40 rounded-[16px] p-4 flex-row items-center border border-white/5"
                onPress={() => router.push(`/group/${expense.group?.id}`)}
              >
                <Ionicons name="people" size={18} color="#818cf8" />
                <Text className="text-white font-bold ml-3">{expense.group.name}</Text>
                <Ionicons name="chevron-forward" size={16} color="#475569" className="ml-auto" />
              </TouchableOpacity>
            </View>
          )}

          {/* Paid By */}
          <View className="mb-6">
            <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-[2px] mb-3">Paid By</Text>
            <View className="gap-2">
              {expense.payers.map((p) => (
                <View key={p.userId} className="bg-slate-900/40 rounded-[16px] p-4 flex-row items-center border border-white/5">
                  <View className="h-8 w-8 rounded-full bg-slate-800 items-center justify-center mr-3">
                    <Text className="text-white font-bold text-xs">{p.user.name.charAt(0)}</Text>
                  </View>
                  <Text className="text-white font-bold flex-1">{p.user.name}</Text>
                  <Text className="text-emerald-400 font-bold">₹{Number(p.amountPaid).toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Splits */}
          <View className="mb-10">
            <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-[2px] mb-3">Split Between</Text>
            <View className="gap-2">
              {expense.splits.map((s) => (
                <View key={s.userId} className="bg-slate-900/40 rounded-[16px] p-4 flex-row items-center border border-white/5">
                  <View className="h-8 w-8 rounded-full bg-slate-800 items-center justify-center mr-3">
                    <Text className="text-white font-bold text-xs">{s.user.name.charAt(0)}</Text>
                  </View>
                  <Text className="text-white font-bold flex-1">{s.user.name}</Text>
                  {s.percentage && (
                    <Text className="text-slate-400 font-bold text-sm mr-2">{Number(s.percentage).toFixed(0)}%</Text>
                  )}
                  <Text className="text-red-400 font-bold">₹{Number(s.amountOwed).toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Save Button */}
          {isEditing && (
            <View className="gap-3 mb-10">
              <TouchableOpacity
                className={`h-14 rounded-[20px] items-center justify-center ${saving ? 'bg-slate-800' : 'bg-primary'}`}
                onPress={handleSave}
                disabled={saving}
              >
                <Text className="text-[#020617] font-bold uppercase tracking-widest text-sm">
                  {saving ? "SAVING..." : "SAVE CHANGES"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="h-14 rounded-[20px] items-center justify-center bg-slate-900 border border-slate-800"
                onPress={() => {
                  setTitle(expense.title);
                  setCategory(expense.category || "Other");
                  setIsEditing(false);
                }}
              >
                <Text className="text-slate-400 font-bold uppercase tracking-widest text-sm">CANCEL</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
