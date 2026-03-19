import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Text, Surface, Divider, IconButton, Searchbar, Chip, Portal, Dialog, Button } from 'react-native-paper';
import { dailyTips, TIP_CATEGORIES } from '../services/DailyTipService';

const AdviceScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTip, setSelectedTip] = useState(null);

  // Filter tips based on search query and category
  const filteredTips = dailyTips.filter(tip => {
    const matchesSearch = tip.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? tip.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const handleOpenSource = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error("Помилка при відкритті посилання:", error);
    }
  };

  const renderTip = (tip) => (
    <Surface key={tip.id} style={styles.tipCard} elevation={0}>
      <View style={styles.tipHeader}>
        <Chip 
          mode="outlined" 
          style={styles.categoryChip}
          textStyle={styles.categoryChipText}
        >
          {tip.category}
        </Chip>
      </View>
      <View style={styles.tipContent}>
        <IconButton
          icon="lightbulb-outline"
          size={24}
          style={styles.tipIcon}
          iconColor="#2563eb"
        />
        <Text style={styles.tipText}>{tip.text}</Text>
      </View>
      <View style={styles.tipFooter}>
        <TouchableOpacity 
          style={styles.sourceButton}
          onPress={() => setSelectedTip(tip)}
        >
          <Text style={styles.sourceText}>Джерело: {tip.sourceName}</Text>
          <IconButton
            icon="open-in-new"
            size={16}
            iconColor="#666"
          />
        </TouchableOpacity>
      </View>
    </Surface>
  );

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Поради та підказки</Text>
      
      {/* Search bar */}
      <Searchbar
        placeholder="Пошук порад..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        iconColor="#666"
      />

      {/* Categories */}
      <View style={styles.categoriesWrapper}>
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          <View style={styles.chipRow}>
            <Chip
              mode="outlined"
              selected={selectedCategory === null}
              onPress={() => setSelectedCategory(null)}
              style={styles.categoryFilterChip}
              compact
            >
              Усі
            </Chip>
            {Object.values(TIP_CATEGORIES).map((category) => (
              <Chip
                key={category}
                mode="outlined"
                selected={selectedCategory === category}
                onPress={() => setSelectedCategory(category)}
                style={styles.categoryFilterChip}
                compact
              >
                {category}
              </Chip>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Tips count */}
      <Text style={styles.countText}>
        {filteredTips.length} {filteredTips.length === 1 ? 'порада' : 'порад'}
      </Text>

      {/* Tips list */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tipsContainer}>
          {filteredTips.map((tip) => renderTip(tip))}
        </View>
      </ScrollView>

      {/* Source Dialog */}
      <Portal>
        <Dialog
          visible={selectedTip !== null}
          onDismiss={() => setSelectedTip(null)}
          style={styles.dialog}
        >
          <Dialog.Title>Джерело інформації</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              {selectedTip?.text}
            </Text>
            <Text style={styles.dialogSource}>
              Джерело: {selectedTip?.sourceName}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSelectedTip(null)}>Закрити</Button>
            <Button 
              mode="contained"
              onPress={() => {
                handleOpenSource(selectedTip.sourceUrl);
                setSelectedTip(null);
              }}
            >
              Відкрити джерело
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },
  title: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    color: '#222',
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    elevation: 0,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoriesWrapper: {
    maxHeight: 100,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  categoriesContainer: {
    flexGrow: 0,
  },
  categoriesContent: {
    paddingVertical: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryFilterChip: {
    backgroundColor: '#fff',
    height: 32,
  },
  countText: {
    marginHorizontal: 16,
    marginBottom: 12,
    color: '#666',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  tipsContainer: {
    padding: 16,
    paddingTop: 4,
  },
  tipCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  tipHeader: {
    marginBottom: 12,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f7ff',
    borderColor: '#2563eb',
  },
  categoryChipText: {
    color: '#2563eb',
  },
  tipContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipIcon: {
    marginRight: 12,
    marginTop: -4,
    backgroundColor: '#f0f7ff',
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    color: '#222',
  },
  tipFooter: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceText: {
    fontSize: 14,
    color: '#666',
  },
  dialog: {
    backgroundColor: '#fff',
  },
  dialogText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    color: '#222',
  },
  dialogSource: {
    fontSize: 14,
    color: '#666',
  },
});

export default AdviceScreen; 