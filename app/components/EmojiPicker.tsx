import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

const EMOJI_CATEGORIES = {
  smileys: {
    label: 'Smileys',
    icon: 'happy-outline',
    emojis: ['😊', '😂', '🥰', '😎', '🤩', '😇', '🙌', '👍', '✨', '💫', '🌟', '⭐'],
  },
  food: {
    label: 'Food',
   icon: 'restaurant-outline',
    emojis: ['🍕', '🍔', '🍜', '🍱', '🍦', '🍰', '☕', '🥗', '🍩', '🍪', '🥐', '🥤'],
  },
  travel: {
    label: 'Travel',
    icon: 'airplane-outline',
    emojis: ['✈️', '🚗', '🚇', '🚲', '🏠', '🏖️', '⛰️', '🗺️', '🎒', '🧳', '🚀', '⛵'],
  },
  activities: {
    label: 'Activities',
    icon: 'football-outline',
    emojis: ['⚽', '🎮', '🎬', '🎵', '📚', '💼', '🎨', '🏋️', '🎭', '🎪', '🎯', '🎳'],
  },
  objects: {
    label: 'Objects',
    icon: 'cube-outline',
    emojis: ['💰', '💳', '🎁', '🛒', '📱', '💻', '🔑', '🏆', '💎', '🔔', '📦', '🎈'],
  },
};

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  visible: boolean;
}

export default function EmojiPicker({ onSelect, onClose, visible }: EmojiPickerProps) {
  const { colors, isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof EMOJI_CATEGORIES>('smileys');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEmojis = searchQuery
    ? Object.values(EMOJI_CATEGORIES)
        .flatMap((cat) => cat.emojis)
        .filter((emoji) => emoji.includes(searchQuery))
    : EMOJI_CATEGORIES[selectedCategory].emojis;

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 20,
      paddingBottom: 40,
      minHeight: '75%',
      maxHeight: '85%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    closeBtn: {
      height: 32,
      width: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginHorizontal: 20,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: 14,
      marginLeft: 8,
    },
    categoryTabs: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginBottom: 16,
      gap: 8,
    },
    categoryTab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
    },
    categoryTabActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    categoryTabInactive: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    categoryTabText: {
      fontSize: 12,
      fontWeight: 'bold',
    },
    emojiGrid: {
      paddingHorizontal: 20,
    },
    emojiRow: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    emojiBtn: {
      flex: 1,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 4,
      borderRadius: 12,
      backgroundColor: colors.surface,
      minHeight: 56,
    },
    emojiText: {
      fontSize: 32,
    },
  });

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    onClose();
  };

  // Group emojis into rows of 6
  const emojiRows = [];
  for (let i = 0; i < filteredEmojis.length; i += 6) {
    emojiRows.push(filteredEmojis.slice(i, i + 6));
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Pick an emoji</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={16} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search emojis..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {!searchQuery && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}>
                {(Object.keys(EMOJI_CATEGORIES) as Array<keyof typeof EMOJI_CATEGORIES>).map((key) => {
                  const cat = EMOJI_CATEGORIES[key];
                  const isActive = selectedCategory === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => setSelectedCategory(key)}
                      style={[styles.categoryTab, isActive ? styles.categoryTabActive : styles.categoryTabInactive]}
                    >
                      <Text
                        style={[
                          styles.categoryTabText,
                          { color: isActive ? '#fff' : colors.textSecondary },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <ScrollView style={styles.emojiGrid} showsVerticalScrollIndicator={false}>
              {emojiRows.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.emojiRow}>
                  {row.map((emoji, emojiIndex) => (
                    <TouchableOpacity
                      key={emojiIndex}
                      style={styles.emojiBtn}
                      onPress={() => handleSelect(emoji)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                  {/* Fill remaining slots if row is incomplete */}
                  {row.length < 6 &&
                    Array.from({ length: 6 - row.length }).map((_, i) => (
                      <View key={`empty-${i}`} style={{ flex: 1 }} />
                    ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
