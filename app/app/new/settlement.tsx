import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiGet, apiPost } from "@/lib/api";
import { router, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { notifySettlement } from "@/lib/notifications";
import { useTheme } from "@/contexts/ThemeContext";
import QRCode from "react-native-qrcode-svg";
import * as Linking from "expo-linking";
import { View as RNView } from "react-native";

interface Friend {
  id: string;
  name: string;
}

export default function AddSettlementScreen() {
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams<{ toUserId?: string; amount?: string; groupId?: string; direction?: string }>();
  const [toUserId, setToUserId] = useState<string | null>(params.toUserId || null);
  const [direction, setDirection] = useState<"YOU_PAID" | "THEY_PAID">((params.direction as any) || "YOU_PAID");
  const [amount, setAmount] = useState(params.amount || "");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "OTHER">("CASH");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  
  const queryClient = useQueryClient();

  const { data: friends, isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: () => apiGet<Friend[]>("/friendships"),
  });

  async function handleSettle() {
    if (!toUserId || !amount) {
      Alert.alert("Missing Info", "Please select a friend and enter amount");
      return;
    }

    const recipient = friends?.find(f => f.id === toUserId);

    setLoading(true);
    try {
      const payload = {
        fromUserId: direction === "YOU_PAID" ? currentUser?.id : toUserId,
        toUserId: direction === "YOU_PAID" ? toUserId : currentUser?.id,
        amount: parseFloat(amount),
        paymentMethod,
        notes: notes || undefined,
        groupId: params.groupId || undefined,
      };

      await apiPost("/settlements", payload);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
      
      notifySettlement(currentUser?.name || "You", recipient?.name || "Friend", parseFloat(amount));
      
      Alert.alert("Success", "Payment recorded successfully!");
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to record payment");
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
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>Record Payment</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Recipient Selection */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: 'bold', marginBottom: 12 }}>Select Friend</Text>
            {loadingFriends ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                {friends?.map((f) => {
                  const isSelected = toUserId === f.id;
                  return (
                    <TouchableOpacity
                      key={f.id}
                      onPress={() => setToUserId(f.id)}
                      style={{ 
                        paddingHorizontal: 20, paddingVertical: 12, 
                        borderRadius: 12, marginRight: 12, 
                        borderWidth: 1, 
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                        alignItems: 'center'
                      }}
                    >
                      <View style={{ 
                        height: 32, width: 32, borderRadius: 16, 
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : colors.surfaceActive, 
                        alignItems: 'center', justifyContent: 'center', 
                        marginBottom: 8 
                      }}>
                         <Text style={{ fontSize: 12, fontWeight: 'bold', color: isSelected ? '#fff' : colors.text }}>{f.name[0]}</Text>
                      </View>
                      <Text style={{ fontWeight: 'bold', fontSize: 12, color: isSelected ? '#fff' : colors.textSecondary }}>
                        {f.name.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
            {!loadingFriends && !friends?.length && (
              <Text style={{ color: colors.textTertiary, fontSize: 14, fontStyle: 'italic' }}>Add friends first to record payments with them.</Text>
            )}
          </View>

          {/* Direction Toggle */}
          {toUserId && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: 'bold', marginBottom: 12 }}>Direction</Text>
              <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 4 }}>
                <TouchableOpacity 
                  onPress={() => setDirection("YOU_PAID")}
                  style={{ 
                    flex: 1, paddingVertical: 12, borderRadius: 8, 
                    backgroundColor: direction === "YOU_PAID" ? colors.primary : 'transparent',
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ fontWeight: 'bold', color: direction === "YOU_PAID" ? '#fff' : colors.textSecondary }}>You paid them</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setDirection("THEY_PAID")}
                  style={{ 
                    flex: 1, paddingVertical: 12, borderRadius: 8, 
                    backgroundColor: direction === "THEY_PAID" ? colors.primary : 'transparent',
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ fontWeight: 'bold', color: direction === "THEY_PAID" ? '#fff' : colors.textSecondary }}>They paid you</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Amount */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>Amount Paid</Text>
            <View style={{ 
              backgroundColor: colors.surface, 
              borderRadius: 12, 
              paddingHorizontal: 16, 
              paddingVertical: 16, // Consistent padding for height
              flexDirection: 'row', 
              alignItems: 'center', 
              borderWidth: 1, 
              borderColor: colors.border 
            }}>
              <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 24, marginRight: 8 }}>₹</Text>
              <TextInput
                style={{ flex: 1, color: colors.text, fontSize: 30, fontWeight: 'bold' }}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Method */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: 'bold', marginBottom: 12 }}>Payment Method</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {[
                { key: "CASH", label: "Cash", icon: "cash" },
                { key: "UPI", label: "UPI", icon: "flash" },
                { key: "OTHER", label: "Other", icon: "card" }
              ].map((m) => {
                const isSelected = paymentMethod === m.key;
                return (
                  <TouchableOpacity
                    key={m.key}
                    onPress={() => setPaymentMethod(m.key as any)}
                    style={{ 
                      flex: 1, paddingVertical: 14, 
                      borderRadius: 12, borderWidth: 1, 
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
                      gap: 8,
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected ? colors.primary : colors.surface
                    }}
                  >
                    <Ionicons name={m.icon as any} size={16} color={isSelected ? "#fff" : colors.textSecondary} />
                    <Text style={{ fontWeight: 'bold', fontSize: 12, color: isSelected ? '#fff' : colors.textSecondary }}>{m.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Notes */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>Note (Optional)</Text>
            <TextInput
              style={{ 
                backgroundColor: colors.surface, 
                borderRadius: 12, 
                padding: 16, 
                color: colors.text, 
                borderWidth: 1, 
                borderColor: colors.border,
                fontSize: 14
              }}
              placeholder="Add details..."
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          {/* Differentiator: UPI QR & WhatsApp */}
          {toUserId && direction === "THEY_PAID" && amount && parseFloat(amount) > 0 && (
            <View style={{ 
              backgroundColor: colors.surface, borderRadius: 20, padding: 20, marginBottom: 32, 
              borderWidth: 1, borderColor: colors.primary + '30', alignItems: 'center' 
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 }}>
                <Ionicons name="qr-code-outline" size={18} color={colors.primary} />
                <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14 }}>Share Payment Request</Text>
              </View>

              {currentUser?.upiId ? (
                <>
                  <View style={{ 
                    padding: 16, backgroundColor: '#fff', borderRadius: 16, 
                    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 
                  }}>
                    <QRCode
                      value={`upi://pay?pa=${currentUser.upiId}&pn=${encodeURIComponent(currentUser.name)}&am=${parseFloat(amount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(notes || "SplitSahi")}`}
                      size={150}
                      color="#000"
                      backgroundColor="#fff"
                    />
                  </View>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 12 }}>Scan this to pay {currentUser.name}</Text>
                </>
              ) : (
                <TouchableOpacity 
                   onPress={() => router.push("/edit-profile")}
                   style={{ padding: 16, alignItems: 'center' }}
                >
                  <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 12, textAlign: 'center' }}>
                    Add your UPI ID in Profile to generate QR codes!
                  </Text>
                </TouchableOpacity>
              )}

              <View style={{ height: 1, backgroundColor: colors.border, width: '100%', marginVertical: 20 }} />

              <TouchableOpacity 
                onPress={() => {
                  const recipient = friends?.find(f => f.id === toUserId);
                  const msg = `Hi ${recipient?.name}, just a reminder for the payment of ₹${amount} on SplitSahi${notes ? ': ' + notes : ''}. You can pay directly via UPI: upi://pay?pa=${currentUser?.upiId || ''}&am=${amount}`;
                  Linking.openURL(`whatsapp://send?text=${encodeURIComponent(msg)}`);
                }}
                style={{ 
                  flexDirection: 'row', alignItems: 'center', gap: 8, 
                  backgroundColor: '#25D366', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 
                }}
              >
                <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Send WhatsApp Reminder</Text>
              </TouchableOpacity>
            </View>
          )}

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
            onPress={handleSettle}
            disabled={loading}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
              {loading ? "Recording..." : "Record Payment"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
