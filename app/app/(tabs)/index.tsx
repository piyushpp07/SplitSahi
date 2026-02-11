import { useState, useCallback, useMemo, memo } from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking, Alert, TextInput, RefreshControl, StyleSheet, Dimensions, LayoutAnimation } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { router, useFocusEffect } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import Animated, { FadeInDown, FadeInUp, Layout } from "react-native-reanimated";

const { width } = Dimensions.get("window");

interface DashboardRes {
  youOwe: number;
  youAreOwed: number;
  simplifiedTransactions: Array<{
    fromUserId: string;
    toUserId: string;
    amount: number;
    fromUser?: { id: string; name: string; avatarUrl?: string };
    toUser?: { id: string; name: string; avatarUrl?: string; upiId?: string };
  }>;
}

export default function DashboardScreen() {
  const userId = useAuthStore((s) => s.user?.id);
  const userName = useAuthStore((s) => s.user?.name);
  const [settling, setSettling] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("Good Morning");
  
  const { colors, isDark } = useTheme();
  
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiGet<DashboardRes>("/dashboard"),
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
      updateGreeting();
    }, [])
  );

  function updateGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay("Good Morning");
    else if (hour < 18) setTimeOfDay("Good Afternoon");
    else setTimeOfDay("Good Evening");
  }

  const getGreeting = () => timeOfDay;

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingIcon: {
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(99, 102, 241, 0.1)',
      padding: 16,
      borderRadius: 50,
      marginBottom: 16,
    },
    loadingText: {
      color: colors.textSecondary,
      fontWeight: 'bold',
      fontSize: 16,
    },
    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    errorText: {
      color: colors.error,
      textAlign: 'center',
      marginTop: 16,
      fontWeight: 'bold',
    },
    retryButton: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 16,
    },
    retryText: {
      color: colors.error,
      fontWeight: 'bold',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 16,
    },
    greeting: {
      color: colors.textTertiary,
      fontSize: 12,
      fontWeight: 'normal',
    },
    userName: {
      color: colors.text,
      fontSize: 24,
      fontWeight: 'bold',
    },
    headerButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    headerBtn: {
      height: 44,
      width: 44,
      borderRadius: 22,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    headerBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    searchContainer: {
      marginHorizontal: 20,
      marginBottom: 16,
      backgroundColor: colors.surface,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 14,
      color: colors.text,
      fontSize: 15,
    },
    balanceCard: {
      marginHorizontal: 20,
      marginBottom: 20,
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.borderLight,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 20,
      elevation: 10,
    },
    balanceLabel: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8,
    },
    balanceAmount: {
      fontSize: 36,
      fontWeight: 'bold',
      marginBottom: 20,
      color: colors.text,
    },
    positive: {
      color: colors.success,
    },
    negative: {
      color: colors.error,
    },
    balanceRow: {
      flexDirection: 'row',
      gap: 12,
    },
    balanceItem: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    balanceIconRed: {
      backgroundColor: isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(239, 68, 68, 0.1)',
      padding: 8,
      borderRadius: 10,
    },
    balanceIconGreen: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
      padding: 8,
      borderRadius: 10,
    },
    balanceItemLabel: {
      color: colors.textTertiary,
      fontSize: 10,
      fontWeight: 'bold',
      textTransform: 'uppercase',
    },
    balanceItemValue: {
      color: colors.text,
      fontSize: 18,
      fontWeight: 'bold',
    },
    section: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    sectionTitle: {
      color: colors.textTertiary,
      fontSize: 10,
      fontWeight: 'bold',
      letterSpacing: 2,
      marginBottom: 12,
    },
    sectionTitleLarge: {
      color: colors.text,
      fontSize: 18,
      fontWeight: 'bold',
    },
    sectionSubtitle: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    historyBtn: {
      backgroundColor: colors.surface,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    historyBtnText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: 'bold',
    },
    quickActionsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    quickAction: {
      flex: 1,
      borderRadius: 20,
      padding: 16,
      minHeight: 120,
      justifyContent: 'space-between',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    quickActionIcon: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickActionLabel: {
      color: '#fff',
      fontSize: 13,
      fontWeight: 'bold',
      marginTop: 12,
    },
    quickActionSub: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: 10,
      fontWeight: 'normal',
      marginTop: 2,
    },
    emptyState: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 40,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderStyle: 'dashed',
    },
    emptyIcon: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.1)',
      padding: 16,
      borderRadius: 50,
      marginBottom: 16,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: 'bold',
    },
    emptySubtitle: {
      color: colors.textSecondary,
      fontSize: 14,
      marginTop: 4,
    },
    transactionCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    transactionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: colors.surfaceActive,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    avatarText: {
      color: colors.primary,
      fontSize: 18,
      fontWeight: 'bold',
    },
    transactionName: {
      color: colors.text,
      fontSize: 15,
      fontWeight: 'bold',
    },
    transactionSubtext: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    transactionAmount: {
      color: colors.success,
      fontSize: 22,
      fontWeight: 'bold',
    },
    actionRow: {
      flexDirection: 'row',
      gap: 10,
    },
    recordBtn: {
      flex: 1,
      height: 48,
      borderRadius: 14,
      backgroundColor: colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    recordBtnText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: 'bold',
    },
    payBtn: {
      flex: 1,
      height: 48,
      borderRadius: 14,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    payBtnDisabled: {
      backgroundColor: colors.textMuted,
    },
    payBtnText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: 'bold',
    },
    incomingBadge: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.1)',
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.2)',
    },
    incomingText: {
      color: colors.success,
      fontSize: 14,
      fontWeight: 'bold',
    },
    analyticsBanner: {
      marginHorizontal: 20,
      marginBottom: 24,
      backgroundColor: isDark ? '#1e293b' : colors.primary,
      borderRadius: 20,
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    analyticsIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    analyticsTitle: {
      color: '#fff',
      fontSize: 14,
      fontWeight: 'bold',
    },
    analyticsSubtitle: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 12,
    },
  }), [colors, isDark]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <Ionicons name="wallet" size={32} color={colors.primary} />
          </View>
          <Text style={styles.loadingText}>Loading your finances...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error instanceof Error ? error.message : "Failed to load"}</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const youOwe = data?.youOwe ?? 0;
  const youAreOwed = data?.youAreOwed ?? 0;
  const netBalance = youAreOwed - youOwe;
  const transactions = data?.simplifiedTransactions ?? [];
  
  const filteredTransactions = useMemo(() => 
    transactions.filter(t => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      const fromName = t.fromUser?.name || "";
      const toName = t.toUser?.name || "";
      
      return (
        fromName.toLowerCase().includes(searchLower) ||
        toName.toLowerCase().includes(searchLower)
      );
    }),
    [transactions, search]
  );

  async function openUPIPay(transaction: typeof transactions[0]) {
    const toUser = transaction.toUser;
    if (!toUser?.upiId) {
      Alert.alert("No UPI ID", `${toUser?.name} hasn't added their UPI ID yet.`);
      return;
    }
    
    setSettling(`${transaction.fromUserId}-${transaction.toUserId}`);
    const upiUrl = `upi://pay?pa=${encodeURIComponent(toUser.upiId)}&pn=${encodeURIComponent(toUser.name)}&am=${transaction.amount}&cu=INR&tn=SplitItUp%20Settlement`;
    
    try {
      await Linking.openURL(upiUrl);
    } catch {
      Alert.alert("Error", "Could not open UPI app");
    } finally {
      setSettling(null);
    }
  }

  // Balance Card with Animation
  const renderBalanceCard = () => (
    <Animated.View 
      entering={FadeInUp.delay(300).duration(800)}
      style={styles.balanceCard}
    >
      <Text style={styles.balanceLabel}>Net Balance</Text>
      <View style={{flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between'}}>
        <Text style={[styles.balanceAmount, netBalance >= 0 ? styles.positive : styles.negative]}>
          {netBalance >= 0 ? '+' : ''}₹{Math.abs(netBalance).toFixed(2)}
        </Text>
        {netBalance !== 0 && (
          <View style={{paddingBottom: 24}}>
              <Text style={{color: netBalance > 0 ? colors.success : colors.error, fontWeight: 'bold', fontSize: 12}}>
                  {netBalance > 0 ? "You are owed" : "You owe"}
              </Text>
          </View>
        )}
      </View>
      
      <View style={styles.balanceRow}>
        <View style={styles.balanceItem}>
          <View style={styles.balanceIconRed}>
            <Ionicons name="arrow-down" size={14} color={colors.error} />
          </View>
          <View>
            <Text style={styles.balanceItemLabel}>You Owe</Text>
            <Text style={styles.balanceItemValue}>₹{youOwe.toFixed(0)}</Text>
          </View>
        </View>
        <View style={styles.balanceItem}>
          <View style={styles.balanceIconGreen}>
            <Ionicons name="arrow-up" size={14} color={colors.success} />
          </View>
          <View>
            <Text style={styles.balanceItemLabel}>You Get</Text>
            <Text style={styles.balanceItemValue}>₹{youAreOwed.toFixed(0)}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <Animated.View 
          entering={FadeInDown.duration(800)}
          style={styles.header}
        >
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{userName?.split(' ')[0] || 'User'} 👋</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={[styles.headerBtn, showSearch && styles.headerBtnActive]}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setShowSearch(!showSearch);
                if (showSearch) setSearch("");
              }}
            >
              <Ionicons name="search" size={18} color={showSearch ? "#fff" : colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerBtn}
              onPress={() => router.push("/friends")}
            >
              <Ionicons name="people" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </Animated.View>
        
        {showSearch && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={16} color={colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search transactions..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={(text) => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setSearch(text);
              }}
              autoFocus
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setSearch("");
              }}>
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Balance Card */}
        {renderBalanceCard()}

        {/* Analytics Banner */}
        <Animated.View entering={FadeInDown.delay(400).duration(800)}>
          <TouchableOpacity 
            style={styles.analyticsBanner}
            onPress={() => router.push("/analytics")}
            activeOpacity={0.9}
          >
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <View style={styles.analyticsIcon}>
                <Ionicons name="pie-chart" size={20} color="#fff" />
              </View>
              <View style={{marginLeft: 12}}>
                <Text style={styles.analyticsTitle}>Spending Insights</Text>
                <Text style={styles.analyticsSubtitle}>Track your monthly expenses</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </Animated.View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity 
              style={[styles.quickAction, { backgroundColor: '#059669' }]}
              onPress={() => router.push("/new/expense")}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="add-circle" size={24} color="#fff" />
              </View>
              <Text style={styles.quickActionLabel}>Add Expense</Text>
              <Text style={styles.quickActionSub}>Split a bill</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickAction, { backgroundColor: '#6366f1' }]}
              onPress={() => router.push("/new/group")}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="people" size={24} color="#fff" />
              </View>
              <Text style={styles.quickActionLabel}>New Group</Text>
              <Text style={styles.quickActionSub}>Create team</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickAction, { backgroundColor: '#d97706' }]}
              onPress={() => router.push("/new/settlement")}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="flash" size={24} color="#fff" />
              </View>
              <Text style={styles.quickActionLabel}>Settle Up</Text>
              <Text style={styles.quickActionSub}>Pay friend</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitleLarge}>Who owes who</Text>
              <Text style={styles.sectionSubtitle}>
                {filteredTransactions.length} {filteredTransactions.length === 1 ? 'payment' : 'payments'} pending
              </Text>
            </View>
            {transactions.length > 0 && (
              <TouchableOpacity 
                onPress={() => router.push("/(tabs)/activity")}
                style={styles.historyBtn}
              >
                <Text style={styles.historyBtnText}>History</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="checkmark-circle" size={40} color={colors.success} />
              </View>
              <Text style={styles.emptyTitle}>All Settled! 🎉</Text>
              <Text style={styles.emptySubtitle}>No pending payments</Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {filteredTransactions.map((t, index) => (
                <TransactionItem 
                  key={`${t.fromUserId}-${t.toUserId}`} 
                  transaction={t} 
                  userId={userId} 
                  settling={settling} 
                  colors={colors} 
                  styles={styles}
                  onPay={openUPIPay}
                  index={index}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const TransactionItem = memo(({ transaction, userId, settling, colors, styles, onPay, index }: any) => {
  const isPayer = userId === transaction.fromUserId;
  const isSettling = settling === `${transaction.fromUserId}-${transaction.toUserId}`;
  
  return (
    <Animated.View 
      entering={FadeInDown.delay(500 + (index * 100)).duration(600)}
      style={styles.transactionCard}
    >
      <View style={styles.transactionHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {transaction.fromUserId === userId 
              ? (transaction.toUser?.emoji || transaction.toUser?.name?.charAt(0))
              : (transaction.fromUser?.emoji || transaction.fromUser?.name?.charAt(0))}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.transactionName}>
             {transaction.fromUserId === userId 
               ? `You owe ${transaction.toUser?.name}` 
               : `${transaction.fromUser?.name} owes you`}
          </Text>
          <Text style={styles.transactionSubtext}>
            {transaction.fromUserId === userId 
              ? (transaction.toUser?.username ? `@${transaction.toUser.username}` : transaction.toUser?.email)
              : (transaction.fromUser?.username ? `@${transaction.fromUser.username}` : transaction.fromUser?.email)}
          </Text>
        </View>
        <Text style={styles.transactionAmount}>₹{transaction.amount.toFixed(0)}</Text>
      </View>
      
      {isPayer ? (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.recordBtn}
            onPress={() => router.push({
              pathname: "/new/settlement",
              params: { 
                toUserId: transaction.toUserId, 
                amount: transaction.amount.toString(),
                direction: "YOU_PAID"
              }
            })}
          >
            <Ionicons name="receipt" size={16} color={colors.textSecondary} />
            <Text style={styles.recordBtnText}>Record</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.payBtn, isSettling && styles.payBtnDisabled]}
            onPress={() => onPay(transaction)}
            disabled={isSettling}
          >
            <Ionicons name="flash" size={16} color="#fff" />
            <Text style={styles.payBtnText}>{isSettling ? "Opening..." : "Pay Now"}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.actionRow}>
          <View style={[styles.incomingBadge, { flex: 1 }]}>
            <Text style={styles.incomingText}>💰 Payment incoming</Text>
          </View>
          <TouchableOpacity
            style={[styles.recordBtn, { marginLeft: 12 }]}
            onPress={() => router.push({
              pathname: "/new/settlement",
              params: { 
                toUserId: transaction.fromUserId, 
                amount: transaction.amount.toString(),
                direction: "THEY_PAID"
              }
            })}
          >
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={[styles.recordBtnText, { color: colors.success }]}>Settle</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
});
