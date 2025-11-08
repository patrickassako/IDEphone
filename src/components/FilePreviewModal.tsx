/**
 * File Preview Bottom Sheet Component
 * Modern bottom sheet displaying preview of multiple files that will be generated
 * Allows users to review, select/deselect, and create files
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GeneratedFile } from '../services/ai/MultiFileGenerator';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_HEIGHT = SCREEN_HEIGHT * 0.92;

interface FilePreviewModalProps {
  visible: boolean;
  files: GeneratedFile[];
  summary?: string;
  onCreateFiles: (selectedFiles: GeneratedFile[]) => void;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  visible,
  files,
  summary,
  onCreateFiles,
  onClose,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(
    new Set(files.map((f) => f.path))
  );
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [slideAnim] = useState(new Animated.Value(BOTTOM_SHEET_HEIGHT));

  useEffect(() => {
    if (visible) {
      // Slide up animation
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      // Slide down animation
      Animated.spring(slideAnim, {
        toValue: BOTTOM_SHEET_HEIGHT,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  const toggleFileSelection = (path: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(path)) {
      newSelection.delete(path);
    } else {
      newSelection.add(path);
    }
    setSelectedFiles(newSelection);
  };

  const toggleAllFiles = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map((f) => f.path)));
    }
  };

  const handleCreate = () => {
    const filesToCreate = files.filter((f) => selectedFiles.has(f.path));
    onCreateFiles(filesToCreate);
  };

  const getLanguageIcon = (language?: string): string => {
    const iconMap: { [key: string]: string } = {
      typescript: 'logo-typescript',
      javascript: 'logo-javascript',
      python: 'logo-python',
      html: 'logo-html5',
      css: 'logo-css3',
      json: 'code-slash',
      markdown: 'document-text',
    };
    return iconMap[language || ''] || 'document-outline';
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Drag Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="folder-open" size={24} color="#E91E63" />
                </View>
                <View>
                  <Text style={styles.headerTitle}>Generate Files</Text>
                  <Text style={styles.headerSubtitle}>
                    {selectedFiles.size} of {files.length} selected
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#AAA" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Summary */}
          {summary && (
            <View style={styles.summaryContainer}>
              <Ionicons name="information-circle" size={18} color="#4A90E2" />
              <Text style={styles.summaryText}>{summary}</Text>
            </View>
          )}

          {/* Select All */}
          <View style={styles.selectAllContainer}>
            <TouchableOpacity onPress={toggleAllFiles} style={styles.selectAllButton}>
              <Ionicons
                name={selectedFiles.size === files.length ? 'checkbox' : 'square-outline'}
                size={22}
                color="#4A90E2"
              />
              <Text style={styles.selectAllText}>
                {selectedFiles.size === files.length ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* File List */}
          <ScrollView style={styles.fileList} showsVerticalScrollIndicator={false}>

            {files.map((file, index) => {
              const isSelected = selectedFiles.has(file.path);
              const isExpanded = expandedFile === file.path;
              const lineCount = file.content.split('\n').length;

              return (
                <View
                  key={index}
                  style={[
                    styles.fileCard,
                    isSelected && styles.fileCardSelected,
                    isExpanded && styles.fileCardExpanded,
                  ]}
                >
                  {/* File Header */}
                  <View style={styles.fileHeader}>
                    <TouchableOpacity
                      onPress={() => toggleFileSelection(file.path)}
                      style={styles.fileCheckbox}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name={isSelected ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={isSelected ? '#4A90E2' : '#666'}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setExpandedFile(isExpanded ? null : file.path)}
                      style={styles.fileInfo}
                      activeOpacity={0.7}
                    >
                      <View style={styles.fileNameRow}>
                        <View style={styles.fileIconBadge}>
                          <Ionicons
                            name={getLanguageIcon(file.language)}
                            size={20}
                            color="#E91E63"
                          />
                        </View>
                        <Text
                          style={[styles.filePath, !isSelected && styles.filePathDisabled]}
                          numberOfLines={1}
                        >
                          {file.path}
                        </Text>
                        <Ionicons
                          name={isExpanded ? 'chevron-up-circle' : 'chevron-down-circle'}
                          size={20}
                          color={isExpanded ? '#4A90E2' : '#666'}
                        />
                      </View>

                      <View style={styles.fileMetadata}>
                        <View style={styles.metadataBadge}>
                          <Ionicons name="code-slash" size={14} color="#E91E63" />
                          <Text style={styles.fileLanguage}>{file.language || 'text'}</Text>
                        </View>
                        <View style={styles.metadataBadge}>
                          <Ionicons name="document-text" size={14} color="#4A90E2" />
                          <Text style={styles.fileLines}>{lineCount} lines</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* File Content Preview */}
                  {isExpanded && (
                    <View style={styles.fileContentContainer}>
                      <View style={styles.codeHeader}>
                        <Text style={styles.codeHeaderText}>Preview</Text>
                        <Text style={styles.codeHeaderLines}>{lineCount} lines</Text>
                      </View>
                      <ScrollView
                        style={styles.codeScrollContainer}
                        showsVerticalScrollIndicator={true}
                        nestedScrollEnabled={true}
                      >
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={true}
                          nestedScrollEnabled={true}
                        >
                          <Text style={styles.codeText}>{file.content}</Text>
                        </ScrollView>
                      </ScrollView>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Ionicons name="close-circle-outline" size={20} color="#AAA" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.createButton,
                selectedFiles.size === 0 && styles.createButtonDisabled,
              ]}
              onPress={handleCreate}
              disabled={selectedFiles.size === 0}
            >
              <Ionicons name="add-circle" size={20} color="#FFF" />
              <Text style={styles.createButtonText}>
                Create {selectedFiles.size > 0 ? `${selectedFiles.size} File${selectedFiles.size > 1 ? 's' : ''}` : 'Files'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  bottomSheet: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: BOTTOM_SHEET_HEIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#444',
    borderRadius: 3,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#2D2D2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#AAA',
    fontSize: 14,
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2D2D2D',
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    margin: 20,
    marginBottom: 0,
    padding: 16,
    backgroundColor: '#252525',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#4A90E2',
  },
  summaryText: {
    flex: 1,
    color: '#DDD',
    fontSize: 15,
    lineHeight: 22,
  },
  selectAllContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectAllText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
  fileList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  fileCard: {
    marginBottom: 16,
    backgroundColor: '#252525',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#2D2D2D',
  },
  fileCardSelected: {
    borderColor: '#4A90E2',
    backgroundColor: '#2A2A2A',
  },
  fileCardExpanded: {
    borderColor: '#E91E63',
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  fileCheckbox: {
    marginRight: 12,
    marginTop: 2,
  },
  fileInfo: {
    flex: 1,
  },
  fileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  fileIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2D2D2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filePath: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  filePathDisabled: {
    color: '#777',
  },
  fileMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  metadataBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#2D2D2D',
    borderRadius: 8,
  },
  fileLanguage: {
    color: '#E91E63',
    fontSize: 13,
    fontWeight: '600',
  },
  fileLines: {
    color: '#4A90E2',
    fontSize: 13,
    fontWeight: '600',
  },
  fileContentContainer: {
    borderTopWidth: 1,
    borderTopColor: '#2D2D2D',
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
  },
  codeHeaderText: {
    color: '#AAA',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  codeHeaderLines: {
    color: '#666',
    fontSize: 12,
  },
  codeScrollContainer: {
    maxHeight: 400,
    backgroundColor: '#0D1117',
  },
  codeText: {
    color: '#E6EDF3',
    fontSize: 14,
    fontFamily: 'monospace',
    lineHeight: 22,
    padding: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#2D2D2D',
    backgroundColor: '#1A1A1A',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2D2D2D',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cancelButtonText: {
    color: '#AAA',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createButton: {
    flex: 2,
    backgroundColor: '#E91E63',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#444',
    opacity: 0.5,
    shadowOpacity: 0,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
