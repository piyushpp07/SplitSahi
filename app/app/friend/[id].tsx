import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "@/contexts/ThemeContext";

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
    currency?: string;
  }>;
}

export default function FriendDetailScreen() {
  const { colors, isDark } = useTheme();
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
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }} edges={['top']}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }} edges={['top']}>
        <Text style={{ color: colors.text }}>Friend not found</Text>
      </SafeAreaView>
    );
  }

  const { friend, balance, transactions } = data;
  const iOwe = balance < 0;
  const absBalance = Math.abs(balance);

  const styles = StyleSheet.create({
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
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 16,
    },
    subtitle: {
      fontSize: 10,
      fontWeight: 'bold',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 2,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      letterSpacing: -1,
      fontStyle: 'italic',
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 24,
    },
    balanceCard: {
      borderRadius: 16,
      padding: 16,
      marginTop: 16,
      borderWidth: 1,
    },
    balanceTitle: {
      fontSize: 10,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 4,
    },
    balanceAmount: {
      fontSize: 32,
      fontWeight: 'bold',
    },
    transactionCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    dateText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    actionBtn: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyState: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 32,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
      alignItems: 'center',
    }
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={{ flex: 1, paddingHorizontal: 24 }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.subtitle}>Friend Details</Text>
            <Text style={styles.title}>{friend.name}</Text>
          </View>
        </View>

        {/* Friend Card */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ height: 64, width: 64, borderRadius: 32, backgroundColor: colors.surfaceActive, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text }}>{friend.name.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 18 }}>{friend.name}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: 'bold' }}>{friend.email}</Text>
              {friend.upiId && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Ionicons name="card" size={12} color={colors.info} />
                  <Text style={{ color: colors.info, fontSize: 10, fontWeight: 'bold', marginLeft: 4 }}>{friend.upiId}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Balance */}
          <View style={[
            styles.balanceCard,
            iOwe ? { backgroundColor: colors.errorLight, borderColor: colors.error } : 
            absBalance > 0 ? { backgroundColor: colors.successLight, borderColor: colors.success } : 
            { backgroundColor: colors.surfaceActive, borderColor: colors.border }
          ]}>
            <Text style={[styles.balanceTitle, { color: iOwe ? colors.error : absBalance > 0 ? colors.success : colors.textSecondary }]}>
              {absBalance === 0 ? "All Settled" : iOwe ? "You Owe" : "Owes You"}
            </Text>
            <Text style={[styles.balanceAmount, { color: iOwe ? colors.error : absBalance > 0 ? colors.success : colors.textMuted }]}>
              ₹{absBalance.toFixed(2)}
            </Text>
          </View>

          {/* Actions */}
          {absBalance > 0 && (
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              {iOwe ? (
                 friend.upiId && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                    onPress={openUPI}
                  >
                    <Ionicons name="flash" size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginLeft: 8 }}>Pay Now</Text>
                  </TouchableOpacity>
                 )
              ) : (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                    onPress={async () => {
                      const text = `Hi ${friend.name}, gentle reminder to pay ₹${absBalance.toFixed(0)} for our shared expenses.`;
                      const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
                      try {
                          await Linking.openURL(url);
                      } catch {
                          Alert.alert("Reminder Copied", text);
                      }
                    }}
                  >
                    <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginLeft: 8 }}>Remind</Text>
                  </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                onPress={() => router.push(`/new/settlement?toUserId=${iOwe ? friend.id : userId}&amount=${absBalance}` as any)}
              >
                <Ionicons name="receipt" size={18} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginLeft: 8 }}>Settle</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Transactions Section */}
        <View style={{ marginBottom: 16 }}>
          <Text style={[styles.subtitle, { marginBottom: 16 }]}>Transaction History</Text>
          
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={32} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontWeight: 'bold', fontSize: 12, marginTop: 12, textTransform: 'uppercase', letterSpacing: 1 }}>No transactions yet</Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {transactions.map((t) => {
                const date = new Date(t.createdAt);
                const isExpense = t.type === "expense";
                
                return (
                  <TouchableOpacity
                    key={`${t.type}-${t.id}`}
                    style={styles.transactionCard}
                    onPress={() => isExpense ? router.push(`/expense/${t.id}`) : null}
                    activeOpacity={isExpense ? 0.7 : 1}
                  >
                    <View style={{ height: 40, width: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: isExpense ? colors.successLight : colors.infoLight }}>
                      <Ionicons 
                        name={isExpense ? "cart" : "swap-horizontal"} 
                        size={18} 
                        color={isExpense ? colors.success : colors.info} 
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14, flex: 1, marginRight: 8 }} numberOfLines={1}>
                          {isExpense ? t.title : (t.isFromMe ? `You paid ${friend.name}` : `${friend.name} paid you`)}
                        </Text>
                        <Text style={{ fontWeight: 'bold', fontSize: 14, color: isExpense ? colors.success : colors.info }}>
                          ₹{t.amount.toFixed(0)}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.dateText}>
                          {date.toLocaleDateString()} • {isExpense ? t.category : 'Settlement'}
                        </Text>
                        {isExpense && t.myShare !== undefined && (
                          <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: 'bold' }}>
                            Your share: ₹{t.myShare.toFixed(0)}
                          </Text>
                        )}
                      </View>
                      {isExpense && t.group && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                          <Ionicons name="people" size={10} color={colors.textTertiary} />
                          <Text style={{ color: colors.textTertiary, fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase', marginLeft: 4 }}>{t.group.name}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Add Expense Button */}
        <TouchableOpacity
          style={{ height: 56, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 16 }}
          onPress={() => router.push("/new/expense")}
        >
          <Ionicons name="add" size={20} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginLeft: 8 }}>Add Expense with {friend.name.split(' ')[0]}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
