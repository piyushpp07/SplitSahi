import { useState, useEffect, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Platform, StyleSheet, KeyboardAvoidingView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiGet, apiPost } from "@/lib/api";
import { router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { notifyExpenseAdded } from "@/lib/notifications";
import DateTimePicker from "@react-native-community/datetimepicker";
import CurrencySelector from "@/components/CurrencySelector";
import { useTheme } from "@/contexts/ThemeContext";

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
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams<{ groupId?: string; friendId?: string }>();
  const currentUser = useAuthStore((s) => s.user);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("Other");
  const [groupId, setGroupId] = useState<string | null>(params.groupId || null);
  const [friendId, setFriendId] = useState<string | null>(params.friendId || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>(params.friendId ? [params.friendId] : []);
  const [loading, setLoading] = useState(false);
  const [splitType, setSplitType] = useState<"EQUAL" | "PERCENTAGE" | "EXACT">("EQUAL");
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [frequency, setFrequency] = useState<string | null>(null);
  const [currency, setCurrency] = useState("INR");
  const [payerId, setPayerId] = useState<string | null>(null);

  const { data: groups, isLoading: loadingGroups } = useQuery({
    queryKey: ["groups"],
    queryFn: () => apiGet<Group[]>("/groups"),
  });

  const { data: friends, isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: () => apiGet<Friend[]>("/friendships"),
  });

  // Filtered friends based on search
  const filteredFriends = useMemo(() => {
    if (!friends) return [];
    return friends.filter(f => 
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [friends, searchQuery]);

  // Compute final participants
  const participants = useMemo(() => {
    if (!currentUser) return [];
    if (groupId) {
      const g = groups?.find(x => x.id === groupId);
      return g?.members.map(m => m.user) || [];
    } else {
      const selectedFriends = friends?.filter(f => selectedFriendIds.includes(f.id)) || [];
      return [{ id: currentUser.id, name: currentUser.name }, ...selectedFriends];
    }
  }, [groupId, selectedFriendIds, groups, friends, currentUser]);

  const toggleFriend = (id: string) => {
    setGroupId(null);
    setSelectedFriendIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Set default payer
  useEffect(() => {
    if (currentUser && !payerId) {
      setPayerId(currentUser.id);
    }
  }, [currentUser]);

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
    if (participants.length > 0) {
      participants.forEach(p => {
        if (splitType === "PERCENTAGE") {
          newSplits[p.id] = (100 / participants.length).toFixed(0);
        } else if (splitType === "EXACT") {
          const total = parseFloat(amount) || 0;
          newSplits[p.id] = (total / participants.length).toFixed(2);
        }
      });
      setCustomSplits(newSplits);
    }
  }, [groupId, selectedFriendIds, splitType, participants.length]);

  function formatDate(date: Date): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  async function handleCreate() {
    if (!title.trim() || !amount || (!groupId && selectedFriendIds.length === 0)) {
      Alert.alert("Missing Info", "Please select a group or at least one friend to split with");
      return;
    }

    const userId = useAuthStore.getState().user?.id;
    if (!userId || !payerId) {
       Alert.alert("Missing Info", "Please select who paid");
       return;
    }

    const pIds = participants.map(p => p.id).filter(id => !!id);
    const totalAmount = parseFloat(amount);
    
    if (isNaN(totalAmount) || totalAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount greater than 0");
      return;
    }

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
    const payload = {
      title: title.trim(),
      description: notes.trim() || undefined,
      totalAmount,
      category,
      groupId: groupId || undefined,
      participantIds: pIds,
      splitType,
      payers: [{ userId: payerId!, amountPaid: totalAmount }],
      splits: splitType !== "EQUAL" ? splits : undefined,
      date: expenseDate.toISOString(),
      frequency: frequency || undefined,
      currency,
    };

    console.log("Adding expense with payload:", JSON.stringify(payload, null, 2));

    setLoading(true);
    try {
      await apiPost("/expenses", payload);
      
      notifyExpenseAdded(currentUser?.name || "You", title.trim(), totalAmount, groupId ? groups?.find(g => g.id === groupId)?.name : undefined);
      
      Alert.alert("Done!", "Expense added successfully");
      router.replace("/(tabs)");
    } catch (e: any) {
      console.error("Add expense failed:", e);
      Alert.alert("Error", e.message || "Failed to add expense");
    } finally {
      setLoading(false);
    }
  }

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
      marginTop: 16,
    },
    backBtn: {
      height: 40,
      width: 40,
      borderRadius: 12,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    section: {
      marginBottom: 20,
    },
    label: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    inputContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    input: {
      color: colors.text,
      fontSize: 18,
      fontWeight: 'bold',
      flex: 1,
    },
    amountInput: {
      color: colors.text,
      fontSize: 30,
      fontWeight: 'bold',
      flex: 1,
      marginLeft: 8,
    },
    currencySymbol: {
      color: colors.primary,
      fontWeight: 'bold',
      fontSize: 24,
    },
    categoryBtn: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      marginRight: 8,
      borderWidth: 1,
    },
    categoryBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    categoryBtnInactive: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    categoryTextActive: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 14,
    },
    categoryTextInactive: {
      color: colors.textSecondary,
      fontWeight: 'bold',
      fontSize: 14,
    },
    splitTypeContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    splitTypeBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    splitTypeBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    splitTypeBtnInactive: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    splitTypeTextActive: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 14,
    },
    splitTypeTextInactive: {
      color: colors.textSecondary,
      fontWeight: 'bold',
      fontSize: 14,
    },
    selectionItem: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      marginBottom: 8,
    },
    selectionIcon: {
      height: 32,
      width: 32,
      borderRadius: 8,
      backgroundColor: colors.surfaceActive,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    itemText: {
      color: colors.text,
      fontWeight: 'bold',
      flex: 1,
    },
    emptyState: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    submitBtn: {
      height: 56,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 40,
      backgroundColor: loading ? colors.surfaceActive : colors.primary,
    },
    submitBtnText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
    },
    customSplitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    avatar: {
      height: 32,
      width: 32,
      borderRadius: 16,
      backgroundColor: colors.surfaceActive,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    avatarText: {
      color: colors.text,
      fontWeight: 'bold',
      fontSize: 12,
    },
    splitInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    splitInput: {
      color: colors.text,
      fontWeight: 'bold',
      fontSize: 16,
      width: 64,
      textAlign: 'center',
    },
  }), [colors, isDark, loading]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, paddingHorizontal: 20 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Expense</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Title & Amount */}
          <View style={styles.section}>
            <Text style={styles.label}>What was it for?</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="e.g., Dinner, Uber, Groceries"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>How much?</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Currency */}
          <View style={styles.section}>
            <Text style={styles.label}>Currency</Text>
            <CurrencySelector selectedCurrency={currency} onSelect={setCurrency} />
          </View>

          {/* Date Picker */}
          <View style={styles.section}>
            <Text style={styles.label}>When?</Text>
            <TouchableOpacity 
              onPress={() => setShowDatePicker(true)}
              style={styles.inputContainer}
            >
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <Text style={[styles.input, { marginLeft: 12 }]}>{formatDate(expenseDate)}</Text>
              <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Recurring / Frequency */}
          <View style={styles.section}>
            <Text style={styles.label}>Repeat?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[
                { key: null, label: "One-time" },
                { key: "DAILY", label: "Daily" },
                { key: "WEEKLY", label: "Weekly" },
                { key: "MONTHLY", label: "Monthly" },
              ].map((freq) => (
                <TouchableOpacity
                  key={freq.key || "none"}
                  onPress={() => setFrequency(freq.key as string | null)}
                  style={[
                    styles.categoryBtn,
                    frequency === freq.key ? styles.categoryBtnActive : styles.categoryBtnInactive
                  ]}
                >
                  <Text style={frequency === freq.key ? styles.categoryTextActive : styles.categoryTextInactive}>
                    {freq.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
              themeVariant={isDark ? "dark" : "light"}
            />
          )}

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.label}>Notes (optional)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Add any details..."
                placeholderTextColor={colors.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={2}
              />
            </View>
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[
                    styles.categoryBtn,
                    category === cat ? styles.categoryBtnActive : styles.categoryBtnInactive
                  ]}
                >
                  <Text style={category === cat ? styles.categoryTextActive : styles.categoryTextInactive}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Payer Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Who paid?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {participants.map((p) => {
                const isSelected = payerId === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setPayerId(p.id)}
                    style={[
                      styles.categoryBtn,
                      { flexDirection: 'row', alignItems: 'center' },
                      isSelected ? styles.categoryBtnActive : styles.categoryBtnInactive
                    ]}
                  >
                    {isSelected && <Ionicons name="checkmark-circle" size={16} color="#fff" style={{ marginRight: 6 }} />}
                    <Text style={isSelected ? styles.categoryTextActive : styles.categoryTextInactive}>
                      {p.id === currentUser?.id ? "You" : p.name.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Split Type */}
          <View style={styles.section}>
            <Text style={styles.label}>How to split?</Text>
            <View style={styles.splitTypeContainer}>
              {SPLIT_TYPES.map((st) => (
                <TouchableOpacity
                  key={st.key}
                  onPress={() => setSplitType(st.key as any)}
                  style={[
                    styles.splitTypeBtn,
                    splitType === st.key ? styles.splitTypeBtnActive : styles.splitTypeBtnInactive
                  ]}
                >
                  <Ionicons name={st.icon as any} size={14} color={splitType === st.key ? "#fff" : colors.textSecondary} />
                  <Text style={splitType === st.key ? styles.splitTypeTextActive : styles.splitTypeTextInactive}>
                    {st.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Select Group or Friend */}
          <View style={styles.section}>
            <Text style={[styles.label, { marginBottom: 12 }]}>Split with</Text>
            
            {/* Selected Participants Chips */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
               <View style={{ 
                 backgroundColor: colors.primary + '20', 
                 paddingHorizontal: 12, 
                 paddingVertical: 6, 
                 borderRadius: 20,
                 flexDirection: 'row',
                 alignItems: 'center',
                 borderWidth: 1,
                 borderColor: colors.primary + '40'
               }}>
                 <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 12 }}>You</Text>
               </View>
               
               {groupId ? (
                 <View style={{ 
                   backgroundColor: colors.surfaceActive, 
                   paddingHorizontal: 12, 
                   paddingVertical: 6, 
                   borderRadius: 20,
                   flexDirection: 'row',
                   alignItems: 'center',
                   borderWidth: 1,
                   borderColor: colors.border
                 }}>
                   <Ionicons name="people" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                   <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 12 }}>
                     Group: {groups?.find(g => g.id === groupId)?.name}
                   </Text>
                   <TouchableOpacity onPress={() => setGroupId(null)} style={{ marginLeft: 8 }}>
                     <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
                   </TouchableOpacity>
                 </View>
               ) : (
                 selectedFriendIds.map(fId => {
                   const f = friends?.find(x => x.id === fId);
                   return (
                     <View key={fId} style={{ 
                       backgroundColor: colors.surfaceActive, 
                       paddingHorizontal: 12, 
                       paddingVertical: 6, 
                       borderRadius: 20,
                       flexDirection: 'row',
                       alignItems: 'center',
                       borderWidth: 1,
                       borderColor: colors.border
                     }}>
                       <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 12 }}>{f?.name || "Friend"}</Text>
                       <TouchableOpacity onPress={() => toggleFriend(fId)} style={{ marginLeft: 8 }}>
                         <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
                       </TouchableOpacity>
                     </View>
                   );
                 })
               )}
            </View>

            <View style={[styles.inputContainer, { paddingVertical: 10, marginBottom: 16 }]}>
              <Ionicons name="search" size={20} color={colors.textTertiary} />
              <TextInput
                style={[styles.input, { fontSize: 14, marginLeft: 8 }]}
                placeholder="Search friends or groups..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {searchQuery.length > 0 && (
              <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 8, borderWidth: 1, borderColor: colors.border, marginBottom: 16 }}>
                {/* Search Groups */}
                {groups?.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase())).map(g => (
                  <TouchableOpacity
                    key={g.id}
                    onPress={() => { 
                      setGroupId(g.id); 
                      setSelectedFriendIds([]); 
                      setSearchQuery("");
                    }}
                    style={{ padding: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border }}
                  >
                    <Ionicons name="people-outline" size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
                    <Text style={{ color: colors.text, fontWeight: 'bold', flex: 1 }}>{g.name}</Text>
                    <Text style={{ color: colors.textTertiary, fontSize: 10 }}>Group</Text>
                  </TouchableOpacity>
                ))}

                {/* Search Friends */}
                {filteredFriends.map(f => {
                  const isSelected = selectedFriendIds.includes(f.id);
                  return (
                    <TouchableOpacity
                      key={f.id}
                      onPress={() => { toggleFriend(f.id); setSearchQuery(""); }}
                      style={{ padding: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border }}
                    >
                      <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
                      <Text style={{ color: colors.text, fontWeight: 'bold', flex: 1 }}>{f.name}</Text>
                      {isSelected && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })}

                {filteredFriends.length === 0 && !groups?.some(g => g.name.toLowerCase().includes(searchQuery.toLowerCase())) && (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: colors.textSecondary }}>No friends or groups found</Text>
                    <TouchableOpacity onPress={() => router.push("/new/friend")}>
                      <Text style={{ color: colors.primary, fontWeight: 'bold', marginTop: 8 }}>Add New Friend</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {!searchQuery && !groupId && selectedFriendIds.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={24} color={colors.textMuted} style={{ marginBottom: 8 }} />
                <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center' }}>
                  Search for friends or groups to split this expense
                </Text>
              </View>
            )}
          </View>

          {/* Custom Splits */}
          {splitType !== "EQUAL" && participants.length > 0 && (
            <View style={[styles.section, { backgroundColor: colors.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border }]}>
              <Text style={styles.label}>
                {splitType === "PERCENTAGE" ? "Set percentages" : "Set amounts"}
              </Text>
              {participants.map((p) => (
                <View key={p.id} style={styles.customSplitRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{p.name.charAt(0)}</Text>
                  </View>
                  <Text style={[styles.itemText, { marginRight: 12 }]} numberOfLines={1}>{p.name}</Text>
                  <View style={styles.splitInputContainer}>
                    {splitType === "EXACT" && <Text style={{ color: colors.textSecondary, marginRight: 4 }}>₹</Text>}
                    <TextInput
                      style={styles.splitInput}
                      value={customSplits[p.id] || ""}
                      onChangeText={(v) => setCustomSplits(prev => ({ ...prev, [p.id]: v }))}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                    />
                    {splitType === "PERCENTAGE" && <Text style={{ color: colors.textSecondary, marginLeft: 4 }}>%</Text>}
                  </View>
                </View>
              ))}
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
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
            style={styles.submitBtn}
            onPress={handleCreate}
            disabled={loading}
          >
            <Text style={styles.submitBtnText}>
              {loading ? "Adding..." : "Add Expense"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
