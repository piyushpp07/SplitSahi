import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";

export default function TermsOfService() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: colors.surface, padding: 10, borderRadius: 12, marginRight: 16 }}>
          <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>Terms of Service</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ color: colors.text, fontSize: 16, lineHeight: 24, marginBottom: 16 }}>
          Last Updated: February 9, 2026
        </Text>
        <Text style={{ color: colors.text, fontSize: 14, lineHeight: 22 }}>
          By accessing or using SplitItUp, you agree to be bound by these terms.
          {"\n\n"}
          <Text style={{ fontWeight: 'bold' }}>1. Acceptance of Terms</Text>
          {"\n"}
          SplitItUp provides a platform for managing shared expenses. By creating an account, you represent that you are at least 18 years old or are using the app under the supervision of a parent or guardian.
          {"\n\n"}
          <Text style={{ fontWeight: 'bold' }}>2. User Responsibilities</Text>
          {"\n"}
          You are responsible for:
          - Maintaining the confidentiality of your account password.
          - The accuracy of all expense and settlement data you enter.
          - Ensuring your UPI ID is correct for receiving payments.
          {"\n\n"}
          <Text style={{ fontWeight: 'bold' }}>3. Payments and UPI</Text>
          {"\n"}
          SplitItUp facilitates payment tracking and provides deep links to UPI apps. We are NOT a payment processor. Any financial transactions occur directly between users via third-party UPI applications. We are not responsible for failed transactions or incorrect payments.
          {"\n\n"}
          <Text style={{ fontWeight: 'bold' }}>4. Prohibited Conduct</Text>
          {"\n"}
          You agree not to use the app for any illegal purposes, including money laundering or fraudulent expense reporting.
          {"\n\n"}
          <Text style={{ fontWeight: 'bold' }}>5. Limitation of Liability</Text>
          {"\n"}
          In no event shall SplitSahi be liable for any damages (including, without limitation, damages for loss of data or profit) arising out of the use or inability to use our services.
          {"\n\n"}
          We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
