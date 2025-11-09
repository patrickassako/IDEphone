/**
 * Code Viewer Component
 * Displays generated files with syntax highlighting
 * Lightweight implementation using styled text
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Clipboard,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GeneratedFile } from '../services/ai/MultiFileGenerator';

interface CodeViewerProps {
  files: GeneratedFile[];
  onClose: () => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ files, onClose }) => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const selectedFile = files[selectedFileIndex];

  const handleCopyCode = () => {
    Clipboard.setString(selectedFile.content);
    Alert.alert('Copied!', 'Code copied to clipboard');
  };

  const getFileIcon = (path: string): string => {
    if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'logo-typescript';
    if (path.endsWith('.js') || path.endsWith('.jsx')) return 'logo-javascript';
    if (path.endsWith('.json')) return 'document-text';
    if (path.endsWith('.css')) return 'color-palette';
    if (path.endsWith('.html')) return 'logo-html5';
    if (path.endsWith('.md')) return 'document';
    return 'document-outline';
  };

  const highlightSyntax = (code: string, language: string): React.ReactElement[] => {
    const lines = code.split('\n');
    return lines.map((line, index) => {
      // Simple syntax highlighting using regex
      const tokens: React.ReactElement[] = [];
      let lastIndex = 0;

      // Keywords
      const keywordRegex = /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|default|interface|type|async|await|try|catch)\b/g;
      let match;

      // Create a copy of line to work with
      let remainingLine = line;
      let offset = 0;

      // Find all keywords
      const keywordMatches: Array<{ start: number; end: number; text: string }> = [];
      while ((match = keywordRegex.exec(line)) !== null) {
        keywordMatches.push({ start: match.index, end: match.index + match[0].length, text: match[0] });
      }

      // Find strings
      const stringRegex = /(['"`])(?:(?=(\\?))\2.)*?\1/g;
      const stringMatches: Array<{ start: number; end: number; text: string }> = [];
      while ((match = stringRegex.exec(line)) !== null) {
        stringMatches.push({ start: match.index, end: match.index + match[0].length, text: match[0] });
      }

      // Find comments
      const commentRegex = /(\/\/.*$|\/\*[\s\S]*?\*\/)/g;
      const commentMatches: Array<{ start: number; end: number; text: string }> = [];
      while ((match = commentRegex.exec(line)) !== null) {
        commentMatches.push({ start: match.index, end: match.index + match[0].length, text: match[0] });
      }

      // Combine and sort all matches
      const allMatches = [
        ...keywordMatches.map(m => ({ ...m, type: 'keyword' })),
        ...stringMatches.map(m => ({ ...m, type: 'string' })),
        ...commentMatches.map(m => ({ ...m, type: 'comment' })),
      ].sort((a, b) => a.start - b.start);

      // Build highlighted line
      let currentIndex = 0;
      allMatches.forEach((match, i) => {
        // Add text before match
        if (match.start > currentIndex) {
          tokens.push(
            <Text key={`text-${i}`} style={styles.codeText}>
              {line.substring(currentIndex, match.start)}
            </Text>
          );
        }

        // Add highlighted match
        const style = match.type === 'keyword' ? styles.keyword :
                     match.type === 'string' ? styles.string :
                     styles.comment;

        tokens.push(
          <Text key={`match-${i}`} style={[styles.codeText, style]}>
            {match.text}
          </Text>
        );

        currentIndex = match.end;
      });

      // Add remaining text
      if (currentIndex < line.length) {
        tokens.push(
          <Text key={`end-${index}`} style={styles.codeText}>
            {line.substring(currentIndex)}
          </Text>
        );
      }

      return (
        <View key={index} style={styles.codeLine}>
          <Text style={styles.lineNumber}>{(index + 1).toString().padStart(3, ' ')}</Text>
          <Text style={styles.codeLineContent}>
            {tokens.length > 0 ? tokens : <Text style={styles.codeText}>{line}</Text>}
          </Text>
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="code-slash" size={24} color="#2EAADC" />
          <Text style={styles.headerTitle}>Code Viewer</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
            <Ionicons name="copy-outline" size={20} color="#2EAADC" />
            <Text style={styles.copyButtonText}>Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#AAA" />
          </TouchableOpacity>
        </View>
      </View>

      {/* File Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {files.map((file, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.tab, selectedFileIndex === index && styles.tabActive]}
            onPress={() => setSelectedFileIndex(index)}
          >
            <Ionicons
              name={getFileIcon(file.path) as any}
              size={16}
              color={selectedFileIndex === index ? '#2EAADC' : '#666'}
            />
            <Text
              style={[styles.tabText, selectedFileIndex === index && styles.tabTextActive]}
              numberOfLines={1}
            >
              {file.path.split('/').pop()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Code Content */}
      <View style={styles.codeContainer}>
        <View style={styles.filePathBar}>
          <Ionicons name="folder-outline" size={14} color="#666" />
          <Text style={styles.filePath}>{selectedFile.path}</Text>
        </View>

        <ScrollView
          style={styles.codeScroll}
          contentContainerStyle={styles.codeContent}
          showsVerticalScrollIndicator={true}
        >
          {highlightSyntax(selectedFile.content, selectedFile.language || 'javascript')}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2D2D2D',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  copyButtonText: {
    color: '#2EAADC',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2EAADC',
  },
  tabText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 120,
  },
  tabTextActive: {
    color: '#2EAADC',
  },
  codeContainer: {
    flex: 1,
  },
  filePathBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#252525',
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
  },
  filePath: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  codeScroll: {
    flex: 1,
  },
  codeContent: {
    padding: 16,
  },
  codeLine: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  lineNumber: {
    color: '#444',
    fontSize: 12,
    fontFamily: 'monospace',
    marginRight: 16,
    userSelect: 'none',
  },
  codeLineContent: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  codeText: {
    color: '#DDD',
    fontSize: 13,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  keyword: {
    color: '#FF79C6',
    fontWeight: '600',
  },
  string: {
    color: '#50FA7B',
  },
  comment: {
    color: '#6272A4',
    fontStyle: 'italic',
  },
});
