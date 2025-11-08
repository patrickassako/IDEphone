import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FileBrowser } from '../components/FileBrowser';
import { SmartEditor } from '../components/SmartEditor';
import { TabBar } from '../components/TabBar';
import { GitPanel } from '../components/GitPanel';
import { AIAssistantDrawer } from '../components/AIAssistantDrawer';
import { CodeActionMenu, CodeAction } from '../components/CodeActionMenu';
import { AIResultModal } from '../components/AIResultModal';
import { FilePreviewModal } from '../components/FilePreviewModal';
import { ProjectGeneratorModal, ProjectConfig } from '../components/ProjectGeneratorModal';
import { StreamingConsole, StreamMessage, FileTreeNode } from '../components/StreamingConsole';
import { useEditor } from '../contexts/EditorContext';
import { FileItem, TabItem } from '../types';
import { FileSystemService } from '../services/FileSystemService';
import { PreferencesService } from '../services/PreferencesService';
import { AIService, AIContextBuilder } from '../services/ai';
import { MultiFileGenerator, GeneratedFile } from '../services/ai/MultiFileGenerator';
import { StreamingProjectGenerator } from '../services/ai/StreamingProjectGenerator';

const { width } = Dimensions.get('window');

type LayoutMode = 'split' | 'editor-only' | 'browser-only';

