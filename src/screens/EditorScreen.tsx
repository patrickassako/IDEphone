import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FileBrowser } from '../components/FileBrowser';
import { CodeEditor } from '../components/CodeEditor';
import { TabBar } from '../components/TabBar';
import { GitPanel } from '../components/GitPanel';
import { useEditor } from '../contexts/EditorContext';
import { FileItem, TabItem } from '../types';
import { FileSystemService } from '../services/FileSystemService';

const { width } = Dimensions.get('window');

type LayoutMode = 'split' | 'editor-only' | 'browser-only';

export const EditorScreen: React.FC = () => {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('split');
  const [showGitPanel, setShowGitPanel] = useState(false);
  const [readOnlyMode, setReadOnlyMode] = useState(false);
  const { tabs, activeTabId, addTab, removeTab, updateTab, setActiveTab, getActiveTab } =
    useEditor();

  const handleFileSelect = async (file: FileItem) => {
    if (file.type === 'file') {
      try {
        const content = await FileSystemService.readFile(file.path);
        const language = FileSystemService.getLanguageFromFileName(file.name);

        const newTab: TabItem = {
          id: `${file.path}-${Date.now()}`,
          name: file.name,
          path: file.path,
          content,
          isDirty: false,
          language,
        };

        addTab(newTab);

        // Switch to editor view when file is selected (on small screens)
        if (layoutMode === 'browser-only') {
          setLayoutMode('split');
        }
      } catch (error) {
        console.error('Error opening file:', error);
      }
    }
  };

  const toggleLayoutMode = () => {
    if (layoutMode === 'split') {
      setLayoutMode('editor-only');
    } else if (layoutMode === 'editor-only') {
      setLayoutMode('browser-only');
    } else {
      setLayoutMode('split');
    }
  };

  const handleTabClose = (id: string) => {
    const tab = tabs.find((t) => t.id === id);
    if (tab?.isDirty) {
      // TODO: Show confirmation dialog
    }
    removeTab(id);
  };

  const handleContentChange = (content: string, isDirty: boolean) => {
    if (activeTabId) {
      updateTab(activeTabId, { content, isDirty });
    }
  };

  const activeTab = getActiveTab();

  const showBrowser = layoutMode === 'browser-only' || layoutMode === 'split';
  const showEditor = layoutMode === 'editor-only' || layoutMode === 'split';

  return (
    <View style={styles.container}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolbarButton} onPress={toggleLayoutMode}>
          <Ionicons
            name={
              layoutMode === 'split'
                ? 'contract'
                : layoutMode === 'editor-only'
                ? 'folder-open'
                : 'code-slash'
            }
            size={20}
            color="#4A90E2"
          />
          <Text style={styles.toolbarButtonText}>
            {layoutMode === 'split'
              ? 'Split'
              : layoutMode === 'editor-only'
              ? 'Editor'
              : 'Browser'}
          </Text>
        </TouchableOpacity>

        {showEditor && activeTab && (
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => setReadOnlyMode(!readOnlyMode)}
          >
            <Ionicons
              name={readOnlyMode ? 'lock-closed' : 'lock-open'}
              size={20}
              color={readOnlyMode ? '#FFD700' : '#4A90E2'}
            />
            <Text style={styles.toolbarButtonText}>
              {readOnlyMode ? 'Read-only' : 'Edit'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.mainContent}>
        {showBrowser && (
          <View
            style={[
              styles.sidebar,
              layoutMode === 'browser-only' && styles.fullWidth,
            ]}
          >
            <FileBrowser
              onFileSelect={handleFileSelect}
              fullscreen={layoutMode === 'browser-only'}
            />
          </View>
        )}

        {showEditor && (
          <View style={styles.editorArea}>
            {tabs.length > 0 && (
              <TabBar
                tabs={tabs}
                activeTabId={activeTabId}
                onTabPress={setActiveTab}
                onTabClose={handleTabClose}
              />
            )}

            {activeTab ? (
              <CodeEditor
                key={activeTab.id}
                filePath={activeTab.path}
                fileName={activeTab.name}
                initialContent={activeTab.content}
                onContentChange={handleContentChange}
                onSave={() => {
                  if (activeTabId) {
                    updateTab(activeTabId, { isDirty: false });
                  }
                }}
                readOnly={readOnlyMode}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={64} color="#666" />
                <Text style={styles.emptyStateText}>
                  Select a file to start editing
                </Text>
              </View>
            )}
          </View>
        )}

        {showGitPanel && (
          <View style={styles.gitSidebar}>
            <GitPanel />
          </View>
        )}
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
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#2D2D2D',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    gap: 10,
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1E1E1E',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  toolbarButtonText: {
    color: '#4A90E2',
    fontSize: 12,
    marginLeft: 5,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: width * 0.35,
    borderRightWidth: 1,
    borderRightColor: '#333',
  },
  fullWidth: {
    width: '100%',
    borderRightWidth: 0,
  },
  editorArea: {
    flex: 1,
  },
  gitSidebar: {
    width: width * 0.3,
    borderLeftWidth: 1,
    borderLeftColor: '#333',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
    marginTop: 15,
  },
});
