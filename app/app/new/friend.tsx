import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, ActivityIndicator, Platform, KeyboardAvoidingView, Share } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiGet, apiPost } from "@/lib/api";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import * as Contacts from "expo-contacts";

interface User {
  id: string;
  name: string;
  username?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

export default function AddFriendScreen() {
  const { colors, isDark } = useTheme();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  async function importFromContacts() {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Emails, Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
        });

        if (data.length > 0) {
          Alert.alert(
            "Contacts Synced", 
            "You can now search for your friends by name or phone number in the search bar above.",
            [{ text: "OK" }]
          );
        }
      } else {
          Alert.alert("Permission Denied", "We need contact permissions to help you find friends.");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to access contacts.");
    }
  }

  async function shareAppInvite() {
    const message = "Hey, let's split expenses easily on SplitItUp! Download now: https://splititup.app/download";
    try {
      await Share.share({
        message,
      });
    } catch (error) {
      console.log(error);
    }
  }

  async function searchUsers(text: string) {
    setQuery(text);
    if (text.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const users = await apiGet<User[]>(`/users/search?q=${encodeURIComponent(text)}`);
      setResults(users);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function addFriend(friendId: string) {
    setAddingId(friendId);
    try {
      await apiPost("/friendships", { friendId });
      Alert.alert("Success", "Friend added successfully!");
      router.replace("/friends");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to add friend");
    } finally {
      setAddingId(null);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, paddingHorizontal: 20 }}
      >
        {/* Header */}
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
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>Add Friend</Text>
        </View>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <TouchableOpacity 
             onPress={importFromContacts}
             style={{ 
               flex: 1, backgroundColor: colors.surface, 
               paddingVertical: 12, borderRadius: 12, 
               alignItems: 'center', justifyContent: 'center', 
               flexDirection: 'row', gap: 8, borderWidth: 1, borderColor: colors.border 
             }}
          >
            <Ionicons name="people-outline" size={18} color={colors.primary} />
            <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 12 }}>Contacts</Text>
          </TouchableOpacity>

          <TouchableOpacity 
             onPress={shareAppInvite}
             style={{ 
               flex: 1, backgroundColor: colors.surface, 
               paddingVertical: 12, borderRadius: 12, 
               alignItems: 'center', justifyContent: 'center', 
               flexDirection: 'row', gap: 8, borderWidth: 1, borderColor: colors.border
             }}
          >
            <Ionicons name="share-outline" size={18} color={colors.primary} />
            <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 12 }}>Invite Friend</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ 
            backgroundColor: colors.surface, 
            borderRadius: 12, 
            borderWidth: 1, 
            borderColor: colors.border, 
            paddingHorizontal: 12, 
            paddingVertical: 4, 
            flexDirection: 'row', 
            alignItems: 'center' 
          }}>
            <Ionicons name="search" size={20} color={colors.textTertiary} style={{ marginRight: 8 }} />
            <TextInput
              style={{ flex: 1, padding: 12, color: colors.text }}
              placeholder="Search by name, email or username"
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={searchUsers}
              autoFocus
              autoCapitalize="none"
            />
          </View>
        </View>

        {loading && <ActivityIndicator color={colors.primary} style={{ marginBottom: 16 }} />}

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={{ 
              backgroundColor: colors.surface, 
              borderRadius: 12, 
              padding: 16, 
              flexDirection: 'row', 
              alignItems: 'center', 
              marginBottom: 12, 
              borderWidth: 1, 
              borderColor: colors.border 
            }}>
              <View style={{ 
                height: 40, width: 40, borderRadius: 20, 
                backgroundColor: colors.surfaceActive, 
                alignItems: 'center', justifyContent: 'center', 
                marginRight: 12 
              }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.primary }}>{item.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14 }}>{item.name}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  {item.username ? `@${item.username}` : (item.email || item.phone || "User")}
                </Text>
              </View>
              <TouchableOpacity
                style={{ 
                  height: 36, paddingHorizontal: 16, 
                  borderRadius: 8, 
                  alignItems: 'center', justifyContent: 'center', 
                  backgroundColor: addingId === item.id ? colors.surfaceActive : colors.primary 
                }}
                onPress={() => addFriend(item.id)}
                disabled={addingId !== null}
              >
                {addingId === item.id ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' }}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            !loading && query.length >= 2 ? (
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <Text style={{ color: colors.textSecondary, fontWeight: 'bold' }}>No users found on SplitItUp</Text>
                <TouchableOpacity 
                   onPress={shareAppInvite}
                   style={{ marginTop: 12, backgroundColor: colors.primary + '20', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
                >
                   <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 12 }}>Invite them to join!</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
