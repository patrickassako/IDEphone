import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { FileBrowser } from '../components/FileBrowser';
import { CodeEditor } from '../components/CodeEditor';
import { TabBar } from '../components/TabBar';
import { GitPanel } from '../components/GitPanel';
import { useEditor } from '../contexts/EditorContext';
import { FileItem, TabItem } from '../types';
import { FileSystemService } from '../services/FileSystemService';

const { width } = Dimensions.get('window');

export const EditorScreen: React.FC = () => {
  const [showFileBrowser, setShowFileBrowser] = useState(true);
  const [showGitPanel, setShowGitPanel] = useState(false);
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
      } catch (error) {
        console.error('Error opening file:', error);
      }
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

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
        {showFileBrowser && (
          <View style={styles.sidebar}>
            <FileBrowser onFileSelect={handleFileSelect} />
          </View>
        )}

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
            />
          ) : (
            <View style={styles.emptyState}>
              {/* TODO: Add empty state component */}
            </View>
          )}
        </View>

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
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: width * 0.3,
    borderRightWidth: 1,
    borderRightColor: '#333',
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
  },
});
