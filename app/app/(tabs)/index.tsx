import { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking, Alert, TextInput, RefreshControl, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { router, useFocusEffect } from "expo-router";

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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <Ionicons name="wallet" size={32} color="#38bdf8" />
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
          <Ionicons name="cloud-offline" size={48} color="#ef4444" />
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
  
  const filteredTransactions = transactions.filter(t => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    const fromName = t.fromUser?.name || "";
    const toName = t.toUser?.name || "";
    
    return (
      fromName.toLowerCase().includes(searchLower) ||
      toName.toLowerCase().includes(searchLower)
    );
  });

  async function openUPIPay(transaction: typeof transactions[0]) {
    const toUser = transaction.toUser;
    if (!toUser?.upiId) {
      Alert.alert("No UPI ID", `${toUser?.name} hasn't added their UPI ID yet.`);
      return;
    }
    
    setSettling(`${transaction.fromUserId}-${transaction.toUserId}`);
    const upiUrl = `upi://pay?pa=${encodeURIComponent(toUser.upiId)}&pn=${encodeURIComponent(toUser.name)}&am=${transaction.amount}&cu=INR&tn=SplitSahiSe%20Settlement`;
    
    try {
      await Linking.openURL(upiUrl);
    } catch {
      Alert.alert("Error", "Could not open UPI app");
    } finally {
      setSettling(null);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#38bdf8" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{userName?.split(' ')[0] || 'User'} 👋</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={[styles.headerBtn, showSearch && styles.headerBtnActive]}
              onPress={() => setShowSearch(!showSearch)}
            >
              <Ionicons name="search" size={18} color={showSearch ? "#020617" : "#94a3b8"} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerBtn}
              onPress={() => router.push("/friends")}
            >
              <Ionicons name="people" size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>
        
        {showSearch && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={16} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search transactions..."
              placeholderTextColor="#64748b"
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={18} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Net Balance</Text>
          <Text style={[styles.balanceAmount, netBalance >= 0 ? styles.positive : styles.negative]}>
            {netBalance >= 0 ? '+' : ''}₹{Math.abs(netBalance).toFixed(2)}
          </Text>
          
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <View style={styles.balanceIconRed}>
                <Ionicons name="arrow-down" size={14} color="#f87171" />
              </View>
              <View>
                <Text style={styles.balanceItemLabel}>You Owe</Text>
                <Text style={styles.balanceItemValue}>₹{youOwe.toFixed(0)}</Text>
              </View>
            </View>
            <View style={styles.balanceItem}>
              <View style={styles.balanceIconGreen}>
                <Ionicons name="arrow-up" size={14} color="#10b981" />
              </View>
              <View>
                <Text style={styles.balanceItemLabel}>You Get</Text>
                <Text style={styles.balanceItemValue}>₹{youAreOwed.toFixed(0)}</Text>
              </View>
            </View>
          </View>
        </View>

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
                <Ionicons name="chevron-forward" size={14} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>

          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="checkmark-circle" size={40} color="#10b981" />
              </View>
              <Text style={styles.emptyTitle}>All Settled! 🎉</Text>
              <Text style={styles.emptySubtitle}>No pending payments</Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {filteredTransactions.map((t) => {
                const isPayer = userId === t.fromUserId;
                const isSettling = settling === `${t.fromUserId}-${t.toUserId}`;
                
                return (
                  <View key={`${t.fromUserId}-${t.toUserId}`} style={styles.transactionCard}>
                    <View style={styles.transactionHeader}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{t.fromUser?.name?.charAt(0)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.transactionName}>
                          {t.fromUserId === userId ? "You" : t.fromUser?.name}
                        </Text>
                        <Text style={styles.transactionSubtext}>
                          owes {t.toUserId === userId ? "You" : t.toUser?.name}
                        </Text>
                      </View>
                      <Text style={styles.transactionAmount}>₹{t.amount.toFixed(0)}</Text>
                    </View>
                    
                    {isPayer && (
                      <View style={styles.actionRow}>
                        <TouchableOpacity
                          style={styles.recordBtn}
                          onPress={() => router.push({
                            pathname: "/new/settlement",
                            params: { toUserId: t.toUserId, amount: t.amount.toString() }
                          })}
                        >
                          <Ionicons name="receipt" size={16} color="#94a3b8" />
                          <Text style={styles.recordBtnText}>Record</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.payBtn, isSettling && styles.payBtnDisabled]}
                          onPress={() => openUPIPay(t)}
                          disabled={isSettling}
                        >
                          <Ionicons name="flash" size={16} color="#020617" />
                          <Text style={styles.payBtnText}>{isSettling ? "Opening..." : "Pay Now"}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    {!isPayer && (
                      <View style={styles.incomingBadge}>
                        <Text style={styles.incomingText}>💰 Payment incoming</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIcon: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    padding: 16,
    borderRadius: 50,
    marginBottom: 16,
  },
  loadingText: {
    color: '#fff',
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
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: 'bold',
  },
  retryButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  retryText: {
    color: '#ef4444',
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
    color: '#64748b',
    fontSize: 12,
    fontWeight: 'normal',
  },
  userName: {
    color: '#fff',
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
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnActive: {
    backgroundColor: '#38bdf8',
  },
  searchContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 15,
  },
  balanceCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  balanceLabel: {
    color: '#64748b',
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
  },
  positive: {
    color: '#10b981',
  },
  negative: {
    color: '#ef4444',
  },
  balanceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  balanceItem: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  balanceIconRed: {
    backgroundColor: 'rgba(248, 113, 113, 0.2)',
    padding: 8,
    borderRadius: 10,
  },
  balanceIconGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    padding: 8,
    borderRadius: 10,
  },
  balanceItemLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  balanceItemValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#475569',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 12,
  },
  sectionTitleLarge: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    color: '#64748b',
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
    backgroundColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyBtnText: {
    color: '#64748b',
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
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    fontWeight: 'normal',
    marginTop: 2,
  },
  emptyState: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderStyle: 'dashed',
  },
  emptyIcon: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    padding: 16,
    borderRadius: 50,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptySubtitle: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 4,
  },
  transactionCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
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
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  transactionName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  transactionSubtext: {
    color: '#64748b',
    fontSize: 12,
  },
  transactionAmount: {
    color: '#10b981',
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
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  recordBtnText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  payBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#38bdf8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  payBtnDisabled: {
    backgroundColor: '#475569',
  },
  payBtnText: {
    color: '#020617',
    fontSize: 14,
    fontWeight: 'bold',
  },
  incomingBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  incomingText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