export const EditorScreen: React.FC = () => {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('split');
  const [showGitPanel, setShowGitPanel] = useState(false);
  const [readOnlyMode, setReadOnlyMode] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);

  // Code action states
  const [selectedText, setSelectedText] = useState('');
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [aiResultTitle, setAiResultTitle] = useState('');
  const [aiResultContent, setAiResultContent] = useState('');
  const [aiResultCodeBlocks, setAiResultCodeBlocks] = useState<Array<{ language: string; code: string }>>([]);
  const [isAILoading, setIsAILoading] = useState(false);

  // Multi-file generation states
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [generationSummary, setGenerationSummary] = useState<string>('');

  // Project Generator states
  const [showProjectGenerator, setShowProjectGenerator] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamMessages, setStreamMessages] = useState<StreamMessage[]>([]);
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState<number>();

  const { tabs, activeTabId, addTab, removeTab, updateTab, setActiveTab, getActiveTab } =
    useEditor();

  useEffect(() => {
    // Check if AI is enabled
    const checkAI = async () => {
      const enabled = await AIService.isEnabled();
      setAiEnabled(enabled && AIService.isConfigured());
    };
    checkAI();
  }, []);

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

  const handleTextSelection = (text: string, start: number, end: number) => {
    if (text.trim().length > 0 && aiEnabled) {
      setSelectedText(text);
      setSelectionStart(start);
      setSelectionEnd(end);
      setShowActionMenu(true);
    }
  };

  const handleCodeAction = async (action: CodeAction) => {
    if (!activeTab) return;

    const actionTitles: Record<CodeAction, string> = {
      fix: 'Fix Code',
      explain: 'Explain Code',
      refactor: 'Refactor Code',
      document: 'Add Documentation',
      generate: 'Generate Files',
    };

    const actionPrompts: Record<CodeAction, string> = {
      fix: 'Fix any bugs or issues in this code:\n\n',
      explain: 'Explain what this code does in simple terms:\n\n',
      refactor: 'Refactor this code to improve readability and performance:\n\n',
      document: 'Add clear, concise comments and documentation to this code:\n\n',
      generate: 'Based on this code or description, generate the necessary files for a complete implementation. Include all required files (components, tests, styles, etc.). Format each file as:\n\n```language:path/to/file.ext\ncode here\n```\n\nDescription:\n',
    };

    // Handle 'generate' action differently - it creates multiple files
    if (action === 'generate') {
      setAiResultTitle(actionTitles[action]);
      setAiResultContent('');
      setAiResultCodeBlocks([]);
      setIsAILoading(true);
      setShowResultModal(true);

      try {
        const context = AIContextBuilder.buildMinimal(
          activeTab.name,
          activeTab.content,
          selectedText
        );

        const response = await AIService.generateResponse(
          actionPrompts[action] + selectedText,
          context
        );

        // Parse the response to extract multiple files
        const parsed = MultiFileGenerator.parseResponse(response.content);

        if (parsed.hasMultipleFiles) {
          // Show file preview modal for multi-file generation
          setGeneratedFiles(parsed.files);
          setGenerationSummary(parsed.summary || 'Generated files based on your request');
          setShowResultModal(false);
          setShowFilePreview(true);
        } else {
          // Fallback: show regular result modal if no files were parsed
          setAiResultContent(response.content);
          setAiResultCodeBlocks(response.codeBlocks || []);
        }
      } catch (error: any) {
        setAiResultContent(`Error: ${error.message || 'Failed to get AI response'}`);
      } finally {
        setIsAILoading(false);
      }
      return;
    }

    // Handle other actions (fix, explain, refactor, document)
    setAiResultTitle(actionTitles[action]);
    setAiResultContent('');
    setAiResultCodeBlocks([]);
    setIsAILoading(true);
    setShowResultModal(true);

    try {
      const context = AIContextBuilder.buildMinimal(
        activeTab.name,
        activeTab.content,
        selectedText
      );

      const response = await AIService.generateResponse(
        actionPrompts[action] + selectedText,
        context
      );

      setAiResultContent(response.content);
      setAiResultCodeBlocks(response.codeBlocks || []);
    } catch (error: any) {
      setAiResultContent(`Error: ${error.message || 'Failed to get AI response'}`);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleApplyCode = (code: string) => {
    if (!activeTab || !activeTabId) return;

    const currentContent = activeTab.content;
    const newContent =
      currentContent.substring(0, selectionStart) +
      code +
      currentContent.substring(selectionEnd);

    updateTab(activeTabId, { content: newContent, isDirty: true });
  };

  const handleCreateFiles = async (filesToCreate: GeneratedFile[]) => {
    try {
      // Create directories and files
      for (const file of filesToCreate) {
        // Validate file path
        const validation = MultiFileGenerator.validateFilePath(file.path);
        if (!validation.valid) {
          console.error(`Invalid file path: ${file.path} - ${validation.error}`);
          continue;
        }

        // Get current working directory
        const currentDir = await FileSystemService.getCurrentDirectory();
        const fullPath = `${currentDir}/${file.path}`;

        // Create directory structure if needed
        const dirPath = fullPath.substring(0, fullPath.lastIndexOf('/'));
        await FileSystemService.ensureDirectoryExists(dirPath);

        // Write file
        await FileSystemService.writeFile(fullPath, file.content);

        // Open file in a new tab
        const newTab: TabItem = {
          id: `${fullPath}-${Date.now()}`,
          name: file.path.split('/').pop() || file.path,
          path: fullPath,
          content: file.content,
          isDirty: false,
          language: file.language || FileSystemService.getLanguageFromFileName(file.path),
        };

        addTab(newTab);
      }

      // Close preview modal
      setShowFilePreview(false);

      // Show success message (you could add a toast notification here)
      console.log(`Successfully created ${filesToCreate.length} files`);
    } catch (error: any) {
      console.error('Error creating files:', error);
      // You could show an error modal here
    }
  };

  const handleGenerateProject = async (config: ProjectConfig) => {
    // Reset states
    setStreamMessages([]);
    setFileTree([]);
    setGenerationProgress(0);
    setIsGenerating(true);

    // Create generator with event callbacks
    const generator = new StreamingProjectGenerator({
      onProgress: (percent, message) => {
        setGenerationProgress(percent);
        // Calculate estimated time (very rough)
        if (percent > 0 && percent < 100) {
          const remaining = Math.round((100 - percent) / 10);
          setEstimatedTime(remaining);
        }
      },
      onMessage: (message) => {
        setStreamMessages((prev) => [...prev, message]);
      },
      onFileStart: (path) => {
        // File start handled in onMessage
      },
      onFileComplete: (path, content) => {
        // File complete handled in onMessage
      },
      onDirectoryCreate: (path) => {
        // Directory handled in onMessage
      },
      onTreeUpdate: (tree) => {
        setFileTree(tree);
      },
      onComplete: async (files, summary) => {
        setEstimatedTime(undefined);
        setIsGenerating(false);

        // Create all files
        for (const file of files) {
          try {
            const currentDir = FileSystemService.getCurrentDirectory();
            const fullPath = `${currentDir}/${file.path}`;

            // Create directory if needed
            const dirPath = fullPath.substring(0, fullPath.lastIndexOf('/'));
            await FileSystemService.ensureDirectoryExists(dirPath);

            // Write file
            await FileSystemService.writeFile(fullPath, file.content);

            // Open in tab
            const newTab: TabItem = {
              id: `${fullPath}-${Date.now()}`,
              name: file.path.split('/').pop() || file.path,
              path: fullPath,
              content: file.content,
              isDirty: false,
              language: file.language || FileSystemService.getLanguageFromFileName(file.path),
            };

            addTab(newTab);
          } catch (error) {
            console.error(`Failed to create file ${file.path}:`, error);
          }
        }

        // Show success (could add confetti here later!)
        console.log('Project generated successfully!', summary);

        // Close generator modal after a delay
        setTimeout(() => {
          setShowProjectGenerator(false);
        }, 2000);
      },
      onError: (error) => {
        setIsGenerating(false);
        setEstimatedTime(undefined);
        console.error('Generation error:', error);
        alert(`Error: ${error}`);
      },
    });

    // Start generation
    try {
      await generator.generateProject(config);
    } catch (error) {
      console.error('Failed to generate project:', error);
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
          <>
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

            {aiEnabled && (
              <TouchableOpacity
                style={[styles.toolbarButton, styles.aiButton]}
                onPress={() => setShowAIAssistant(true)}
              >
                <Ionicons name="sparkles" size={20} color="#9F7AEA" />
                <Text style={[styles.toolbarButtonText, styles.aiButtonText]}>AI</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {aiEnabled && (
          <TouchableOpacity
            style={[styles.toolbarButton, styles.projectButton]}
            onPress={() => setShowProjectGenerator(true)}
          >
            <Ionicons name="rocket" size={20} color="#2EAADC" />
            <Text style={[styles.toolbarButtonText, styles.projectButtonText]}>New Project</Text>
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
              <SmartEditor
                key={activeTab.id}
                filePath={activeTab.path}
                fileName={activeTab.name}
                initialContent={activeTab.content}
                language={activeTab.language || 'text'}
                onContentChange={handleContentChange}
                onTextSelection={handleTextSelection}
                onSave={() => {
                  if (activeTabId) {
                    updateTab(activeTabId, { isDirty: false });
                  }
                }}
                readOnly={readOnlyMode}
                theme={PreferencesService.getEditorTheme()}
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

      {/* AI Assistant Drawer */}
      <AIAssistantDrawer
        visible={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        filePath={activeTab?.path}
        fileName={activeTab?.name}
        fileContent={activeTab?.content}
        onCodeInsert={(code) => {
          if (activeTabId) {
            updateTab(activeTabId, { content: code, isDirty: true });
          }
        }}
      />

      {/* Code Action Menu */}
      <CodeActionMenu
        visible={showActionMenu}
        onAction={handleCodeAction}
        onClose={() => setShowActionMenu(false)}
      />

      {/* AI Result Modal */}
      <AIResultModal
        visible={showResultModal}
        title={aiResultTitle}
        content={aiResultContent}
        codeBlocks={aiResultCodeBlocks}
        isLoading={isAILoading}
        onApply={handleApplyCode}
        onClose={() => setShowResultModal(false)}
      />

      {/* File Preview Modal for Multi-file Generation */}
      <FilePreviewModal
        visible={showFilePreview}
        files={generatedFiles}
        summary={generationSummary}
        onCreateFiles={handleCreateFiles}
        onClose={() => setShowFilePreview(false)}
      />

      {/* Project Generator Modal */}
      {!isGenerating ? (
        <ProjectGeneratorModal
          visible={showProjectGenerator}
          onClose={() => setShowProjectGenerator(false)}
          onGenerate={handleGenerateProject}
        />
      ) : (
        <Modal transparent visible={showProjectGenerator} animationType="none">
          <View style={styles.streamingContainer}>
            <View style={styles.streamingBackdrop} />
            <View style={styles.streamingContent}>
              <StreamingConsole
                messages={streamMessages}
                fileTree={fileTree}
                progress={generationProgress}
                estimatedTime={estimatedTime}
              />
            </View>
          </View>
        </Modal>
      )}
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
  aiButton: {
    borderColor: '#9F7AEA',
  },
  aiButtonText: {
    color: '#9F7AEA',
  },
  projectButton: {
    borderColor: '#2EAADC',
  },
  projectButtonText: {
    color: '#2EAADC',
  },
  streamingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streamingBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  streamingContent: {
    width: '95%',
    maxHeight: '90%',
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
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
