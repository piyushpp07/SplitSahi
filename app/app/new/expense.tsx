import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiGet, apiPost } from "@/lib/api";
import { router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native";
import { notifyExpenseAdded } from "@/lib/notifications";
import DateTimePicker from "@react-native-community/datetimepicker";

const CATEGORIES = ["Food", "Transport", "Shopping", "Entertainment", "Bills", "Other"];
const SPLIT_TYPES = [
  { key: "EQUAL", label: "Equal", icon: "git-compare" },
  { key: "PERCENTAGE", label: "Percent", icon: "pie-chart" },
  { key: "EXACT", label: "Exact", icon: "cash" },
];

interface Group {
  id: string;
  name: string;
  members: Array<{ user: { id: string; name: string } }>;
}

interface Friend {
  id: string;
  name: string;
}

export default function AddExpenseScreen() {
  const params = useLocalSearchParams<{ groupId?: string; friendId?: string }>();
  const currentUser = useAuthStore((s) => s.user);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("Other");
  const [groupId, setGroupId] = useState<string | null>(params.groupId || null);
  const [friendId, setFriendId] = useState<string | null>(params.friendId || null);
  const [loading, setLoading] = useState(false);
  const [splitType, setSplitType] = useState<"EQUAL" | "PERCENTAGE" | "EXACT">("EQUAL");
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { data: groups, isLoading: loadingGroups } = useQuery({
    queryKey: ["groups"],
    queryFn: () => apiGet<Group[]>("/groups"),
  });

  const { data: friends, isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: () => apiGet<Friend[]>("/friendships"),
  });

  // Get participants based on selection
  const getParticipants = (): Array<{ id: string; name: string }> => {
    if (!currentUser) return [];
    if (groupId) {
      const g = groups?.find(x => x.id === groupId);
      return g?.members.map(m => m.user) || [];
    } else if (friendId) {
      const f = friends?.find(x => x.id === friendId);
      return [{ id: currentUser.id, name: currentUser.name }, ...(f ? [f] : [])];
    }
    return [{ id: currentUser.id, name: currentUser.name }];
  };

  const participants = getParticipants();

  // Smart categorization
  useEffect(() => {
    if (title.length > 3) {
      const timer = setTimeout(async () => {
        try {
          const res = await apiPost<{ category: string }>("/expenses/suggest-category", {
            title: title.trim(),
          });
          if (res.category && CATEGORIES.includes(res.category)) {
            setCategory(res.category);
          }
        } catch (e) {
          // ignore error
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [title]);

  // Reset custom splits when participants change
  useEffect(() => {
    const newSplits: Record<string, string> = {};
    participants.forEach(p => {
      if (splitType === "PERCENTAGE") {
        newSplits[p.id] = (100 / participants.length).toFixed(0);
      } else if (splitType === "EXACT") {
        const total = parseFloat(amount) || 0;
        newSplits[p.id] = (total / participants.length).toFixed(2);
      }
    });
    setCustomSplits(newSplits);
  }, [groupId, friendId, splitType, participants.length]);

  function formatDate(date: Date): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  async function handleCreate() {
    if (!title.trim() || !amount || (!groupId && !friendId)) {
      Alert.alert("Missing Info", "Please fill in all required fields");
      return;
    }

    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    const pIds = participants.map(p => p.id);
    const totalAmount = parseFloat(amount);

    let splits: Array<{ userId: string; amountOwed?: number; percentage?: number }> | undefined;

    if (splitType === "PERCENTAGE") {
      const totalPerc = Object.values(customSplits).reduce((s, v) => s + (parseFloat(v) || 0), 0);
      if (Math.abs(totalPerc - 100) > 0.5) {
        Alert.alert("Invalid Split", "Percentages must add up to 100%");
        return;
      }
      splits = pIds.map(uid => ({
        userId: uid,
        percentage: parseFloat(customSplits[uid] || "0"),
      }));
    } else if (splitType === "EXACT") {
      const totalSplit = Object.values(customSplits).reduce((s, v) => s + (parseFloat(v) || 0), 0);
      if (Math.abs(totalSplit - totalAmount) > 0.5) {
        Alert.alert("Invalid Split", `Amounts must add up to ₹${totalAmount.toFixed(2)}`);
        return;
      }
      splits = pIds.map(uid => ({
        userId: uid,
        amountOwed: parseFloat(customSplits[uid] || "0"),
      }));
    }
    
    setLoading(true);
    try {
      const groupName = groupId ? groups?.find(g => g.id === groupId)?.name : undefined;
      await apiPost("/expenses", {
        title: title.trim(),
        description: notes.trim() || undefined,
        totalAmount,
        category,
        groupId: groupId || undefined,
        participantIds: pIds,
        payers: [{ userId, amountPaid: totalAmount }],
        splitType,
        splits: splitType !== "EQUAL" ? splits : undefined,
        date: expenseDate.toISOString(),
      });
      
      notifyExpenseAdded(currentUser?.name || "You", title.trim(), totalAmount, groupName);
      
      Alert.alert("Done!", "Expense added successfully");
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to add expense");
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
        {/* Header */}
        <View className="flex-row items-center mb-6 mt-4">
          <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 bg-slate-800 rounded-xl items-center justify-center mr-4">
            <Ionicons name="arrow-back" size={20} color="#94a3b8" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Add Expense</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Title & Amount */}
          <View className="mb-5">
            <Text className="text-slate-500 text-xs font-bold mb-2">What was it for?</Text>
            <TextInput
              className="bg-slate-900 rounded-xl px-4 py-4 text-white text-lg font-bold border border-slate-800"
              placeholder="e.g., Dinner, Uber, Groceries"
              placeholderTextColor="#475569"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View className="mb-5">
            <Text className="text-slate-500 text-xs font-bold mb-2">How much?</Text>
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

          {/* Date Picker */}
          <View className="mb-5">
            <Text className="text-slate-500 text-xs font-bold mb-2">When?</Text>
            <TouchableOpacity 
              onPress={() => setShowDatePicker(true)}
              className="bg-slate-900 rounded-xl px-4 py-4 flex-row items-center border border-slate-800"
            >
              <Ionicons name="calendar" size={20} color="#38bdf8" />
              <Text className="text-white font-bold ml-3">{formatDate(expenseDate)}</Text>
              <View className="flex-1" />
              <Ionicons name="chevron-down" size={18} color="#475569" />
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={expenseDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event: any, date?: Date) => {
                setShowDatePicker(Platform.OS === "ios");
                if (date) setExpenseDate(date);
              }}
              maximumDate={new Date()}
              themeVariant="dark"
            />
          )}

          {/* Notes */}
          <View className="mb-5">
            <Text className="text-slate-500 text-xs font-bold mb-2">Notes (optional)</Text>
            <TextInput
              className="bg-slate-900 rounded-xl px-4 py-4 text-white  border border-slate-800"
              placeholder="Add any details..."
              placeholderTextColor="#475569"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Category */}
          <View className="mb-5">
            <Text className="text-slate-500 text-xs font-bold mb-2">Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  className={`px-4 py-2.5 rounded-xl mr-2 border ${category === cat ? 'bg-primary border-primary' : 'bg-slate-900 border-slate-800'}`}
                >
                  <Text className={`font-bold text-sm ${category === cat ? 'text-[#020617]' : 'text-slate-400'}`}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Split Type */}
          <View className="mb-5">
            <Text className="text-slate-500 text-xs font-bold mb-2">How to split?</Text>
            <View className="flex-row gap-2">
              {SPLIT_TYPES.map((st) => (
                <TouchableOpacity
                  key={st.key}
                  onPress={() => setSplitType(st.key as any)}
                  className={`flex-1 py-3 rounded-xl border flex-row items-center justify-center gap-2 ${splitType === st.key ? 'bg-indigo-500 border-indigo-500' : 'bg-slate-900 border-slate-800'}`}
                >
                  <Ionicons name={st.icon as any} size={14} color={splitType === st.key ? "#fff" : "#64748b"} />
                  <Text className={`font-bold text-sm ${splitType === st.key ? 'text-white' : 'text-slate-500'}`}>
                    {st.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Select Group or Friend */}
          <View className="mb-5">
            <Text className="text-slate-500 text-xs font-bold mb-3">Split with</Text>
            
            {groups && groups.length > 0 && (
              <>
                <Text className="text-white font-bold text-xs mb-2">Groups</Text>
                <View className="gap-2 mb-4">
                  {groups.map((g) => (
                    <TouchableOpacity
                      key={g.id}
                      onPress={() => { setGroupId(g.id); setFriendId(null); }}
                      className={`bg-slate-900 rounded-xl p-3 flex-row items-center border ${groupId === g.id ? 'border-primary' : 'border-slate-800'}`}
                    >
                      <View className="h-8 w-8 rounded-lg bg-slate-800 items-center justify-center mr-3">
                        <Ionicons name="people" size={16} color="#94a3b8" />
                      </View>
                      <Text className="text-white font-bold flex-1">{g.name}</Text>
                      {groupId === g.id && <Ionicons name="checkmark-circle" size={20} color="#38bdf8" />}
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {loadingGroups && <ActivityIndicator color="#38bdf8" className="mb-4" />}

            {friends && friends.length > 0 && (
              <>
                <Text className="text-white font-bold text-xs mb-2">Friends</Text>
                <View className="gap-2">
                  {friends.map((f) => (
                    <TouchableOpacity
                      key={f.id}
                      onPress={() => { setFriendId(f.id); setGroupId(null); }}
                      className={`bg-slate-900 rounded-xl p-3 flex-row items-center border ${friendId === f.id ? 'border-primary' : 'border-slate-800'}`}
                    >
                      <View className="h-8 w-8 rounded-lg bg-slate-800 items-center justify-center mr-3">
                        <Ionicons name="person" size={16} color="#94a3b8" />
                      </View>
                      <Text className="text-white font-bold flex-1">{f.name}</Text>
                      {friendId === f.id && <Ionicons name="checkmark-circle" size={20} color="#38bdf8" />}
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {loadingFriends && <ActivityIndicator color="#38bdf8" />}

            {!loadingGroups && !loadingFriends && (!groups?.length && !friends?.length) && (
              <View className="bg-slate-900/50 rounded-xl p-4 items-center">
                <Text className="text-slate-500 text-sm">No groups or friends yet</Text>
                <TouchableOpacity 
                  onPress={() => router.push("/new/friend")}
                  className="mt-2"
                >
                  <Text className="text-primary font-bold">Add a friend</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Custom Splits */}
          {splitType !== "EQUAL" && participants.length > 0 && (
            <View className="mb-5 bg-slate-900/50 rounded-xl p-4 border border-slate-800">
              <Text className="text-slate-500 text-xs font-bold mb-3">
                {splitType === "PERCENTAGE" ? "Set percentages" : "Set amounts"}
              </Text>
              {participants.map((p) => (
                <View key={p.id} className="flex-row items-center mb-3">
                  <View className="h-8 w-8 rounded-full bg-slate-800 items-center justify-center mr-3">
                    <Text className="text-white font-bold text-xs">{p.name.charAt(0)}</Text>
                  </View>
                  <Text className="text-white  flex-1" numberOfLines={1}>{p.name}</Text>
                  <View className="flex-row items-center bg-slate-800 rounded-lg px-3 py-2">
                    {splitType === "EXACT" && <Text className="text-slate-500  mr-1">₹</Text>}
                    <TextInput
                      className="text-white font-bold text-base w-16 text-center"
                      value={customSplits[p.id] || ""}
                      onChangeText={(v) => setCustomSplits(prev => ({ ...prev, [p.id]: v }))}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#475569"
                    />
                    {splitType === "PERCENTAGE" && <Text className="text-slate-500  ml-1">%</Text>}
                  </View>
                </View>
              ))}
              <View className="flex-row justify-end mt-2">
                <Text className="text-slate-400 text-xs ">
                  Total: {splitType === "PERCENTAGE" 
                    ? `${Object.values(customSplits).reduce((s, v) => s + (parseFloat(v) || 0), 0).toFixed(0)}%`
                    : `₹${Object.values(customSplits).reduce((s, v) => s + (parseFloat(v) || 0), 0).toFixed(2)}`
                  }
                </Text>
              </View>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            className={`h-14 rounded-xl items-center justify-center mb-10 ${loading ? 'bg-slate-800' : 'bg-primary'}`}
            onPress={handleCreate}
            disabled={loading}
          >
            <Text className="text-[#020617] font-bold text-base">
              {loading ? "Adding..." : "Add Expense"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
