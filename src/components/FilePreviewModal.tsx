/**
 * File Preview Modal Component
 * Displays a preview of multiple files that will be generated
 * Allows users to review, select/deselect, and create files
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GeneratedFile } from '../services/ai/MultiFileGenerator';

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
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.backdrop} />
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="folder-open" size={20} color="#E91E63" />
              <Text style={styles.headerTitle}>
                Generate Files ({selectedFiles.size}/{files.length})
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Summary */}
          {summary && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryText}>{summary}</Text>
            </View>
          )}

          {/* File List */}
          <ScrollView style={styles.fileList}>
            <View style={styles.selectAllContainer}>
              <TouchableOpacity onPress={toggleAllFiles} style={styles.selectAllButton}>
                <Ionicons
                  name={selectedFiles.size === files.length ? 'checkbox' : 'square-outline'}
                  size={20}
                  color="#4A90E2"
                />
                <Text style={styles.selectAllText}>
                  {selectedFiles.size === files.length ? 'Deselect All' : 'Select All'}
                </Text>
              </TouchableOpacity>
            </View>

            {files.map((file, index) => {
              const isSelected = selectedFiles.has(file.path);
              const isExpanded = expandedFile === file.path;

              return (
                <View key={index} style={styles.fileItem}>
                  {/* File Header */}
                  <View style={styles.fileHeader}>
                    <TouchableOpacity
                      onPress={() => toggleFileSelection(file.path)}
                      style={styles.fileCheckbox}
                    >
                      <Ionicons
                        name={isSelected ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={isSelected ? '#4A90E2' : '#666'}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setExpandedFile(isExpanded ? null : file.path)}
                      style={styles.fileInfo}
                    >
                      <View style={styles.fileNameContainer}>
                        <Ionicons
                          name={getLanguageIcon(file.language)}
                          size={16}
                          color="#E91E63"
                        />
                        <Text
                          style={[styles.filePath, !isSelected && styles.filePathDisabled]}
                        >
                          {file.path}
                        </Text>
                      </View>
                      <View style={styles.fileMetadata}>
                        <Text style={styles.fileLanguage}>{file.language || 'text'}</Text>
                        <Text style={styles.fileLines}>
                          {file.content.split('\n').length} lines
                        </Text>
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color="#AAA"
                        />
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* File Content Preview */}
                  {isExpanded && (
                    <View style={styles.fileContent}>
                      <ScrollView
                        horizontal
                        style={styles.codeScroll}
                        showsHorizontalScrollIndicator={true}
                      >
                        <Text style={styles.codeText}>{file.content}</Text>
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
              <Ionicons name="add-circle" size={18} color="#FFF" />
              <Text style={styles.createButtonText}>
                Create {selectedFiles.size > 0 ? `(${selectedFiles.size})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modal: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    width: '95%',
    maxHeight: '90%',
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
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  closeButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#2D2D2D',
  },
  summaryContainer: {
    padding: 16,
    backgroundColor: '#252525',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  summaryText: {
    color: '#DDD',
    fontSize: 14,
    lineHeight: 20,
  },
  fileList: {
    flex: 1,
    padding: 12,
  },
  selectAllContainer: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectAllText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '600',
  },
  fileItem: {
    marginBottom: 12,
    backgroundColor: '#252525',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  fileCheckbox: {
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  filePath: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  filePathDisabled: {
    color: '#666',
  },
  fileMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileLanguage: {
    color: '#E91E63',
    fontSize: 12,
    fontWeight: '600',
  },
  fileLines: {
    color: '#AAA',
    fontSize: 12,
  },
  fileContent: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#0D1117',
  },
  codeScroll: {
    maxHeight: 200,
    padding: 12,
  },
  codeText: {
    color: '#E6EDF3',
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2D2D2D',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  cancelButtonText: {
    color: '#AAA',
    fontSize: 14,
    fontWeight: 'bold',
  },
  createButton: {
    flex: 2,
    backgroundColor: '#E91E63',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#444',
    opacity: 0.5,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
