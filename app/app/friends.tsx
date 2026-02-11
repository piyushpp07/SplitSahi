import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, LayoutAnimation, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiDelete } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";

interface Friend {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export default function FriendsScreen() {
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  
  const { data: friends, isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: () => apiGet<Friend[]>("/friendships"),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/friendships/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      Alert.alert("Removed", "Friend removed from your connections.");
    },
    onError: (e) => Alert.alert("Error", e.message),
  });

  function handleRemove(friend: Friend) {
    Alert.alert(
      "Remove Friend",
      `Are you sure you want to remove ${friend.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => removeMutation.mutate(friend.id) }
      ]
    );
  }

  // Filter friends based on search
  const filteredFriends = (friends ?? []).filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.email.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: colors.background,
      },
      header: {
        marginBottom: 24,
        marginTop: 16,
      },
      headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
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
      addBtn: {
        height: 40,
        width: 40,
        borderRadius: 12,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
      },
      headerSubtitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 4,
      },
      headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.text,
        letterSpacing: -1,
        fontStyle: 'italic',
      },
      searchContainer: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        paddingHorizontal: 16,
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        height: 50,
      },
      searchInput: {
        flex: 1,
        marginLeft: 12,
        color: colors.text,
        fontSize: 16,
      },
      listContainer: {
        paddingBottom: 100,
      },
      friendCard: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
      },
      avatar: {
        height: 48,
        width: 48,
        borderRadius: 16,
        backgroundColor: colors.surfaceActive,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: colors.border,
      },
      avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
      },
      friendInfo: {
        flex: 1,
      },
      friendName: {
        color: colors.text,
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 2,
      },
      friendEmail: {
        color: colors.textSecondary,
        fontSize: 11,
      },
      actionBtn: {
        height: 36,
        width: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
      },
      emptyState: {
        backgroundColor: colors.surface,
        borderRadius: 24,
        padding: 40,
        alignItems: 'center',
        marginTop: 16,
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: 'dashed',
      },
      emptyIcon: {
        backgroundColor: colors.surfaceActive,
        padding: 20,
        borderRadius: 40,
        marginBottom: 16,
      },
      emptyText: {
        color: colors.textSecondary,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontSize: 10,
        textAlign: 'center',
        marginBottom: 16,
      },
      emptyActionBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
      }
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity 
                onPress={() => {
                    const message = "Hey, let's split expenses easily on SplitItUp! Download now: https://splititup.app/download";
                    require("react-native").Share.share({ message });
                }}
                style={[styles.backBtn, { borderColor: colors.primary + '40' }]}
                >
                <Ionicons name="share-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity 
                onPress={() => router.push("/new/friend")}
                style={styles.addBtn}
                >
                <Ionicons name="add" size={22} color="#fff" />
                </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>Human Grid</Text>
          <Text style={styles.headerTitle}>Friends</Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search friends..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={(text) => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setSearch(text);
            }}
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

        <FlatList
          data={filteredFriends}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => router.push(`/friend/${item.id}`)}
              style={styles.friendCard}
              activeOpacity={0.7}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
              </View>
              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{item.name}</Text>
                <Text style={styles.friendEmail}>{item.email}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity 
                  onPress={() => handleRemove(item)}
                  style={[styles.actionBtn, { backgroundColor: colors.errorLight }]}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                </TouchableOpacity>
                <View style={[styles.actionBtn, { backgroundColor: colors.surfaceActive }]}>
                  <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={32} color={colors.textSecondary} />
              </View>
              <Text style={styles.emptyText}>
                {search ? "No friends match your search" : "No friends yet"}
              </Text>
              {!search && (
                <TouchableOpacity 
                  onPress={() => router.push("/new/friend")}
                  style={styles.emptyActionBtn}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Add Friend</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
