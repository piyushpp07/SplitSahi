import { useState, useCallback, useMemo } from "react";
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, TextInput, LayoutAnimation, StyleSheet, Platform, UIManager } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ActivityItem {
  type: "expense" | "settlement";
  id: string;
  createdAt: string;
  data: any;
}

type FilterType = "all" | "expenses" | "settlements";

export default function ActivityScreen() {
  const { colors, isDark } = useTheme();
  const userId = useAuthStore((s) => s.user?.id);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["activity"],
    queryFn: () => apiGet<{ activities: ActivityItem[] }>("/activity"),
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [])
  );

  const activities = data?.activities || [];
  
  const filteredActivities = useMemo(() => 
    activities.filter(item => {
      // 1. Filter by Type
      if (filter === "expenses" && item.type !== "expense") return false;
      if (filter === "settlements" && item.type !== "settlement") return false;

      // 2. Filter by Search
      if (!search) return true;
      const q = search.toLowerCase();
      
      if (item.type === "expense") {
        return (
          item.data.title?.toLowerCase().includes(q) || 
          item.data.creator?.name?.toLowerCase().includes(q) ||
          item.data.group?.name?.toLowerCase().includes(q) ||
          item.data.totalAmount?.toString().includes(q)
        );
      } else {
         // Settlement
         return (
           item.data.fromUser?.name?.toLowerCase().includes(q) ||
           item.data.toUser?.name?.toLowerCase().includes(q) ||
           item.data.amount?.toString().includes(q)
         );
      }
    }),
    [activities, filter, search]
  );

  function handlePress(item: ActivityItem) {
    if (item.type === "expense") {
      router.push(`/expense/${item.id}`);
    }
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + 
           `, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  const styles = useMemo(() => StyleSheet.create({
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
    headerTitle: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.text,
      letterSpacing: -1,
      fontStyle: 'italic',
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    iconBtn: {
      height: 40,
      width: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchContainer: {
      marginBottom: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      height: 48,
    },
    searchInput: {
      flex: 1,
      marginLeft: 8,
      color: colors.text,
      fontSize: 14,
    },
    filterContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 4,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterTab: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterText: {
      fontSize: 12,
      fontWeight: 'bold',
    },
    itemCard: {
      marginBottom: 12,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    itemIcon: {
      height: 40,
      width: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    itemContent: {
      flex: 1,
    },
    itemTitle: {
      color: colors.text,
      fontWeight: 'bold',
      fontSize: 14,
    },
    itemSubtitle: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    itemMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    amountContainer: {
      alignItems: 'flex-end',
    },
    amount: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    category: {
      color: colors.textSecondary,
      fontSize: 10,
      marginTop: 2,
      textTransform: 'uppercase',
      fontWeight: 'bold',
    },
    emptyState: {
      marginTop: 80,
      alignItems: 'center',
    },
    emptyIcon: {
      backgroundColor: colors.surfaceActive,
      padding: 24,
      borderRadius: 50,
      marginBottom: 16,
    },
    emptyText: {
      color: colors.textSecondary,
      fontWeight: 'bold',
      fontSize: 16,
    },
    emptySubtext: {
      color: colors.textTertiary,
      fontSize: 14,
      marginTop: 4,
    }
  }), [colors, isDark]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Activity</Text>
            <Text style={styles.headerSubtitle}>Your recent transactions</Text>
          </View>
          <TouchableOpacity 
            onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setShowSearch(!showSearch);
                if (showSearch) setSearch("");
              }}
            style={[
              styles.iconBtn, 
              { backgroundColor: showSearch ? colors.primary : colors.surface, borderWidth: 1, borderColor: showSearch ? colors.primary : colors.border }
            ]}
          >
            <Ionicons name="search" size={20} color={showSearch ? '#fff' : colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {showSearch && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search expenses..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {[
            { key: "all", label: "All" },
            { key: "expenses", label: "Expenses" },
            { key: "settlements", label: "Payments" },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setFilter(f.key as FilterType);
              }}
              style={[
                styles.filterTab,
                { backgroundColor: filter === f.key ? colors.surfaceActive : 'transparent' }
              ]}
            >
              <Text style={[
                styles.filterText,
                { color: filter === f.key ? colors.text : colors.textSecondary }
              ]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 80 }} />
        ) : (
          <FlatList
            data={filteredActivities}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            windowSize={5}
            initialNumToRender={10}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />
            }
            renderItem={({ item }) => {
              const isSettlement = item.type === "settlement";
              const amountColor = isSettlement ? colors.warning : colors.success;
              const iconColor = isSettlement ? colors.warning : colors.success;
              const iconBg = colors.surfaceActive; // Simple background for icons
              
              return (
                <TouchableOpacity 
                  style={styles.itemCard}
                  onPress={() => handlePress(item)}
                  activeOpacity={isSettlement ? 1 : 0.7}
                >
                  <View style={[styles.itemIcon, { backgroundColor: iconBg }]}>
                    <Ionicons 
                      name={isSettlement ? "swap-horizontal" : "receipt"} 
                      size={18} 
                      color={iconColor} 
                    />
                  </View>
                  
                  <View style={styles.itemContent}>
                    {isSettlement ? (
                      <>
                        <Text style={styles.itemTitle}>
                          {item.data.fromUser?.name} paid {item.data.toUser?.name}
                        </Text>
                        <Text style={styles.itemSubtitle}>{formatDate(item.createdAt)}</Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.itemTitle}>{item.data.title}</Text>
                        <View style={styles.itemMeta}>
                          <Text style={styles.itemSubtitle}>
                            {item.data.creator?.name} • {formatDate(item.createdAt)}
                          </Text>
                        </View>
                        {item.data.group && (
                          <View style={styles.itemMeta}>
                            <Ionicons name="people" size={10} color={colors.textTertiary} />
                            <Text style={[styles.itemSubtitle, { marginLeft: 4, fontSize: 10 }]}>{item.data.group.name}</Text>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                  
                  <View style={styles.amountContainer}>
                    <Text style={[styles.amount, { color: amountColor }]}>
                      ₹{Number(isSettlement ? item.data.amount : item.data.totalAmount).toFixed(0)}
                    </Text>
                    {!isSettlement && (
                      <Text style={styles.category}>{item.data.category}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="search" size={32} color={colors.textSecondary} />
                </View>
                <Text style={styles.emptyText}>{search ? "No results found" : "No activity yet"}</Text>
                <Text style={styles.emptySubtext}>{search ? "Try a different search term" : "Start adding expenses to see them here"}</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
