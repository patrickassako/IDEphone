/**
 * AI Result Modal Component
 * Displays AI response inline with options to apply or dismiss
 * Now with resizable modal for better readability
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ModalSize = 'small' | 'medium' | 'large' | 'fullscreen';

interface AIResultModalProps {
  visible: boolean;
  title: string;
  content: string;
  codeBlocks?: Array<{ language: string; code: string }>;
  isLoading?: boolean;
  onApply?: (code: string) => void;
  onClose: () => void;
}

export const AIResultModal: React.FC<AIResultModalProps> = ({
  visible,
  title,
  content,
  codeBlocks = [],
  isLoading = false,
  onApply,
  onClose,
}) => {
  const [modalSize, setModalSize] = useState<ModalSize>('medium');

  if (!visible) return null;

  const getModalStyle = () => {
    switch (modalSize) {
      case 'small':
        return { width: '70%', maxHeight: '50%' };
      case 'medium':
        return { width: '90%', maxHeight: '70%' };
      case 'large':
        return { width: '95%', maxHeight: '85%' };
      case 'fullscreen':
        return { width: '100%', height: '100%', borderRadius: 0, margin: 0 };
      default:
        return { width: '90%', maxHeight: '70%' };
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.backdrop} />
        <View style={[styles.modal, getModalStyle()]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="sparkles" size={20} color="#9F7AEA" />
              <Text style={styles.headerTitle}>{title}</Text>
            </View>
            <View style={styles.headerRight}>
              {/* Size controls */}
              <TouchableOpacity
                onPress={() => setModalSize('small')}
                style={[styles.sizeButton, modalSize === 'small' && styles.sizeButtonActive]}
              >
                <Ionicons name="contract-outline" size={16} color={modalSize === 'small' ? '#4A90E2' : '#AAA'} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalSize('medium')}
                style={[styles.sizeButton, modalSize === 'medium' && styles.sizeButtonActive]}
              >
                <Ionicons name="square-outline" size={16} color={modalSize === 'medium' ? '#4A90E2' : '#AAA'} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalSize('large')}
                style={[styles.sizeButton, modalSize === 'large' && styles.sizeButtonActive]}
              >
                <Ionicons name="expand-outline" size={16} color={modalSize === 'large' ? '#4A90E2' : '#AAA'} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalSize('fullscreen')}
                style={[styles.sizeButton, modalSize === 'fullscreen' && styles.sizeButtonActive]}
              >
                <Ionicons name="scan-outline" size={16} color={modalSize === 'fullscreen' ? '#4A90E2' : '#AAA'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.content}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text style={styles.loadingText}>AI is thinking...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.contentText}>{content}</Text>

                {codeBlocks.map((block, index) => (
                  <View key={index} style={styles.codeBlockContainer}>
                    <View style={styles.codeBlockHeader}>
                      <Text style={styles.codeBlockLanguage}>{block.language}</Text>
                      {onApply && (
                        <TouchableOpacity
                          style={styles.applyButton}
                          onPress={() => {
                            onApply(block.code);
                            onClose();
                          }}
                        >
                          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                          <Text style={styles.applyButtonText}>Apply</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <ScrollView horizontal style={styles.codeBlock}>
                      <Text style={styles.codeBlockText}>{block.code}</Text>
                    </ScrollView>
                  </View>
                ))}
              </>
            )}
          </ScrollView>

          {!isLoading && (
            <View style={styles.footer}>
              <TouchableOpacity style={styles.dismissButton} onPress={onClose}>
                <Text style={styles.dismissButtonText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  sizeButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#2D2D2D',
  },
  sizeButtonActive: {
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  closeButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#2D2D2D',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#AAA',
    marginTop: 12,
    fontSize: 14,
  },
  contentText: {
    color: '#FFF',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  codeBlockContainer: {
    marginTop: 12,
    backgroundColor: '#0D1117',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  codeBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#161B22',
  },
  codeBlockLanguage: {
    color: '#AAA',
    fontSize: 12,
    fontWeight: 'bold',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 6,
  },
  applyButtonText: {
    color: '#4CAF50',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  codeBlock: {
    padding: 12,
  },
  codeBlockText: {
    color: '#E6EDF3',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  dismissButton: {
    backgroundColor: '#2D2D2D',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  dismissButtonText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
