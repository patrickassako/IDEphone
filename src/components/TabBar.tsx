import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TabItem } from '../types';

interface TabBarProps {
  tabs: TabItem[];
  activeTabId: string | null;
  onTabPress: (id: string) => void;
  onTabClose: (id: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onTabPress,
  onTabClose,
}) => {
  return (
    <ScrollView
      horizontal
      style={styles.container}
      showsHorizontalScrollIndicator={false}
    >
      {tabs.map((tab) => (
        <View
          key={tab.id}
          style={[
            styles.tab,
            activeTabId === tab.id && styles.activeTab,
          ]}
        >
          <TouchableOpacity
            style={styles.tabContent}
            onPress={() => onTabPress(tab.id)}
          >
            <Text
              style={[
                styles.tabText,
                activeTabId === tab.id && styles.activeTabText,
              ]}
              numberOfLines={1}
            >
              {tab.name}
            </Text>
            {tab.isDirty && <View style={styles.dirtyDot} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => onTabClose(tab.id)}
          >
            <Ionicons name="close" size={16} color="#AAA" />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2D2D2D',
    maxHeight: 40,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: '#1E1E1E',
    minWidth: 120,
    maxWidth: 200,
  },
  activeTab: {
    backgroundColor: '#1E1E1E',
  },
  tabContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabText: {
    color: '#AAA',
    fontSize: 13,
    marginRight: 5,
  },
  activeTabText: {
    color: '#FFF',
  },
  dirtyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4A90E2',
  },
  closeButton: {
    marginLeft: 8,
    padding: 2,
  },
});
