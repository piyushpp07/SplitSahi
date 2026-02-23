import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import Papa from "papaparse";
import { useQuery } from "@tanstack/react-query";

import { useTheme } from "@/contexts/ThemeContext";
import { apiGet, apiPost } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function SplitwiseImportScreen() {
  const { colors, isDark } = useTheme();
  const userId = useAuthStore((s) => s.user?.id);
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"UPLOAD" | "MAPPING" | "SUCCESS">("UPLOAD");
  
  const [csvData, setCsvData] = useState<any>(null);
  const [uniqueNames, setUniqueNames] = useState<{name: string, index: number}[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({}); // CSV name -> SahiSplit UserId or "SKIP"

  const { data: friends } = useQuery({
    queryKey: ["friends"],
    queryFn: () => apiGet<any[]>("/friendships"),
  });

  async function handleFileUpload() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "application/vnd.ms-excel", "text/comma-separated-values"],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      setLoading(true);
      const fileUri = result.assets[0].uri;
      const fileString = await FileSystem.readAsStringAsync(fileUri);

      Papa.parse(fileString, {
        header: false,
        skipEmptyLines: true,
        complete: (results: any) => {
          const data = results.data as string[][];
          if (data.length < 2) {
            Alert.alert("Error", "CSV file is empty or invalid format.");
            setLoading(false);
            return;
          }

          const headers = data[0];
          // Extrapolating Splitwise format: Date, Description, Category, Cost, Currency, Name1, Name1, ...
          const names: {name: string, index: number}[] = [];
          for (let i = 5; i < headers.length; i += 2) {
            if (headers[i]) {
              names.push({ name: headers[i], index: i });
            }
          }

          setCsvData({ headers, rows: data.slice(1) });
          setUniqueNames(names);
          
          // Pre-fill mapping with "Myself" if name contains user's name
          const userObj = useAuthStore.getState().user;
          const initialMapping: Record<string, string> = {};
          names.forEach(n => {
              if (userObj?.name && n.name.toLowerCase().includes(userObj.name.toLowerCase())) {
                  initialMapping[n.name] = userId || "SKIP";
              } else {
                  initialMapping[n.name] = "SKIP"; // default to skip
              }
          });
          setMapping(initialMapping);
          setStep("MAPPING");
          setLoading(false);
        },
        error: (error: any) => {
          Alert.alert("Parse Error", error.message);
          setLoading(false);
        }
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to read the file.");
      setLoading(false);
    }
  }

  async function handleImport() {
    try {
      setLoading(true);
      const expenses = [];

      for (const row of csvData.rows) {
        if (!row[0] || row[0].toLowerCase() === "total balance" || row[1] === "Total balance") continue;
        
        const date = row[0];
        const description = row[1];
        const category = row[2] || "Other";
        const totalAmount = parseFloat(row[3]);
        const currency = row[4] || "INR";

        if (isNaN(totalAmount)) continue;

        const payers: { userId: string, amountPaid: number }[] = [];
        const splits: { userId: string, amountOwed: number }[] = [];
        const participantIds = new Set<string>();

        for (const un of uniqueNames) {
          const mappedId = mapping[un.name];
          if (mappedId === "SKIP") continue;

          // Splitwise logic: un.index is "paid", un.index+1 is "owed/share"
          const paidStr = row[un.index];
          const owedStr = row[un.index + 1];
          
          const paidAmt = parseFloat(paidStr) || 0;
          const owedAmt = parseFloat(owedStr) || 0;

          if (paidAmt > 0) {
              payers.push({ userId: mappedId, amountPaid: paidAmt });
              participantIds.add(mappedId);
          }
          if (owedAmt > 0) {
              splits.push({ userId: mappedId, amountOwed: owedAmt });
              participantIds.add(mappedId);
          }
        }

        if (payers.length > 0 && splits.length > 0) {
            expenses.push({
                title: description,
                category: category,
                totalAmount: totalAmount,
                currency: currency,
                splitType: "EXACT",
                participantIds: Array.from(participantIds),
                payers: payers,
                splits: splits,
                date: new Date(date).toISOString(),
            });
        }
      }

      const res = await apiPost<{count: number, failed?: number}>("/expenses/bulk", { expenses });
      if (res.failed && res.failed > 0) {
        Alert.alert("Partial Import", `Imported ${res.count} expenses successfully. ${res.failed} expenses failed (likely due to rounding mismatches or bad data).`);
      } else {
        Alert.alert("Success", `Imported ${res.count} expenses successfully!`);
      }
      setStep("SUCCESS");
    } catch (e: any) {
      console.error(e);
      Alert.alert("Import Failed", e.message || "Failed to bulk import expenses.");
    } finally {
      setLoading(false);
    }
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
    backBtn: { height: 40, width: 40, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: 16, borderWidth: 1, borderColor: colors.border },
    title: { fontSize: 20, fontWeight: 'bold', color: colors.text },
    content: { flex: 1, paddingHorizontal: 20 },
    card: { backgroundColor: colors.card, padding: 24, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginTop: 20 },
    iconCont: { width: 64, height: 64, borderRadius: 32, backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
    cardSub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 },
    primaryBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    mappingRow: { flexDirection: 'column', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    mappingName: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
    mappingOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    mapChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    mapChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    mapChipText: { fontSize: 12, color: colors.textSecondary, fontWeight: 'bold' },
    mapChipTextActive: { color: '#fff', fontSize: 12, fontWeight: 'bold' }
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Import Data</Text>
      </View>

      <ScrollView style={styles.content}>
        {step === "UPLOAD" && (
          <View style={styles.card}>
            <View style={styles.iconCont}>
              <Ionicons name="document-text" size={32} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Splitwise CSV Export</Text>
            <Text style={styles.cardSub}>Upload your exported CSV file from Splitwise to migrate your expenses directly into SahiSplit.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleFileUpload} disabled={loading}>
              <Text style={styles.primaryBtnText}>{loading ? "Reading..." : "Select File"}</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === "MAPPING" && (
          <View>
            <Text style={{fontSize: 14, color: colors.textSecondary, marginBottom: 20}}>
              We found the following people in your export. Match them to your SahiSplit friends, or 'Skip' to ignore amounts involving them.
            </Text>

            {uniqueNames.map((uName) => (
              <View key={uName.index} style={styles.mappingRow}>
                <Text style={styles.mappingName}>{uName.name}</Text>
                <View style={styles.mappingOptions}>
                  <TouchableOpacity 
                    style={[styles.mapChip, mapping[uName.name] === "SKIP" && styles.mapChipActive]}
                    onPress={() => setMapping({...mapping, [uName.name]: "SKIP"})}
                  >
                    <Text style={[styles.mapChipText, mapping[uName.name] === "SKIP" && styles.mapChipTextActive]}>Skip</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.mapChip, mapping[uName.name] === userId && styles.mapChipActive]}
                    onPress={() => setMapping({...mapping, [uName.name]: userId!})}
                  >
                    <Text style={[styles.mapChipText, mapping[uName.name] === userId && styles.mapChipTextActive]}>Myself</Text>
                  </TouchableOpacity>
                  
                  {friends?.map(f => (
                    <TouchableOpacity 
                      key={f.id}
                      style={[styles.mapChip, mapping[uName.name] === f.id && styles.mapChipActive]}
                      onPress={() => setMapping({...mapping, [uName.name]: f.id})}
                    >
                      <Text style={[styles.mapChipText, mapping[uName.name] === f.id && styles.mapChipTextActive]}>{f.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            <TouchableOpacity 
              style={[styles.primaryBtn, {marginTop: 30, marginBottom: 40}]} 
              onPress={handleImport} 
              disabled={loading}
            >
              <Text style={styles.primaryBtnText}>{loading ? "Importing expenses..." : "Complete Import"}</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === "SUCCESS" && (
          <View style={[styles.card, {borderColor: colors.success}]}>
            <View style={[styles.iconCont, {backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)'}]}>
              <Ionicons name="checkmark-circle" size={40} color={colors.success} />
            </View>
            <Text style={styles.cardTitle}>Migration Complete!</Text>
            <Text style={styles.cardSub}>Your selected expenses and balances have been successfully imported into SahiSplit.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace("/(tabs)/index")}>
              <Text style={styles.primaryBtnText}>Go to Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
