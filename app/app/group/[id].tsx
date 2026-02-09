import { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, LayoutAnimation, StyleSheet, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiDelete } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import ShareInvite from "@/components/ShareInvite";
import { useTheme } from "@/contexts/ThemeContext";
import Avatar from "@/components/Avatar";

interface Group {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
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
  const { colors, isDark } = useTheme();
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

  async function handleExportPDF() {
    if (!group || !expenses) return;
    try {
      const { generateGroupPDF } = await import("@/lib/pdfReport");
      const total = expenses.reduce((s, e) => s + Number(e.totalAmount), 0).toFixed(0);
      
      await generateGroupPDF({
        groupName: group.name,
        totalExpenses: total,
        members: group.members.map(m => ({ name: m.user.name, email: m.user.email })),
        expenses: expenses.map(e => ({
          title: e.title,
          category: e.category,
          amount: Number(e.totalAmount).toFixed(0),
          date: new Date(e.createdAt).toLocaleDateString('en-IN'),
          creator: e.creator.name
        }))
      });
    } catch (e) {
      Alert.alert("Error", "Failed to generate report");
    }
  }

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

  if (isLoading) return <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View>;
  if (!group) return <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.text }}>Group not found</Text></View>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, marginTop: 8 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: colors.surface, padding: 10, borderRadius: 12 }}>
              <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <ShareInvite groupId={group.id} groupName={group.name} inviteCode={group.id} />
              {isAdmin && (
                <TouchableOpacity onPress={handleDelete} style={{ backgroundColor: '#fee2e2', padding: 10, borderRadius: 12 }}>
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Avatar url={group.imageUrl} name={group.name} size={80} style={{ marginBottom: 16 }} />
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: 4 }}>{group.name}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', paddingHorizontal: 40 }}>
              {group.description || "No description"}
            </Text>
          </View>

          {/* Quick Stats */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>Members</Text>
              <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 18 }}>{group.members.length}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>Expenses</Text>
              <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 18 }}>{expenses?.length || 0}</Text>
            </View>
            <TouchableOpacity 
              onPress={handleExportPDF}
              style={{ flex: 1.2, backgroundColor: colors.primary + '10', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: colors.primary + '30', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="document-text" size={20} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 10, marginTop: 4 }}>Export Report</Text>
            </TouchableOpacity>
          </View>

          {/* Members Section */}
          <TouchableOpacity 
            style={{ 
              backgroundColor: colors.surface, 
              borderRadius: 16, 
              padding: 16, 
              borderWidth: 1, 
              borderColor: colors.border, 
              flexDirection: 'row', 
              alignItems: 'center', 
              marginBottom: 12 
            }}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setShowMembers(!showMembers);
            }}
          >
            <Ionicons name="people" size={18} color={colors.textSecondary} />
            <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14, flex: 1, marginLeft: 12 }}>Members</Text>
            <Ionicons name={showMembers ? "chevron-up" : "chevron-down"} size={16} color={colors.textTertiary} />
          </TouchableOpacity>

          {showMembers && (
            <View style={{ backgroundColor: colors.surfaceActive, borderRadius: 16, padding: 8, marginBottom: 16, gap: 4 }}>
              {group.members.map((m) => (
                <View key={m.userId} style={{ padding: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Avatar url={m.user.avatarUrl} name={m.user.name} size={32} style={{ marginRight: 12 }} />
                  <Text style={{ color: colors.text, flex: 1, fontSize: 14 }}>{m.user.name}</Text>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', marginRight: 12, color: m.role === 'ADMIN' ? colors.primary : colors.textSecondary }}>{m.role === 'ADMIN' ? 'Admin' : 'Member'}</Text>
                  {isAdmin && m.userId !== currentUserId && (
                    <TouchableOpacity onPress={() => removeMemberMutation.mutate(m.userId)}>
                      <Ionicons name="close-circle" size={18} color={colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Expenses Section */}
          <TouchableOpacity 
            style={{ 
              backgroundColor: colors.surface, 
              borderRadius: 16, 
              padding: 16, 
              borderWidth: 1, 
              borderColor: colors.border, 
              flexDirection: 'row', 
              alignItems: 'center', 
              marginBottom: 12 
            }}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setShowExpenses(!showExpenses);
            }}
          >
            <Ionicons name="receipt" size={18} color={colors.textSecondary} />
            <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14, flex: 1, marginLeft: 12 }}>Expenses</Text>
            <Ionicons name={showExpenses ? "chevron-up" : "chevron-down"} size={16} color={colors.textTertiary} />
          </TouchableOpacity>

          {showExpenses && (
            <View style={{ backgroundColor: colors.surfaceActive, borderRadius: 16, padding: 8, marginBottom: 16 }}>
              {expenses && expenses.length > 0 ? (
                <View style={{ gap: 8 }}>
                  {expenses.map((exp) => (
                    <TouchableOpacity 
                      key={exp.id} 
                      style={{ padding: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}
                      onPress={() => router.push(`/expense/${exp.id}`)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14 }} numberOfLines={1}>{exp.title}</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                          {exp.creator?.name} • {exp.category}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14 }}>₹{Number(exp.totalAmount).toFixed(0)}</Text>
                        {(exp.creator?.id === currentUserId || isAdmin) && (
                          <TouchableOpacity 
                            onPress={() => handleDeleteExpense(exp.id, exp.title)}
                            style={{ marginTop: 4, paddingHorizontal: 8, paddingVertical: 2 }}
                            >
                            <Text style={{ color: colors.error, fontSize: 10 }}>Delete</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 14 }}>No expenses yet</Text>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <TouchableOpacity 
              style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 16, height: 48, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => router.push({ pathname: "/new/expense", params: { groupId: group.id } })}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Add Expense</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}
              onPress={() => router.push({ pathname: "/new/settlement", params: { groupId: group.id } })}
            >
              <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14 }}>Settle Up</Text>
            </TouchableOpacity>
          </View>

          {/* Balance Section */}
          <GroupBalances groupId={group.id} groupData={group} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function GroupBalances({ groupId, groupData }: { groupId: string, groupData: Group }) {
  const { colors } = useTheme();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [showAll, setShowAll] = useState(false);
  const isAdmin = groupData.members.find(m => m.userId === currentUserId)?.role === "ADMIN";
  
  const { data } = useQuery({
    queryKey: ["dashboard", groupId],
    queryFn: () => apiGet<any>(`/dashboard?groupId=${groupId}`),
  });

  const allTransactions = data?.simplifiedTransactions || [];
  const youOwe = data?.youOwe || 0;
  const youAreOwed = data?.youAreOwed || 0;

  const relevantTransactions = allTransactions.filter((t: any) => 
    t.fromUserId === currentUserId || t.toUserId === currentUserId
  );

  const transactions = showAll ? allTransactions : relevantTransactions;

  return (
    <View style={{ marginTop: 32 }}>
      {/* Balance Summary */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
        <View style={{ flex: 1, backgroundColor: colors.errorLight, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.error }}>
          <Text style={{ color: colors.error, fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>You Owe</Text>
          <Text style={{ color: colors.error, fontWeight: 'bold', fontSize: 20 }}>₹{youOwe.toFixed(0)}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.successLight, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.success }}>
          <Text style={{ color: colors.success, fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>You Get</Text>
          <Text style={{ color: colors.success, fontWeight: 'bold', fontSize: 20 }}>₹{youAreOwed.toFixed(0)}</Text>
        </View>
      </View>

      {allTransactions.length > 0 && (
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: colors.textSecondary, fontWeight: 'bold', fontSize: 14 }}>
              {showAll ? "All Group Settlements" : "Your Settlements"}
            </Text>
            {isAdmin && allTransactions.length > relevantTransactions.length && (
              <TouchableOpacity onPress={() => setShowAll(!showAll)}>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: 'bold' }}>
                  {showAll ? "Show Less" : "Show All (Admin)"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={{ gap: 8 }}>
            {transactions.map((t: any, i: number) => {
               const isOwedToMe = t.toUserId === currentUserId;
               const isOwedByMe = t.fromUserId === currentUserId;

               return (
              <View key={i} style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 14 }}>
                      <Text style={{ fontWeight: 'bold' }}>{t.fromUserId === currentUserId ? "You" : t.fromUser?.name}</Text> 
                      {" " + (t.fromUserId === currentUserId ? "owe" : "owes") + " "}
                      <Text style={{ fontWeight: 'bold' }}>{t.toUserId === currentUserId ? "You" : t.toUser?.name}</Text>
                  </Text>
                  <Text style={{ color: colors.success, fontWeight: 'bold', fontSize: 14, marginTop: 4 }}>₹{t.amount.toFixed(2)}</Text>
                </View>
                
                <View style={{ gap: 8 }}> 
                    {isOwedToMe && (
                        <TouchableOpacity 
                        style={{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                        onPress={async () => {
                            const personToRemind = t.fromUser;
                            const text = `Hi ${personToRemind?.name}, reminder to pay ₹${t.amount} in group.`;
                            const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
                             try { await Linking.openURL(url); } catch { Alert.alert("Reminder", text); }
                        }}
                        >
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 10 }}>Remind</Text>
                        </TouchableOpacity>
                    )}
                    
                    {(isOwedByMe || isOwedToMe) && (
                        <TouchableOpacity 
                        style={{ backgroundColor: colors.surfaceActive, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}
                        onPress={() => router.push({
                            pathname: "/new/settlement",
                            params: { 
                                toUserId: (t.toUserId === currentUserId ? t.fromUserId : t.toUserId), 
                                amount: t.amount.toString(), 
                                groupId,
                                direction: t.toUserId === currentUserId ? "THEY_PAID" : "YOU_PAID"
                            }
                        })}
                        >
                        <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 10 }}>Settle</Text>
                        </TouchableOpacity>
                    )}
                </View>
              </View>
            )})}
          </View>
        </>
      )}
    </View>
  );
}
