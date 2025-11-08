/**
 * Code Action Menu Component
 * Floating menu that appears when text is selected in the editor
 * Provides quick AI actions: Fix, Explain, Refactor, Document
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type CodeAction = 'fix' | 'explain' | 'refactor' | 'document';

interface CodeActionMenuProps {
  visible: boolean;
  onAction: (action: CodeAction) => void;
  onClose: () => void;
}

export const CodeActionMenu: React.FC<CodeActionMenuProps> = ({
  visible,
  onAction,
  onClose,
}) => {
  if (!visible) return null;

  const actions: Array<{ type: CodeAction; icon: string; label: string; color: string }> = [
    { type: 'fix', icon: 'build-outline', label: 'Fix', color: '#4CAF50' },
    { type: 'explain', icon: 'bulb-outline', label: 'Explain', color: '#2196F3' },
    { type: 'refactor', icon: 'git-branch-outline', label: 'Refactor', color: '#9C27B0' },
    { type: 'document', icon: 'chatbox-outline', label: 'Document', color: '#FF9800' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.backdrop} />
      <View style={styles.menu}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="sparkles" size={16} color="#4A90E2" />
            <Text style={styles.headerTitle}>AI Actions</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={20} color="#AAA" />
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.type}
              style={styles.actionButton}
              onPress={() => {
                onAction(action.type);
                onClose();
              }}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${action.color}20` }]}>
                <Ionicons name={action.icon as any} size={20} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menu: {
    backgroundColor: '#2D2D2D',
    borderRadius: 12,
    padding: 16,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
