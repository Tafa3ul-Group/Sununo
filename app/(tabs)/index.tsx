import { ChaletCard } from '@/components/chalet-card';
import { HeaderSection } from '@/components/header-section';
import { Colors, Spacing, normalize } from '@/constants/theme';
import React from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

// Mock data based on the screenshot
const MOCK_CHALETS = [
  {
    id: '1',
    title: 'Aspen Mountain Retreat',
    location: 'Aspen, Colorado',
    guests: 4,
    price: 250,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=1000&auto=format&fit=crop',
    isRecentlyAdded: true,
  },
  {
    id: '2',
    title: 'Blue Lake Chalet',
    location: 'Lake Tahoe, California',
    guests: 6,
    price: 320,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1449156001437-3a1621dfbe2b?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: '3',
    title: 'Pine Forest Haven',
    location: 'Park City, Utah',
    guests: 2,
    price: 185,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop',
  }
];

export default function HomeScreen() {
  const { userType, user } = useSelector((state: RootState) => state.auth);
  
  if (userType === 'owner') {
    return <Redirect href="/(tabs)/(dashboard)/home" />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <FlashList
          data={MOCK_CHALETS}
          keyExtractor={(item) => item.id}
          estimatedItemSize={380}
          ListHeaderComponent={<HeaderSection userType={userType} userName={user?.name} />}
          renderItem={({ item }) => (
            <View style={styles.cardContainer}>
              <ChaletCard {...item} />
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  cardContainer: {
    paddingHorizontal: Spacing.md,
  },
});
