import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiDelete, API_URL } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "@/contexts/ThemeContext";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useState, useMemo } from "react";

interface Expense {
  id: string;
  title: string;
  totalAmount: number;
  currency: string;
  category: string;
  createdAt: string;
  creator: { id: string; name: string };
}

const CATEGORY_ICONS: Record<string, any> = {
  food: "fast-food",
  shopping: "cart",
  travel: "airplane",
  bills: "receipt",
  entertainment: "tv",
  other: "ellipsis-horizontal",
};

export default function ExpensesScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const token = useAuthStore.getState().token;

  const { data: expenses, isLoading, error } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => apiGet<Expense[]>("/expenses"),
  });

  const filteredExpenses = useMemo(() =>
    (expenses ?? []).filter(e =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase())
    ),
    [expenses, search]
  );

  async function handleExport() {
    setExporting(true);
    try {
      const fileUri = ((FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory) + "expenses_report.csv";
      const { uri } = await FileSystem.downloadAsync(
        `${API_URL}/expenses/export`,
        fileUri,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("Success", "CSV file saved to " + uri);
      }
    } catch (e) {
      Alert.alert("Export Failed", "Could not generate report");
    } finally {
      setExporting(false);
    }
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Loading expenses...</Text>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      marginBottom: 32,
      marginTop: 16,
    },
    subtitle: {
      color: colors.textTertiary,
      fontSize: 12,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: 2,
      marginBottom: 4,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.text,
      letterSpacing: -1,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 24,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    icon: {
      height: 48,
      width: 48,
      borderRadius: 16,
      backgroundColor: colors.surfaceActive,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    itemTitle: {
      color: colors.text,
      fontWeight: 'bold',
      fontSize: 18,
      letterSpacing: -0.5,
    },
    categoryBadge: {
      backgroundColor: colors.surfaceActive,
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      marginTop: 4,
    },
    categoryText: {
      color: colors.textTertiary,
      fontSize: 10,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    amount: {
      color: colors.text,
      fontWeight: 'bold',
      fontSize: 20,
      letterSpacing: -1,
      marginRight: 12,
    },
    decimal: {
      color: colors.textTertiary,
      fontSize: 14,
      fontWeight: 'bold',
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    dateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dateText: {
      color: colors.textTertiary,
      fontSize: 10,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    creatorBadge: {
      backgroundColor: colors.surfaceActive,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    creatorText: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: 'bold',
      textTransform: 'uppercase',
    },
    emptyState: {
      paddingVertical: 80,
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
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
      fontSize: 12,
      marginTop: 4,
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredExpenses}
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={5}
        initialNumToRender={10}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <View>
                    <Text style={styles.subtitle}>Audit Trail</Text>
                    <Text style={styles.title}>Expenditure</Text>
                </View>
                <TouchableOpacity 
                    onPress={handleExport}
                    disabled={exporting}
                    style={{ 
                        backgroundColor: colors.surface, 
                        height: 44, width: 44, borderRadius: 22, 
                        alignItems: 'center', justifyContent: 'center',
                        borderWidth: 1, borderColor: colors.border
                    }}
                >
                    {exporting ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="download-outline" size={22} color={colors.textSecondary} />}
                </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={{ 
                backgroundColor: colors.surface, 
                borderRadius: 16, 
                paddingHorizontal: 16, 
                marginTop: 16,
                flexDirection: 'row', 
                alignItems: 'center', 
                borderWidth: 1, 
                borderColor: colors.border,
                height: 50,
            }}>
              <Ionicons name="search" size={20} color={colors.textTertiary} />
              <TextInput
                style={{ flex: 1, marginLeft: 12, color: colors.text, fontSize: 16 }}
                placeholder="Search by title or category..."
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="card-outline" size={32} color={colors.textSecondary} />
            </View>
            <Text style={styles.emptyText}>No Records</Text>
            <Text style={styles.emptySubtext}>Add an expense to track it here</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isCreator = item.creator.id === useAuthStore.getState().user?.id;
          
          async function handleDelete() {
            Alert.alert("Delete Expense", "Are you sure? This will remove the expense for everyone.", [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: async () => {
                try {
                  await apiDelete(`/expenses/${item.id}`);
                  queryClient.invalidateQueries({ queryKey: ["expenses"] });
                  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
                } catch (e) {
                  Alert.alert("Error", "Could not delete expense");
                }
              }}
            ]);
          }

          return (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={styles.icon}>
                    <Ionicons 
                      name={(CATEGORY_ICONS[item.category?.toLowerCase()] || "cash-outline") as any} 
                      size={20} 
                      color={colors.textSecondary} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.amount}>
                    ₹{Number(item.totalAmount).toFixed(0)}
                    <Text style={styles.decimal}>.{Number(item.totalAmount).toFixed(2).split('.')[1]}</Text>
                  </Text>
                  {isCreator && (
                    <TouchableOpacity onPress={handleDelete}>
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <View style={styles.footer}>
                <View style={styles.dateContainer}>
                  <Ionicons name="calendar-outline" size={12} color={colors.textTertiary} style={{ marginRight: 8 }} />
                  <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={styles.creatorBadge}>
                  <Text style={styles.creatorText}>{item.creator.name}</Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
