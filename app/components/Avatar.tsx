import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENT_AVATARS } from '@/constants/Avatars';

interface AvatarProps {
  url: string | null | undefined;
  name: string;
  size?: number;
  style?: any;
}

export default function Avatar({ url, name, size = 48, style }: AvatarProps) {
  if (url?.startsWith('gradient:')) {
    const id = url.split(':')[1];
    const avatar = GRADIENT_AVATARS.find(a => a.id === id) || GRADIENT_AVATARS[0];
    
    return (
      <LinearGradient
        colors={avatar.colors}
        style={[styles.container, { width: size, height: size, borderRadius: size * 0.4 }, style]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={{ fontSize: size * 0.45 }}>{avatar.icon}</Text>
      </LinearGradient>
    );
  }

  if (url) {
    return (
      <Image 
        source={{ uri: url }} 
        style={[styles.container, { width: size, height: size, borderRadius: size * 0.4 }, style]} 
      />
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size * 0.4, backgroundColor: '#f1f5f9' }, style]}>
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initial: {
    fontWeight: 'bold',
    color: '#64748b',
  },
});
