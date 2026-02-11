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
  yearlyData: Array<{ label: string; value: number }>;
  dailyData: Array<{ label: string; value: number }>;
  groupData: Array<{ id: string; name: string; value: number }>;
  friendData: Array<{ id: string; name: string; avatarUrl?: string; emoji?: string; value: number }>;
  totalSpent: number;
  currentMonthTotal: number;
}

const COLORS = [
  "#38bdf8", "#34d399", "#f87171", "#818cf8", "#fbbf24", "#a78bfa", "#e879f9", "#2dd4bf",
];

type Period = 'day' | 'month' | 'year';

export default function AnalyticsScreen() {
  const { colors, isDark } = useTheme();
  const [period, setPeriod] = useState<Period>('month');

  const { data, isLoading, error, refetch } = useQuery({
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
        <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 16, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pieData = (data.categoryData || []).map((item, index) => ({
    value: item.value,
    color: COLORS[index % COLORS.length],
    text: `${Math.round((item.value / (data.totalSpent || 1)) * 100)}%`,
    category: item.name,
  }));

  const barData = (
    period === 'month' ? (data.monthlyData || []) : 
    period === 'year' ? (data.yearlyData || []) : 
    (data.dailyData || [])
  ).map((item) => ({
    value: item.value,
    label: item.label,
    frontColor: colors.primary,
    gradientColor: isDark ? "#0ea5e9" : "#38bdf8",
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
        
        {/* Summary Toggle */}
        <View style={{ 
          backgroundColor: colors.surface, 
          borderRadius: 20, 
          padding: 20, 
          marginBottom: 24,
          borderWidth: 1,
          borderColor: colors.border
        }}>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
            {(['day', 'month', 'year'] as Period[]).map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setPeriod(p)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: period === p ? colors.primary : colors.surfaceActive,
                  flex: 1,
                  alignItems: 'center'
                }}
              >
                <Text style={{ 
                  color: period === p ? '#fff' : colors.textSecondary, 
                  fontWeight: 'bold', 
                  fontSize: 12,
                  textTransform: 'capitalize'
                }}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View>
            <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
              {period === 'day' ? 'Spending Today' : period === 'month' ? 'This month' : 'Total Spent'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.text }}>
                ₹{period === 'day' ? (data.dailyData?.[new Date().getDate() - 1]?.value || 0).toLocaleString() : 
                  period === 'month' ? (data.currentMonthTotal || 0).toLocaleString() : 
                  (data.totalSpent || 0).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* trend Chart */}
        <View style={{ marginBottom: 32 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
             <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 18 }}>Spending Trend</Text>
          </View>
          <View style={{ 
            backgroundColor: colors.surface, 
            borderRadius: 24, 
            padding: 16, 
            paddingTop: 32,
            borderWidth: 1, 
            borderColor: colors.border 
          }}>
            <BarChart
              data={barData}
              barWidth={period === 'day' ? 8 : 28}
              spacing={period === 'day' ? 4 : 20}
              hideRules
              xAxisThickness={0}
              yAxisThickness={0}
              yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10, fontWeight: 'bold' }}
              noOfSections={3}
              maxValue={Math.max(...barData.map(d => d.value)) * 1.2 || 100}
              isAnimated
              frontColor={colors.primary}
            />
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>Categories</Text>
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
              innerRadius={60}
              showText={false}
              centerLabelComponent={() => (
                 <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="basket" size={24} color={colors.primary} />
                    <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 4 }}>Categories</Text>
                 </View>
              )}
            />
            <View style={{ width: '100%', marginTop: 24 }}>
              {pieData.slice(0, 5).map((item, index) => (
                <View key={index} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: item.color, marginRight: 8 }} />
                    <Text style={{ color: colors.text, fontSize: 14 }}>{item.category}</Text>
                  </View>
                  <Text style={{ color: colors.text, fontWeight: 'bold' }}>₹{item.value.toFixed(0)}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Friend-wise Spending */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>Spent with Friends</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
            {(data.friendData || []).map((f, idx) => (
              <View key={idx} style={{ 
                backgroundColor: colors.surface, 
                padding: 16, 
                borderRadius: 20, 
                borderWidth: 1, 
                borderColor: colors.border,
                marginRight: 12,
                width: 140,
                alignItems: 'center'
              }}>
                <View style={{ 
                  height: 50, width: 50, borderRadius: 25, 
                  backgroundColor: colors.surfaceActive, 
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: 12,
                  borderWidth: 2,
                  borderColor: colors.primary
                }}>
                  <Text style={{ fontSize: 24 }}>{f.emoji || "👤"}</Text>
                </View>
                <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 12, textAlign: 'center' }} numberOfLines={1}>{f.name}</Text>
                <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 14, marginTop: 4 }}>₹{f.value.toFixed(0)}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Top Groups */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>Top Groups</Text>
          {(data.groupData || []).map((g, idx) => (
            <View key={idx} style={{ 
              backgroundColor: colors.surface, 
              padding: 16, 
              borderRadius: 16, 
              borderWidth: 1, 
              borderColor: colors.border,
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12
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
                 <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Group Expense</Text>
              </View>
              <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14 }}>₹{g.value.toFixed(0)}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
