import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiGet, apiPost } from "@/lib/api";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";

interface Friend {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

import EmojiPicker from "@/components/EmojiPicker";

export default function CreateGroupScreen() {
  const { colors, isDark } = useTheme();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: friends, isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: () => apiGet<Friend[]>("/friendships"),
  });

  const toggleFriend = (id: string) => {
    setSelectedFriends(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  const filteredFriends = friends?.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter a group name");
      return;
    }
    setLoading(true);
    try {
      await apiPost("/groups", {
        name: name.trim(),
        description: description.trim() || undefined,
        emoji: emoji || undefined,
        memberIds: selectedFriends,
      });
      Alert.alert("Success", "Group created successfully!");
      router.replace("/(tabs)/groups");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to create group");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, paddingHorizontal: 20 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, marginTop: 16 }}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ 
              height: 40, width: 40, borderRadius: 12, 
              backgroundColor: colors.surface, 
              alignItems: 'center', justifyContent: 'center', 
              marginRight: 16,
              borderWidth: 1,
              borderColor: colors.border
            }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>New Group</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Emoji Selection */}
          <View style={{ marginBottom: 32, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => setShowEmojiPicker(true)}
              style={{
                height: 80,
                width: 80,
                borderRadius: 40,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: colors.primary,
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 40 }}>{emoji || "🎉"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowEmojiPicker(true)}>
              <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 13 }}>
                {emoji ? "Change Icon" : "Add Group Icon"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginBottom: 24 }}>
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>Group Name</Text>
              <TextInput
                style={{ 
                  backgroundColor: colors.surface, 
                  borderRadius: 12, 
                  padding: 16, 
                  color: colors.text, 
                  borderWidth: 1, 
                  borderColor: colors.border 
                }}
                placeholder="e.g. Goa Trip, Apartment 404"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>Description (Optional)</Text>
              <TextInput
                style={{ 
                  backgroundColor: colors.surface, 
                  borderRadius: 12, 
                  padding: 16, 
                  color: colors.text, 
                  borderWidth: 1, 
                  borderColor: colors.border,
                  minHeight: 80
                }}
                placeholder="What's this group for?"
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: 'bold', marginBottom: 12 }}>Add Members</Text>
            
            {/* Friend Search Input */}
            <View style={{ marginBottom: 16 }}>
               <View style={{ 
                backgroundColor: colors.surface, 
                borderRadius: 12, 
                borderWidth: 1, 
                borderColor: colors.border, 
                paddingHorizontal: 12, 
                paddingVertical: 8, 
                flexDirection: 'row', 
                alignItems: 'center' 
              }}>
                <Ionicons name="search" size={16} color={colors.textTertiary} style={{ marginRight: 8 }} />
                <TextInput
                  style={{ flex: 1, padding: 4, color: colors.text, fontSize: 14 }}
                  placeholder="Search friends..."
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>

            {isLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : friends && friends.length > 0 ? (
              <View style={{ gap: 8 }}>
                {filteredFriends.length > 0 ? (
                  filteredFriends.map((item) => {
                    const isSelected = selectedFriends.includes(item.id);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => toggleFriend(item.id)}
                        style={{ 
                          backgroundColor: colors.surface, 
                          borderRadius: 12, 
                          padding: 12, 
                          flexDirection: 'row', 
                          alignItems: 'center', 
                          borderWidth: 1, 
                          borderColor: isSelected ? colors.primary : colors.border 
                        }}
                      >
                        <View style={{ 
                          height: 36, width: 36, borderRadius: 18, 
                          backgroundColor: colors.surfaceActive, 
                          alignItems: 'center', justifyContent: 'center', 
                          marginRight: 12 
                        }}>
                          <Ionicons name="person" size={16} color={colors.textSecondary} />
                        </View>
                        <Text style={{ color: colors.text, flex: 1 }}>{item.name}</Text>
                        <View style={{ 
                          height: 24, width: 24, borderRadius: 12, 
                          alignItems: 'center', justifyContent: 'center', 
                          borderWidth: 1, 
                          borderColor: isSelected ? colors.primary : colors.textTertiary,
                          backgroundColor: isSelected ? colors.primary : 'transparent'
                        }}>
                          {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={{ padding: 16, alignItems: 'center' }}>
                     <Text style={{ color: colors.textSecondary }}>No matching friends found</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={{ 
                backgroundColor: colors.surface, 
                borderRadius: 12, 
                padding: 24, 
                borderWidth: 1, 
                borderColor: colors.border, 
                borderStyle: 'dashed', 
                alignItems: 'center' 
              }}>
                <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center' }}>No friends yet. Add friends to include them in groups.</Text>
                <TouchableOpacity 
                  onPress={() => router.push("/new/friend")}
                  style={{ marginTop: 12 }}
                >
                  <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 14 }}>Add a Friend</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={{ 
              height: 56, 
              borderRadius: 12, 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: 40,
              backgroundColor: loading ? colors.surfaceActive : colors.primary,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4
            }}
            onPress={handleCreate}
            disabled={loading}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
              {loading ? "Creating..." : "Create Group"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <EmojiPicker
        visible={showEmojiPicker}
        onSelect={(selected) => setEmoji(selected)}
        onClose={() => setShowEmojiPicker(false)}
      />
    </SafeAreaView>
  );
}
