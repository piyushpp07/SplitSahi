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


function GroupBalances({ groupId, groupData }: { groupId: string, groupData: any }) {
  const { colors } = useTheme();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [showAll, setShowAll] = useState(false);
  const [useSimplified, setUseSimplified] = useState(false);
  
  // Regular dashboard data
  const { data: dashboardData } = useQuery({
    queryKey: ["dashboard", groupId],
    queryFn: () => apiGet<any>(`/dashboard?groupId=${groupId}`),
  });

  // Simplified debts data
  const { data: simplifiedDebts } = useQuery({
    queryKey: ["simplified-debts", groupId],
    queryFn: () => apiGet<any[]>(`/groups/${groupId}/simplified-debts`),
    enabled: useSimplified,
  });

  const transactions = useSimplified 
    ? (simplifiedDebts || []) 
    : (dashboardData?.recommendedActions || []);

  const totalOwes = dashboardData?.totalOwes || 0;
  const totalOwed = dashboardData?.totalOwed || 0;

  return (
    <View style={{ marginTop: 32, marginBottom: 40 }}>
      {/* Metrics */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.error }}>
             <Text style={{ color: colors.error, fontSize: 12, fontWeight: 'bold' }}>You Owe</Text>
             <Text style={{ color: colors.error, fontSize: 24, fontWeight: 'bold', marginTop: 4 }}>₹{Math.abs(totalOwes).toFixed(0)}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.success }}>
             <Text style={{ color: colors.success, fontSize: 12, fontWeight: 'bold' }}>You are owed</Text>
             <Text style={{ color: colors.success, fontSize: 24, fontWeight: 'bold', marginTop: 4 }}>₹{Math.abs(totalOwed).toFixed(0)}</Text>
          </View>
      </View>

      {/* Toggle Simplification */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 16 }}>Settlements</Text>
        <TouchableOpacity 
          onPress={() => setUseSimplified(!useSimplified)}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: useSimplified ? colors.primary + '20' : colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: useSimplified ? colors.primary : colors.border }}
        >
          <Ionicons name="git-merge-outline" size={16} color={useSimplified ? colors.primary : colors.textSecondary} />
          <Text style={{ marginLeft: 6, fontSize: 12, fontWeight: 'bold', color: useSimplified ? colors.primary : colors.textSecondary }}>
            {useSimplified ? "Simplified" : "Standard"}
          </Text>
        </TouchableOpacity>
      </View>
      
      {useSimplified && (
        <View style={{ backgroundColor: colors.primary + '10', padding: 12, borderRadius: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={{ flex: 1, marginLeft: 8, fontSize: 12, color: colors.text, lineHeight: 18 }}>
            Simplified debts minimize the total number of transactions needed to settle up the group.
          </Text>
        </View>
      )}

      {/* List */}
      <View style={{ gap: 12 }}>
        {transactions.map((t: any, i: number) => {
          // Check structure difference between simplified (from/to objects) vs dashboard (fromUserId string)
          const fromUser = t.from || t.fromUser;
          const toUser = t.to || t.toUser;
          const fromName = fromUser?.id === currentUserId ? "You" : fromUser?.name;
          const toName = toUser?.id === currentUserId ? "You" : toUser?.name;
          
          const isMeInvolved = fromUser?.id === currentUserId || toUser?.id === currentUserId;

          return (
            <View key={i} style={{ 
              backgroundColor: colors.surface, 
              padding: 16, 
              borderRadius: 16, 
              borderWidth: 1, 
              borderColor: colors.border,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
               <View style={{ flex: 1 }}>
                 <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Avatar name={fromUser?.name || "?"} url={fromUser?.avatarUrl} size={24} />
                    <Ionicons name="arrow-forward" size={16} color={colors.textTertiary} style={{ marginHorizontal: 8 }} />
                    <Avatar name={toUser?.name || "?"} url={toUser?.avatarUrl} size={24} />
                 </View>
                 <Text style={{ marginTop: 8, color: colors.text, fontSize: 14 }}>
                    <Text style={{ fontWeight: 'bold' }}>{fromName}</Text> pays <Text style={{ fontWeight: 'bold' }}>{toName}</Text>
                 </Text>
               </View>

               <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.success }}>₹{Number(t.amount).toFixed(0)}</Text>
                  
                  {isMeInvolved && (
                    <TouchableOpacity 
                      style={{ marginTop: 8, backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                      onPress={() => {
                        router.push({
                          pathname: "/new/settlement",
                          params: {
                            groupId,
                            toUserId: fromUser.id === currentUserId ? toUser.id : fromUser.id,
                            amount: t.amount.toString(),
                            direction: fromUser.id === currentUserId ? "YOU_PAID" : "THEY_PAID"
                          }
                        });
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>Settle</Text>
                    </TouchableOpacity>
                  )}
               </View>
            </View>
          );
        })}
        {transactions.length === 0 && (
          <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 20 }}>No debts found. You're all settled up!</Text>
        )}
      </View>
    </View>
  );
}
