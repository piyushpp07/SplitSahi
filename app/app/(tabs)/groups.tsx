import { useCallback, useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";

interface Group {
  id: string;
  name: string;
  description?: string | null;
  members: Array<{ user: { id: string; name: string; avatarUrl?: string } }>;
}

export default function GroupsScreen() {
  const { colors } = useTheme();
  const { data: groups, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["groups"],
    queryFn: () => apiGet<Group[]>("/groups"),
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [])
  );

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    header: {
      marginBottom: 24,
      marginTop: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    joinBtn: {
      backgroundColor: colors.surface,
      height: 40,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: colors.border,
    },
    joinBtnText: {
      color: colors.primary,
      fontWeight: 'bold',
      fontSize: 14,
      marginLeft: 6,
    },
    createBtn: {
      backgroundColor: colors.primary,
      height: 40,
      width: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    groupCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    groupIcon: {
      height: 48,
      width: 48,
      borderRadius: 16,
      backgroundColor: colors.surfaceActive,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    groupName: {
      color: colors.text,
      fontWeight: 'bold',
      fontSize: 16,
    },
    groupDesc: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    memberCount: {
      color: colors.textTertiary,
      fontSize: 12,
      marginTop: 4,
    },
    emptyState: {
      paddingVertical: 64,
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
    emptyTitle: {
      color: colors.text,
      fontWeight: 'bold',
      fontSize: 16,
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: 14,
      marginTop: 4,
    },
    emptyActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
    },
    emptyJoinBtn: {
      backgroundColor: colors.surface,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyCreateBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyCreateText: {
      color: '#fff',
      fontWeight: 'bold',
    }
  }), [colors]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: colors.textSecondary }}>Loading groups...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={groups ?? []}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={5}
        initialNumToRender={10}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Groups</Text>
              <Text style={styles.headerSubtitle}>Manage your shared expenses</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity 
                onPress={() => router.push("/join-group")}
                style={styles.joinBtn}
              >
                <Ionicons name="enter" size={18} color={colors.primary} />
                <Text style={styles.joinBtnText}>Join</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => router.push("/new/group")}
                style={styles.createBtn}
              >
                <Ionicons name="add" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="people-outline" size={32} color={colors.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>No groups yet</Text>
            <Text style={styles.emptyText}>Create a group to start splitting</Text>
            <View style={styles.emptyActions}>
              <TouchableOpacity 
                onPress={() => router.push("/join-group")}
                style={styles.emptyJoinBtn}
              >
                <Ionicons name="enter" size={18} color={colors.primary} />
                <Text style={styles.joinBtnText}>Join Group</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => router.push("/new/group")}
                style={styles.emptyCreateBtn}
              >
                <Text style={styles.emptyCreateText}>Create Group</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => router.push(`/group/${item.id}`)}
            style={styles.groupCard}
          >
            <View style={styles.groupIcon}>
              <Ionicons name="people" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.groupName}>{item.name}</Text>
              {item.description && (
                <Text style={styles.groupDesc} numberOfLines={1}>{item.description}</Text>
              )}
              <Text style={styles.memberCount}>{item.members.length} members</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
