import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";

export default function PrivacyPolicy() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: colors.surface, padding: 10, borderRadius: 12, marginRight: 16 }}>
          <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>Privacy Policy</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ color: colors.text, fontSize: 16, lineHeight: 24, marginBottom: 16 }}>
          Last Updated: February 9, 2026
        </Text>
        <Text style={{ color: colors.text, fontSize: 14, lineHeight: 22 }}>
          Your privacy is important to us. It is SplitItUp's policy to respect your privacy regarding any information we may collect from you through our app.
          {"\n\n"}
          <Text style={{ fontWeight: 'bold' }}>1. Information we collect</Text>
          {"\n"}
          We only ask for personal information (such as your name, email, and UPI ID) when we truly need it to provide you with the expense sharing service. We collect it by fair and lawful means, with your knowledge and consent.
          {"\n\n"}
          <Text style={{ fontWeight: 'bold' }}>2. Use of Information</Text>
          {"\n"}
          The information we collect is used to:
          - Identify you in shared expenses and groups.
          - Facilitate payments via UPI deep links.
          - Send verification codes and reminders.
          - Improve our app's user experience.
          {"\n\n"}
          <Text style={{ fontWeight: 'bold' }}>3. Data Retention</Text>
          {"\n"}
          We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.
          {"\n\n"}
          <Text style={{ fontWeight: 'bold' }}>4. Third-party Sharing</Text>
          {"\n"}
          We do not share any personally identifying information publicly or with third-parties, except when required to by law.
          {"\n\n"}
          Your continued use of our app will be regarded as acceptance of our practices around privacy and personal information. If you have any questions about how we handle user data and personal information, feel free to contact us.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
