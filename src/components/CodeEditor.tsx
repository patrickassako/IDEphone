import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FileSystemService } from '../services/FileSystemService';

interface CodeEditorProps {
  filePath: string;
  fileName: string;
  initialContent?: string;
  onContentChange?: (content: string, isDirty: boolean) => void;
  onSave?: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  filePath,
  fileName,
  initialContent = '',
  onContentChange,
  onSave,
}) => {
  const [content, setContent] = useState(initialContent);
  const [isDirty, setIsDirty] = useState(false);
  const [lineCount, setLineCount] = useState(1);
  const [fontSize, setFontSize] = useState(14);

  useEffect(() => {
    loadFile();
  }, [filePath]);

  const loadFile = async () => {
    try {
      const fileContent = await FileSystemService.readFile(filePath);
      setContent(fileContent);
      setIsDirty(false);
      updateLineCount(fileContent);
    } catch (error) {
      console.error('Error loading file:', error);
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setIsDirty(true);
    updateLineCount(newContent);
    onContentChange?.(newContent, true);
  };

  const updateLineCount = (text: string) => {
    const lines = text.split('\n').length;
    setLineCount(lines);
  };

  const handleSave = async () => {
    try {
      await FileSystemService.writeFile(filePath, content);
      setIsDirty(false);
      onContentChange?.(content, false);
      onSave?.();
    } catch (error) {
      console.error('Error saving file:', error);
    }
  };

  const increaseFontSize = () => {
    setFontSize((prev) => Math.min(prev + 2, 24));
  };

  const decreaseFontSize = () => {
    setFontSize((prev) => Math.max(prev - 2, 10));
  };

  const renderLineNumbers = () => {
    return (
      <View style={styles.lineNumberContainer}>
        {Array.from({ length: lineCount }, (_, i) => (
          <Text key={i} style={[styles.lineNumber, { fontSize }]}>
            {i + 1}
          </Text>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.fileInfo}>
          <Text style={styles.fileName}>{fileName}</Text>
          {isDirty && <Text style={styles.dirtyIndicator}>●</Text>}
        </View>
        <View style={styles.toolbarButtons}>
          <TouchableOpacity style={styles.toolbarButton} onPress={decreaseFontSize}>
            <Ionicons name="remove-circle-outline" size={20} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.fontSizeText}>{fontSize}</Text>
          <TouchableOpacity style={styles.toolbarButton} onPress={increaseFontSize}>
            <Ionicons name="add-circle-outline" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toolbarButton, styles.saveButton]}
            onPress={handleSave}
            disabled={!isDirty}
          >
            <Ionicons
              name="save"
              size={20}
              color={isDirty ? '#4A90E2' : '#666'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.editorContainer}>
        <ScrollView
          style={styles.lineNumberScroll}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        >
          {renderLineNumbers()}
        </ScrollView>

        <ScrollView style={styles.codeScroll} nestedScrollEnabled>
          <TextInput
            style={[styles.codeInput, { fontSize }]}
            value={content}
            onChangeText={handleContentChange}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            textAlignVertical="top"
            scrollEnabled={false}
          />
        </ScrollView>
      </View>

      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          Lines: {lineCount} | Size: {fontSize}px
        </Text>
        <Text style={styles.statusText}>
          {FileSystemService.getLanguageFromFileName(fileName)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#2D2D2D',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dirtyIndicator: {
    color: '#4A90E2',
    marginLeft: 5,
    fontSize: 20,
  },
  toolbarButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarButton: {
    marginLeft: 10,
    padding: 5,
  },
  fontSizeText: {
    color: '#FFF',
    fontSize: 12,
    marginHorizontal: 5,
  },
  saveButton: {
    marginLeft: 15,
  },
  editorContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  lineNumberContainer: {
    backgroundColor: '#252525',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  lineNumber: {
    color: '#858585',
    fontFamily: 'monospace',
    textAlign: 'right',
    lineHeight: 20,
  },
  lineNumberScroll: {
    maxWidth: 60,
  },
  codeScroll: {
    flex: 1,
  },
  codeInput: {
    flex: 1,
    color: '#D4D4D4',
    fontFamily: 'monospace',
    padding: 10,
    lineHeight: 20,
    minHeight: Dimensions.get('window').height,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 5,
    backgroundColor: '#007ACC',
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
  },
});
