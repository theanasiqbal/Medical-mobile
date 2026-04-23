import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, PressableProps, Text, View } from 'react-native';

interface QuickActionCardProps extends Omit<PressableProps, 'children'> {
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  description: string;
  bgColor: string;
  iconColor: string;
}

// Helper function to extract color from Tailwind class
const getColorFromClass = (colorClass: string): string => {
  const colorMap: Record<string, string> = {
    'text-blue-600': '#2563eb',
    'text-blue-400': '#60a5fa',
    'text-green-600': '#16a34a',
    'text-green-400': '#4ade80',
    'text-purple-600': '#9333ea',
    'text-purple-400': '#c084fc',
    'text-orange-600': '#ea580c',
    'text-orange-400': '#fb923c',
  };
  
  // Extract the color class from dark mode format
  const match = colorClass.match(/text-[\w-]+/);
  return match ? colorMap[match[0]] || '#000' : '#000';
};

export default function QuickActionCard({ 
  iconName, 
  label, 
  description, 
  bgColor, 
  iconColor,
  ...props 
}: QuickActionCardProps) {
  const color = getColorFromClass(iconColor);
  
  return (
    <Pressable 
      className={`${bgColor} rounded-2xl p-4`}
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }]
        }
      ]}
      {...props}
    >
      <View className="mb-3">
        <MaterialCommunityIcons 
          name={iconName} 
          size={24} 
          color={color}
        />
      </View>
      <Text className="font-semibold text-foreground text-sm">{label}</Text>
      <Text className="text-xs text-muted-foreground mt-1">{description}</Text>
    </Pressable>
  );
}
