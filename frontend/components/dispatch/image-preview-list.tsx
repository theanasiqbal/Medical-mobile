import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, ScrollView, View } from "react-native";

interface ImagePreviewListProps {
  images: string[];
  onRemove: (index: number) => void;
}

export function ImagePreviewList({ images, onRemove }: ImagePreviewListProps) {
  if (images.length === 0) return null;

  return (
    <View className="mb-6">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="pt-2 pr-3"
        className="gap-3"
      >
        {images.map((imgUri, index) => (
          <View key={index} className="relative mr-3 mt-1">
            <View className="w-20 h-20 rounded-xl overflow-hidden border border-border">
              <Image
                source={{ uri: imgUri }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
            <Pressable
              onPress={() => onRemove(index)}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive items-center justify-center shadow-sm"
              style={{ zIndex: 10 }}
            >
              <MaterialCommunityIcons name="close" size={14} color="#FFF" />
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
