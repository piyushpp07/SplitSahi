import { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Modal, FlatList, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 7;
const ITEM_SIZE = width / COLUMN_COUNT;

const EMOJI_CATEGORIES = {
  smileys: {
    label: 'Smileys',
    icon: 'happy-outline' as const,
    emojis: [
      '😊', '😂', '🥰', '😎', '🤩', '😇', '🙌', '👍', '✨', '💫', '🌟', '⭐',
      '😄', '😃', '😁', '😆', '😅', '🤣', '🙂', '🙃', '😉', '😌', '😍', '😘',
      '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎',
      '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
      '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳',
      '🥵', '🥶', '😱', 'scared', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫',
      '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱',
      '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', 'sneezing', '😷', '🤒', '🤕',
      '🤑', '🤠', '😈', '👿', 'ww', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️',
      '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾',
      '🤲', '👐', '🙌', '👏', '🙏', '🤝', '👍', '👎', '👊', '✊', '🤛', '🤜',
      '🤞', '✌️', '🤟', '🤘', '👌', '🤌', '🤏', '👈', '👉', '👆', '👇', '☝️',
      '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '💪', '🦾', '🖕', '✍️', '🤳', '💅',
      'legs', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀',
      '👁️', '👅', '👄', '💋', '👶', '🧒', '👦', '👧', '🧑', '👱', '👨', '🧔',
    ],
  },
  food: {
    label: 'Food',
    icon: 'restaurant-outline' as const,
    emojis: [
      '🍕', '🍔', '🍜', '🍱', '🍦', '🍰', '☕', '🥗', '🍩', '🍪', '🥐', '🥤',
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒',
      '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '�', '🥒', '🌶️',
      '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '�🥐', '🥯', '🍞', '🥖',
      '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴',
      '🌭', '🍟', '🥪', '🌮', '🌯', '🫔', '🥙', '🧆', '🥚', '🥘', '🍲', '🫕',
      '🥣', '🥗', '🍿', '🧈', '🧂', '🥫', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜',
      '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🥡', '🦀',
      '🦞', '🦐', '🦑', '🦪', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁',
      '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '�', '☕', '🫖', '🍵', '🍶',
      '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃', '�🥤', '🧃', '🧉', '🧊',
      '🥢', '🍽️', '🍴', '🥄', '🔪', '🏺'
    ],
  },
  travel: {
    label: 'Travel',
    icon: 'airplane-outline' as const,
    emojis: [
      '✈️', '🚗', '🚇', '🚲', '🏠', '🏖️', '⛰️', '🗺️', '🎒', '🧳', '🚀', '⛵',
      '🌍', '🌎', '🌏', '🌐', '⛺', '🏕️', '🏜️', '🏝️', '🏞️', '🏟️', '🏛️', '🏗️',
      '🧱', '🪨', '🪵', '🛖', '🏘️', '🏚️', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥',
      '🏦', '🏨', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '💒', '🗼', '🗽', '⛪',
      '🕌', '🛕', '🕍', '⛩️', '🕋', '⛲', '⛺', '🌁', '🌃', '🏙️', '🌄', '🌅',
      '🌆', '🌇', '🌉', '♨️', '🎠', '🎡', '🎢', '💈', '🎪', '🚂', '🚃', '🚄',
      '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌', '🚍', '🚎',
      '🚐', '🚑', '🚒', '🚓', '🚔', '🚕', '🚖', '🚗', '🚘', '🚙', '🛻', '🚚',
      '🚛', '🚜', '🏎️', '🏍️', '🛵', '🦽', '🦼', '🛺', '🚲', '🛴', '🛹', '🛼',
      '🚏', '🛣️', '🛤️', '🛢️', '⛽', '🚨', '🚥', '🚦', '🛑', '🚧', '⚓', '⛵',
      '🛶', '🚤', '🛳️', '⛴️', '🛥️', '🚢', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺',
      '🚁', '🚟', '🚠', '🚡', '🛰️', '🚀', '🛸'
    ],
  },
  activities: {
    label: 'Activities',
    icon: 'football-outline' as const,
    emojis: [
      '⚽', '🎮', '🎬', '🎵', '📚', '💼', '🎨', '🏋️', '🎭', '🎪', '🎯', '🎳',
      '🏈', '🏉', '🎾', '🥎', '⚾', '🏏', '🏑', '🏒', '🥍', '🏓', '🏸', '🥊',
      '🥋', '🥅', '⛳', '⛸️', '🎣', '🤿', '🎽', '🎿', '🛷', '🥌', '🎯', '🪀',
      '🪁', '🎱', '🔮', '🪄', '🧿', '🎮', '🕹️', '🎰', '🎲', '🧩', '🧸', '🪅',
      '🪆', '♠️', '♥️', '♦️', '♣️', '♟️', '🃏', '🀄', '🎴', '🎭', '🖼️', '🎨',
      '🧵', '🪡', '🧶', '🪢', '🧣', '🧤', '🧥', '🧦', '👗', '👘', '🥻', '🩴',
      '🩱', '🩲', '🩳', '👙', '👚', '👛', '👜', '👝', '🎒', '👞', '👟', '🥾',
      '🥿', '👠', '👡', '🩰', '👢', '👑', '👒', '🎩', '🎓', '🧢', '🪖', '⛑️',
      '📿', '💄', '💍', '💎'
    ],
  },
  objects: {
    label: 'Objects',
    icon: 'cube-outline' as const,
    emojis: [
      '💰', '💳', '🎁', '🛒', '📱', '💻', '🔑', '🏆', '💎', '🔔', '📦', '🎈',
      '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽',
      '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️',
      '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️',
      '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸',
      '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🪛',
      '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪚', '⚙️', '🔩', '⛓️', '🪝', '🪜', '🧱',
      '🪨', '🪵', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️',
      '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹',
      '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡️', '🧹', '🪠', '🧺',
      '🧻', '🚽', '🚰', '🚿', '🛁', '🛀', '🧼', '🪥', '🪒', '🧽', '🪣', '🧴',
      '🛎️', '🔑', '🗝️', '🚪', '🪑', '🛋️', '🛏️', '🛌', '🧸', '🪆', '🖼️', '🪞',
      '🪟', '🛍️', '🛒', '🎁', '🎈', '🎏', '🎀', '🪄', '🪅', '🎊', '🎉', '🎎',
      '🏮', '🎐', '🧧', '✉️', '📩', '📨', '📧', '💌', '📥', '📤', '📦', '🏷️',
      '🪧', '📪', '📫', '📬', '📭', '📮', '📯', '📜', '📃', '📄', '📑', '🧾',
      '📊', '📈', '📉', '🗒️', '🗓️', '📆', '📅', '🗑️', '📇', '🗃️', '🗳️', '🗄️',
      '📋', '📁', '📂', '🗂️', '🗞️', '📰', '📓', '📔', '📒', '📕', '📗', '📘',
      '📙', '📚', '📖', '🔖', '🧷', '🔗', '📎', '🖇️', '📐', '📏', '🧮', '📌',
      '📍', '✂️', '🖊️', '🖋️', '✒️', '🖌️', '🖍️', '📝', '✏️', '🔍', '🔎', '🔏',
      '🔐', '🔒', '🔓'
    ],
  },
};

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  visible: boolean;
  context?: 'profile' | 'group' | 'expense' | 'default';
}

