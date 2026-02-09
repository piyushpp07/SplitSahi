import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Platform, KeyboardAvoidingView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiGet, apiPatch, apiDelete } from "@/lib/api";
import { router, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";

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
  const { colors } = useTheme();
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
  const isAdmin = expense?.group && (expense as any).group.members?.some((m: any) => m.userId === currentUserId && m.role === "ADMIN");

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }} edges={['top']}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!expense) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }} edges={['top']}>
        <Text style={{ color: colors.text }}>Expense not found</Text>
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
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
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionBtn: {
      height: 40,
      width: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    label: {
      fontSize: 10,
      fontWeight: 'bold',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 2,
      marginBottom: 8,
    },
    section: {
      marginBottom: 24,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    titleInputContainer: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 4,
    },
    titleInput: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      color: colors.text,
      fontSize: 20,
      fontWeight: 'bold',
    },
    titleText: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.text,
      letterSpacing: -1,
      fontStyle: 'italic',
    },
    amountText: {
      fontSize: 36,
      fontWeight: 'bold',
      color: colors.text,
    },
    categoryBtn: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 16,
      marginRight: 8,
      borderWidth: 1,
    },
    categoryText: {
      fontSize: 10,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    rowCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
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
    mainBtn: {
      height: 56,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: saving ? colors.surfaceActive : colors.primary,
    },
    secondaryBtn: {
      height: 56,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    }
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, paddingHorizontal: 24 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {canEdit && !isEditing && (
              <TouchableOpacity 
                onPress={() => setIsEditing(true)} 
                style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Ionicons name="pencil" size={18} color={colors.info} />
              </TouchableOpacity>
            )}
            {canEdit && (
              <TouchableOpacity 
                onPress={handleDelete} 
                style={[styles.actionBtn, { backgroundColor: colors.errorLight, borderColor: colors.error }]}
              >
                <Ionicons name="trash" size={18} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Title */}
          <View style={styles.section}>
            <Text style={styles.label}>Expense Title</Text>
            {isEditing ? (
              <View style={styles.titleInputContainer}>
                <TextInput
                  style={styles.titleInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Title"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            ) : (
              <Text style={styles.titleText}>{expense.title}</Text>
            )}
          </View>

          {/* Amount */}
          <View style={[styles.card, { marginBottom: 24 }]}>
            <Text style={styles.label}>Total Amount</Text>
            <Text style={styles.amountText}>₹{Number(expense.totalAmount).toFixed(2)}</Text>
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.label}>Category</Text>
            {isEditing ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[
                      styles.categoryBtn, 
                      { 
                        backgroundColor: category === cat ? colors.primary : colors.surface,
                        borderColor: category === cat ? colors.primary : colors.border
                      }
                    ]}
                  >
                    <Text style={[
                      styles.categoryText, 
                      { color: category === cat ? '#fff' : colors.textSecondary }
                    ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={{ backgroundColor: colors.surfaceActive, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}>
                <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>{expense.category}</Text>
              </View>
            )}
          </View>

          {/* Split Type */}
          <View style={styles.section}>
            <Text style={styles.label}>Split Type</Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>{expense.splitType}</Text>
          </View>

          {/* Group */}
          {expense.group && (
            <View style={styles.section}>
              <Text style={styles.label}>Group</Text>
              <TouchableOpacity 
                style={styles.rowCard}
                onPress={() => router.push(`/group/${expense.group?.id}`)}
              >
                <Ionicons name="people" size={18} color={colors.primary} />
                <Text style={{ color: colors.text, fontWeight: 'bold', marginLeft: 12 }}>{expense.group.name}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            </View>
          )}

          {/* Paid By */}
          <View style={styles.section}>
            <Text style={styles.label}>Paid By</Text>
            <View>
              {expense.payers.map((p) => {
                const isMe = p.userId === currentUserId;
                const canSeeAmount = isMe || canEdit || isAdmin;
                
                return (
                  <View key={p.userId} style={styles.rowCard}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{p.user.name.charAt(0)}</Text>
                    </View>
                    <Text style={{ color: colors.text, fontWeight: isMe ? 'bold' : 'normal', flex: 1 }}>
                      {isMe ? "You" : p.user.name}
                    </Text>
                    <Text style={{ color: colors.success, fontWeight: 'bold' }}>
                      {canSeeAmount ? `₹${Number(p.amountPaid).toFixed(2)}` : "₹ ••••"}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Splits */}
          <View style={{ marginBottom: 40 }}>
            <Text style={styles.label}>Split Breakdown</Text>
            <View>
              {expense.splits.map((s) => {
                const isMe = s.userId === currentUserId;
                const canSeeAmount = isMe || canEdit || isAdmin;

                return (
                  <View key={s.userId} style={[styles.rowCard, isMe && { borderColor: colors.primary, borderWidth: 1.5 }]}>
                    <View style={[styles.avatar, isMe && { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.avatarText, isMe && { color: colors.primary }]}>{s.user.name.charAt(0)}</Text>
                    </View>
                    <Text style={{ color: colors.text, fontWeight: isMe ? 'bold' : 'normal', flex: 1 }}>
                      {isMe ? "Your Share" : s.user.name}
                    </Text>
                    <View style={{ alignItems: 'flex-end' }}>
                      {s.percentage && (
                        <Text style={{ color: colors.textSecondary, fontSize: 10, marginBottom: 2 }}>{Number(s.percentage).toFixed(0)}%</Text>
                      )}
                      <Text style={{ color: colors.error, fontWeight: 'bold' }}>
                        {canSeeAmount ? `₹${Number(s.amountOwed).toFixed(2)}` : "₹ ••••"}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Save Button */}
          {isEditing && (
            <View style={{ gap: 12, marginBottom: 40 }}>
              <TouchableOpacity
                style={styles.mainBtn}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, fontSize: 14 }}>
                  {saving ? "SAVING..." : "SAVE CHANGES"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => {
                  setTitle(expense.title);
                  setCategory(expense.category || "Other");
                  setIsEditing(false);
                }}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, fontSize: 14 }}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
