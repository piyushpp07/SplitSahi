import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiGet, apiPost } from "@/lib/api";
import { router, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { notifySettlement } from "@/lib/notifications";

interface Friend {
  id: string;
  name: string;
}

export default function AddSettlementScreen() {
  const params = useLocalSearchParams<{ toUserId?: string; amount?: string; groupId?: string }>();
  const [toUserId, setToUserId] = useState<string | null>(params.toUserId || null);
  const [amount, setAmount] = useState(params.amount || "");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "OTHER">("CASH");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: friends, isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: () => apiGet<Friend[]>("/friendships"),
  });

  async function handleSettle() {
    if (!toUserId || !amount) {
      Alert.alert("Missing Info", "Please select a friend and enter amount");
      return;
    }

    const currentUser = useAuthStore.getState().user;
    const recipient = friends?.find(f => f.id === toUserId);

    setLoading(true);
    try {
      await apiPost("/settlements", {
        toUserId,
        amount: parseFloat(amount),
        paymentMethod,
        notes: notes || undefined,
        groupId: params.groupId || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
      
      notifySettlement(currentUser?.name || "You", recipient?.name || "Friend", parseFloat(amount));
      
      Alert.alert("Success", "Payment recorded successfully!");
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to record payment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#020617]" edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 px-5"
      >
        <View className="flex-row items-center mb-6 mt-4">
          <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 bg-slate-800 rounded-xl items-center justify-center mr-4">
            <Ionicons name="arrow-back" size={20} color="#94a3b8" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Record Payment</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Recipient Selection */}
          <View className="mb-6">
            <Text className="text-slate-500 text-xs font-bold mb-3">Who did you pay?</Text>
            {loadingFriends ? (
              <ActivityIndicator color="#38bdf8" />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                {friends?.map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => setToUserId(f.id)}
                    className={`px-5 py-3 rounded-xl mr-3 border items-center ${toUserId === f.id ? 'bg-primary border-primary' : 'bg-slate-900 border-slate-800'}`}
                  >
                    <View className="h-8 w-8 rounded-full bg-slate-800 items-center justify-center mb-2">
                       <Text className="text-xs text-white font-bold">{f.name[0]}</Text>
                    </View>
                    <Text className={`font-bold text-xs ${toUserId === f.id ? 'text-[#020617]' : 'text-slate-400'}`}>
                      {f.name.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            {!loadingFriends && !friends?.length && (
              <Text className="text-slate-500 text-sm italic">Add friends first to record payments with them.</Text>
            )}
          </View>

          {/* Amount */}
          <View className="mb-6">
            <Text className="text-slate-500 text-xs font-bold mb-2">Amount Paid</Text>
            <View className="bg-slate-900 rounded-xl px-4 flex-row items-center border border-slate-800">
              <Text className="text-primary font-bold text-2xl">₹</Text>
              <TextInput
                className="flex-1 px-2 py-4 text-white text-3xl font-bold"
                placeholder="0.00"
                placeholderTextColor="#1e293b"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Method */}
          <View className="mb-6">
            <Text className="text-slate-500 text-xs font-bold mb-3">Payment Method</Text>
            <View className="flex-row gap-3">
              {[
                { key: "CASH", label: "Cash", icon: "cash" },
                { key: "UPI", label: "UPI", icon: "flash" },
                { key: "OTHER", label: "Other", icon: "card" }
              ].map((m) => (
                <TouchableOpacity
                  key={m.key}
                  onPress={() => setPaymentMethod(m.key as any)}
                  className={`flex-1 py-3.5 rounded-xl border flex-row items-center justify-center gap-2 ${paymentMethod === m.key ? 'bg-indigo-500 border-indigo-500' : 'bg-slate-900 border-slate-800'}`}
                >
                  <Ionicons name={m.icon as any} size={16} color={paymentMethod === m.key ? "#fff" : "#64748b"} />
                  <Text className={`font-bold text-xs ${paymentMethod === m.key ? 'text-white' : 'text-slate-500'}`}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View className="mb-8">
            <Text className="text-slate-500 text-xs font-bold mb-2">Note (Optional)</Text>
            <TextInput
              className="bg-slate-900 rounded-xl px-4 py-3 text-white  border border-slate-800"
              placeholder="Add details..."
              placeholderTextColor="#475569"
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          <TouchableOpacity
            className={`h-14 rounded-xl items-center justify-center mb-10 shadow-xl ${loading ? 'bg-slate-800' : 'bg-indigo-500'}`}
            onPress={handleSettle}
            disabled={loading}
          >
            <Text className="text-white font-bold text-base">
              {loading ? "Recording..." : "Record Payment"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