export default function EmojiPicker({ onSelect, onClose, visible, context = 'default' }: EmojiPickerProps) {
  const { colors, isDark } = useTheme();
  
  const [selectedCategory, setSelectedCategory] = useState<string>(
     context !== 'default' ? 'featured' : 'smileys'
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamic categories based on context
  const categories = useMemo(() => {
    let featured: string[] = [];
    let featuredIcon: any = 'star-outline';
    let featuredLabel = 'Featured';

    if (context === 'profile') {
      featuredLabel = 'Avatars';
      featuredIcon = 'person-outline' as const;
      featured = [
        '🧔', '👨', '🧑', '👱', '👩', '🧓', '👴', '👵', '👶', '👼', '🤴', '👸',
        '🕵️', '👮', '👷', '💂', '🦸', '🦹', '🧙', '🧚', '🧛', '🧜', '🧝', '🧞',
        '🧟', '💆', '💇', '🚶', '🏃', '💃', '🕺', '🕴️', '👯', '🧘', '🏄', '🏊'
      ];
    } else if (context === 'group') {
      featuredLabel = 'Groups';
      featuredIcon = 'people-outline' as const;
      featured = [
        '🏠', '✈️', '🍕', '🍻', '🎓', '💼', '🏖️', '🎟️', '🎬', '⛺', '🚗', '🎁',
        '⚽', '🎮', '💡', '💰', '🛒', '🧘', '🏋️', '🚴', '🎉', '🥂', '🍼', '🐾'
      ];
    } else if (context === 'expense') {
      featuredLabel = 'Spending';
      featuredIcon = 'cash-outline' as const;
      featured = [
        '💸', '💰', '💳', '🧾', '🛒', '🛍️', '🎁', '🎫', '🚕', '⛽', '🍽️', '🍻',
        '🍕', '🍔', '☕', '💊', '🏠', '💡', '🔌', '🚿', '📱', '💻', '🎮', '📚'
      ];
    }

    const baseCats = { ...EMOJI_CATEGORIES };
    
    // Prepend Featured category if context is specific
    if (context !== 'default' && featured.length > 0) {
      return {
        featured: {
          label: featuredLabel,
          icon: featuredIcon,
          emojis: featured,
        },
        ...baseCats
      };
    }
    
    return baseCats;
  }, [context]);

  // Reset category when visible changes or context changes
  useEffect(() => {
    if (visible) {
      setSelectedCategory(context !== 'default' ? 'featured' : 'smileys');
      setSearchQuery('');
    }
  }, [visible, context]);

  const filteredEmojis = useMemo(() => {
    if (searchQuery) {
      // Search across ALL base categories (ignoring duplicate featured for search)
      return Object.values(EMOJI_CATEGORIES)
        .flatMap((cat) => cat.emojis)
        .filter((emoji) => emoji.includes(searchQuery));
    }
    // @ts-ignore
    return categories[selectedCategory]?.emojis || [];
  }, [selectedCategory, searchQuery, categories]);

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      width: '100%',
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 12,
      paddingBottom: Platform.OS === 'ios' ? 40 : 20,
      height: '80%',
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: -4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 10,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    closeBtn: {
      height: 36,
      width: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchContainer: {
      backgroundColor: colors.surface,
      borderRadius: 16,
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
      fontSize: 16,
      marginLeft: 12,
    },
    categoryTabs: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    categoryTab: {
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      marginRight: 8,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    categoryTabActive: {
      backgroundColor: colors.surfaceActive,
      borderColor: colors.primary,
    },
    categoryTabInactive: {
      backgroundColor: 'transparent',
    },
    emojiItem: {
      width: ITEM_SIZE,
      height: ITEM_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emojiText: {
      fontSize: 32,
    },
  });

  const renderEmoji = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.emojiItem}
      onPress={() => {
        onSelect(item);
        onClose();
      }}
      activeOpacity={0.6}
    >
      <Text style={styles.emojiText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View style={styles.container}>
            {/* Drag Handle */}
            <View style={styles.handle} />

            <View style={styles.header}>
              <Text style={styles.title}>Pick an Emoji</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search emojis..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {!searchQuery && (
              <View style={{ height: 50, marginBottom: 8 }}>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={Object.keys(EMOJI_CATEGORIES) as Array<keyof typeof EMOJI_CATEGORIES>}
                  contentContainerStyle={{ paddingHorizontal: 20 }}
                  keyExtractor={(item) => item}
                  renderItem={({ item: key }) => {
                    const cat = EMOJI_CATEGORIES[key];
                    const isActive = selectedCategory === key;
                    return (
                      <TouchableOpacity
                        onPress={() => setSelectedCategory(key)}
                        style={[
                          styles.categoryTab,
                          isActive ? styles.categoryTabActive : styles.categoryTabInactive
                        ]}
                      >
                        <Ionicons 
                          name={cat.icon} 
                          size={20} 
                          color={isActive ? colors.primary : colors.textSecondary} 
                          style={{ marginBottom: 4 }}
                        />
                         <Text style={{ 
                           fontSize: 10, 
                           fontWeight: 'bold', 
                           color: isActive ? colors.primary : colors.textSecondary 
                         }}>
                           {cat.label}
                         </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            )}

            <FlatList
              data={filteredEmojis}
              renderItem={renderEmoji}
              keyExtractor={(item, index) => `${item}-${index}`}
              numColumns={COLUMN_COUNT}
              contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 10 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={50}
              maxToRenderPerBatch={50}
              windowSize={10}
            />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
