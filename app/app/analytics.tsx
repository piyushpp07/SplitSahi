import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, LayoutAnimation, Platform, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { PieChart, BarChart } from "react-native-gifted-charts";
import { useTheme } from "@/contexts/ThemeContext";

interface AnalyticsData {
  categoryData: Array<{ name: string; value: number }>;
  monthlyData: Array<{ label: string; value: number; fullDate: string }>;
  groupData: Array<{ id: string; name: string; value: number }>;
  totalSpent: number;
}

const COLORS = [
  "#38bdf8", // Sky (Primary)
  "#34d399", // Green (Accent)
  "#f87171", // Red (Accent)
  "#818cf8", // Indigo
  "#fbbf24", // Amber
  "#a78bfa", // Violet
  "#e879f9", // Fuchsia
  "#2dd4bf", // Teal
];

export default function AnalyticsScreen() {
  const { colors, isDark } = useTheme();
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => apiGet<AnalyticsData>("/analytics"),
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 18, marginTop: 16, textAlign: 'center' }}>Failed to load analytics</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16, backgroundColor: colors.surface, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}>
          <Text style={{ color: colors.text, fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Format Pie Data
  const pieData = (data.categoryData || []).map((item, index) => ({
    value: item.value,
    color: COLORS[index % COLORS.length],
    text: `${Math.round((item.value / (data.totalSpent || 1)) * 100)}%`,
    category: item.name,
  }));

  // Format Bar Data
  const barData = (data.monthlyData || []).map((item) => ({
    value: item.value,
    label: item.label,
    frontColor: colors.primary,
    gradientColor: isDark ? "#0ea5e9" : "#38bdf8",
  }));

  // Format Group Data
  const groupChartData = (data.groupData || []).map((item, index) => ({
    value: item.value,
    label: item.name,
    frontColor: COLORS[index % COLORS.length],
  }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 }}>
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
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>Insights</Text>
      </View>

      <ScrollView 
        style={{ flex: 1, paddingHorizontal: 20 }} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 50 }}
      >
        
        {/* Total Spent Card */}
        <View style={{ 
          backgroundColor: colors.surface, 
          borderRadius: 16, 
          padding: 24, 
          marginBottom: 24, 
          borderWidth: 1, 
          borderColor: colors.border,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <View>
            <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Total share</Text>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.text }}>₹{(data.totalSpent || 0).toLocaleString()}</Text>
          </View>
          <View style={{ backgroundColor: colors.primary + '20', padding: 12, borderRadius: 16 }}>
             <Ionicons name="stats-chart" size={24} color={colors.primary} />
          </View>
        </View>

        {/* Top Groups (New) */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>Top Spending Groups</Text>
          <View style={{ gap: 12 }}>
            {(data.groupData || []).map((g, idx) => (
              <View key={idx} style={{ 
                backgroundColor: colors.surface, 
                padding: 16, 
                borderRadius: 16, 
                borderWidth: 1, 
                borderColor: colors.border,
                flexDirection: 'row',
                alignItems: 'center'
              }}>
                <View style={{ 
                    height: 40, width: 40, borderRadius: 12, 
                    backgroundColor: COLORS[idx % COLORS.length] + '20', 
                    alignItems: 'center', justifyContent: 'center',
                    marginRight: 12
                }}>
                  <Text style={{ fontWeight: 'bold', color: COLORS[idx % COLORS.length] }}>{g.name[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                   <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14 }}>{g.name}</Text>
                   <View style={{ 
                       height: 4, width: '100%', 
                       backgroundColor: colors.surfaceActive, 
                       borderRadius: 2, marginTop: 8,
                       overflow: 'hidden'
                    }}>
                      <View style={{ 
                          height: '100%', 
                          width: `${(g.value / data.groupData[0].value) * 100}%`, 
                          backgroundColor: COLORS[idx % COLORS.length] 
                        }} />
                   </View>
                </View>
                <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14, marginLeft: 16 }}>₹{g.value.toFixed(0)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>Categories</Text>
          {pieData.length > 0 ? (
            <View style={{ 
              alignItems: 'center', 
              backgroundColor: colors.surface, 
              borderRadius: 24, 
              padding: 24, 
              borderWidth: 1, 
              borderColor: colors.border 
            }}>
              <PieChart
                data={pieData}
                donut
                radius={80}
                innerRadius={50}
                showText
                textColor="#fff" // Text inside pie slices usually needs contrast
                textSize={10}
                fontWeight="bold"
                focusOnPress
                onPress={(item: any, index: number) => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                }}
                centerLabelComponent={() => (
                   <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 20, color: colors.text, fontWeight: 'bold' }}>{pieData.length}</Text>
                      <Text style={{ fontSize: 8, color: colors.textSecondary }}>Types</Text>
                   </View>
                )}
              />
              
              {/* Legend */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 24 }}>
                {pieData.map((item, index) => (
                  <View key={index} style={{ flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, backgroundColor: colors.surfaceActive }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color, marginRight: 6 }} />
                    <Text style={{ color: colors.text, fontSize: 11 }}>{item.category}: ₹{item.value.toFixed(0)}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={{ 
              backgroundColor: colors.surface, 
              borderRadius: 16, 
              padding: 24, 
              alignItems: 'center', 
              borderWidth: 1, 
              borderColor: colors.border, 
              borderStyle: 'dashed' 
            }}>
              <Text style={{ color: colors.textSecondary, fontWeight: 'bold' }}>No spending data available</Text>
            </View>
          )}
        </View>

        {/* Monthly Trend */}
        <View style={{ marginBottom: 40 }}>
          <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>History</Text>
          {barData.length > 0 ? (
            <View style={{ 
              backgroundColor: colors.surface, 
              borderRadius: 24, 
              padding: 16, 
              paddingTop: 32, 
              borderWidth: 1, 
              borderColor: colors.border, 
              overflow: 'hidden' 
            }}>
              <BarChart
                data={barData}
                barWidth={28}
                spacing={20}
                hideRules
                xAxisThickness={0}
                yAxisThickness={0}
                yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10, fontWeight: 'bold' }}
                noOfSections={3}
                maxValue={Math.max(...barData.map(d => d.value)) * 1.2 || 100} // Dynamic max
                isAnimated
                frontColor={colors.primary}
              />
            </View>
          ) : (
            <View style={{ 
              backgroundColor: colors.surface, 
              borderRadius: 16, 
              padding: 24, 
              alignItems: 'center', 
              borderWidth: 1, 
              borderColor: colors.border, 
              borderStyle: 'dashed' 
            }}>
              <Text style={{ color: colors.textSecondary, fontWeight: 'bold' }}>No monthly data available</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
