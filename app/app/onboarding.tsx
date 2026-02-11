import React, { useState, useRef } from 'react';
import { 
  View, 
  Dimensions, 
  FlatList, 
  TouchableOpacity, 
  StatusBar 
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Split Expenses\nEffortlessly',
    description: 'Track shared expenses with friends and family. No more awkward math or missing payments.',
    icon: 'people-outline',
    color: ['#6366f1', '#4338ca']
  },
  {
    id: '2',
    title: 'Fair & Transparent\nSplitting',
    description: 'Split by percentage, shares, or exact amounts. Everyone pays their fair share, always.',
    icon: 'pie-chart-outline',
    color: ['#ec4899', '#be185d']
  },
  {
    id: '3',
    title: 'Settle Up\nInstantly',
    description: 'Integrated with UPI for seamless payments. Settle debts in seconds with just a few taps.',
    icon: 'wallet-outline',
    color: ['#10b981', '#047857']
  }
];

export default function Onboarding() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      await finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasLaunched', 'true');
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={({ item }) => (
          <View style={{ width, alignItems: 'center', padding: 40, justifyContent: 'center' }}>
            <LinearGradient
              colors={item.color as any}
              style={{
                width: width * 0.7,
                height: width * 0.7,
                borderRadius: 60,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 60,
                shadowColor: item.color[0],
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.3,
                shadowRadius: 30,
                elevation: 10,
              }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={item.icon as any} size={120} color="white" />
            </LinearGradient>
            <Typography variant="h1" align="center" style={{ marginBottom: 16 }}>{item.title}</Typography>
            <Typography variant="body1" color="muted" align="center">{item.description}</Typography>
          </View>
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
      />

      <View style={{ padding: 24, paddingBottom: 40 }}>
        {/* Pagination Dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 40 }}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={{
                height: 8,
                width: currentIndex === index ? 24 : 8,
                borderRadius: 4,
                backgroundColor: currentIndex === index ? colors.primary : colors.border,
              }}
            />
          ))}
        </View>

        {/* Buttons */}
        <View style={{ gap: 16 }}>
          {currentIndex < SLIDES.length - 1 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <TouchableOpacity onPress={finishOnboarding} style={{ padding: 12 }}>
                <Typography color="muted" weight="bold">Skip</Typography>
              </TouchableOpacity>
              <Button 
                title="Next" 
                onPress={handleNext} 
                style={{ width: 140 }}
              />
            </View>
          ) : (
            <Button 
              title="Get Started" 
              onPress={finishOnboarding} 
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

