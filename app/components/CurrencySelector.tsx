import { useState, useEffect } from "react";
import { apiGet } from "@/lib/api";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";

interface Currency {
  code: string;
  symbol: string;
  name: string;
}

interface CurrencySelectorProps {
  selectedCurrency: string;
  onSelect: (currency: string) => void;
  compact?: boolean;
}

export default function CurrencySelector({
  selectedCurrency,
  onSelect,
  compact = false,
}: CurrencySelectorProps) {
  const { colors, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [filteredCurrencies, setFilteredCurrencies] = useState<Currency[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch currencies from API - DISABLED per user request
  useEffect(() => {
    const defaultCurrencies: Currency[] = [
      { code: "INR", symbol: "₹", name: "Indian Rupee" },
      { code: "USD", symbol: "$", name: "US Dollar" },
      { code: "EUR", symbol: "€", name: "Euro" },
      { code: "GBP", symbol: "£", name: "British Pound" },
      { code: "JPY", symbol: "¥", name: "Japanese Yen" },
      { code: "AUD", symbol: "A$", name: "Australian Dollar" },
      { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
      { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
      { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
      { code: "SEK", symbol: "kr", name: "Swedish Krona" },
      { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
      { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
      { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
      { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
      { code: "THB", symbol: "฿", name: "Thai Baht" },
      { code: "KRW", symbol: "₩", name: "South Korean Won" },
      { code: "RUB", symbol: "₽", name: "Russian Ruble" },
      { code: "ZAR", symbol: "R", name: "South African Rand" },
      { code: "BRL", symbol: "R$", name: "Brazilian Real" },
      { code: "MXN", symbol: "Mex$", name: "Mexican Peso" },
      { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
      { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
      { code: "TRY", symbol: "₺", name: "Turkish Lira" },
      { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
    ];
    setCurrencies(defaultCurrencies);
    setFilteredCurrencies(defaultCurrencies);
  }, []);

  // Filter currencies based on search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCurrencies(currencies);
    } else {
      const filtered = currencies.filter(
        (c) =>
          c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCurrencies(filtered);
    }
  }, [searchQuery, currencies]);

  async function fetchCurrencies() {
    // Disabled
  }

  const selectedCurrencyData = currencies.find((c) => c.code === selectedCurrency);

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={compact ? {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 4,
        } : {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: isDark ? "#1e293b" : "#F3F4F6",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: isDark ? "#334155" : "#E5E7EB",
        }}
      >
        <Text style={{ fontSize: compact ? 24 : 20, marginRight: compact ? 4 : 8, fontWeight: compact ? 'bold' : 'normal', color: colors.primary }}>
          {selectedCurrencyData?.symbol || selectedCurrency}
        </Text>
        {!compact && (
          <Text
            style={{
              flex: 1,
              fontSize: 16,
              fontWeight: "600",
              color: colors.text,
            }}
          >
            {selectedCurrency}
          </Text>
        )}
        <Ionicons name="chevron-down" size={compact ? 16 : 20} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: "80%",
              paddingTop: 20,
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 20,
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  flex: 1,
                  fontSize: 20,
                  fontWeight: "bold",
                  color: colors.text,
                }}
              >
                Select Currency
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isDark ? "#1e293b" : "#F3F4F6",
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  borderWidth: 1,
                  borderColor: isDark ? "#334155" : "#E5E7EB",
                }}
              >
                <Ionicons
                  name="search"
                  size={20}
                  color={colors.textTertiary}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search currency..."
                  placeholderTextColor={colors.textTertiary}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    fontSize: 16,
                    color: colors.text,
                  }}
                />
              </View>
            </View>

            {/* Currency List */}
            {loading ? (
              <View style={{ padding: 40, alignItems: "center" }}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <FlatList
                data={filteredCurrencies}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      onSelect(item.code);
                      setModalVisible(false);
                      setSearchQuery("");
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 20,
                      paddingVertical: 16,
                      backgroundColor:
                        selectedCurrency === item.code
                          ? isDark
                            ? "#1e293b"
                            : "#F3F4F6"
                          : "transparent",
                    }}
                  >
                    <Text style={{ fontSize: 24, marginRight: 12 }}>
                      {item.symbol}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: colors.text,
                        }}
                      >
                        {item.code}
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          color: colors.textSecondary,
                          marginTop: 2,
                        }}
                      >
                        {item.name}
                      </Text>
                    </View>
                    {selectedCurrency === item.code && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={{ padding: 40, alignItems: "center" }}>
                    <Text style={{ color: colors.textSecondary }}>
                      No currencies found
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
