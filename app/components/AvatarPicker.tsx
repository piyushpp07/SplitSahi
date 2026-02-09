import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { GRADIENT_AVATARS } from '@/constants/Avatars';

interface AvatarPickerProps {
  selectedId: string | null;
  onSelect: (id: string, url: string) => void;
  label?: string;
}

export default function AvatarPicker({ selectedId, onSelect, label }: AvatarPickerProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {GRADIENT_AVATARS.map((avatar) => {
          const isSelected = selectedId === avatar.id;
          const url = `gradient:${avatar.id}`; // Custom internal URL pattern
          
          return (
            <TouchableOpacity 
              key={avatar.id} 
              onPress={() => onSelect(avatar.id, url)}
              style={[
                styles.avatarWrapper, 
                isSelected && { borderColor: colors.primary, borderWidth: 2 }
              ]}
            >
              <LinearGradient
                colors={avatar.colors}
                style={styles.avatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.icon}>{avatar.icon}</Text>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  scrollContent: {
    gap: 12,
    paddingRight: 20,
  },
  avatarWrapper: {
    borderRadius: 20,
    padding: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
});
