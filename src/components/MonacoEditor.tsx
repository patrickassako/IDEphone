import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

interface MonacoEditorProps {
  filePath: string;
  fileName: string;
  initialContent?: string;
  language?: string;
  onContentChange?: (content: string, isDirty: boolean) => void;
  onSave?: () => void;
  readOnly?: boolean;
  theme?: 'vs-dark' | 'vs-light' | 'hc-black';
}

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  filePath,
  fileName,
  initialContent = '',
  language = 'javascript',
  onContentChange,
  onSave,
  readOnly = false,
  theme = 'vs-dark',
}) => {
  const [content, setContent] = useState(initialContent);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    setContent(initialContent);
    updateEditorContent(initialContent);
  }, [initialContent]);

  useEffect(() => {
    updateEditorLanguage(language);
  }, [language]);

  useEffect(() => {
    updateEditorTheme(theme);
  }, [theme]);

  useEffect(() => {
    updateReadOnlyMode(readOnly);
  }, [readOnly]);

  const updateEditorContent = (newContent: string) => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.editor) {
          window.editor.setValue(${JSON.stringify(newContent)});
        }
        true;
      `);
    }
  };

  const updateEditorLanguage = (lang: string) => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.editor && monaco) {
          const model = window.editor.getModel();
          if (model) {
            monaco.editor.setModelLanguage(model, ${JSON.stringify(lang)});
          }
        }
        true;
      `);
    }
  };

  const updateEditorTheme = (newTheme: string) => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (monaco) {
          monaco.editor.setTheme(${JSON.stringify(newTheme)});
        }
        true;
      `);
    }
  };

  const updateReadOnlyMode = (readonly: boolean) => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.editor) {
          window.editor.updateOptions({ readOnly: ${readonly} });
        }
        true;
      `);
    }
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case 'contentChanged':
          setContent(data.content);
          setIsDirty(true);
          onContentChange?.(data.content, true);
          break;
        case 'ready':
          setIsLoading(false);
          break;
        case 'save':
          handleSave();
          break;
      }
    } catch (error) {
      console.error('Error handling message from WebView:', error);
    }
  };

  const handleSave = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.editor) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'saveContent',
            content: window.editor.getValue()
          }));
        }
        true;
      `);
    }
  };

  const receiveSaveContent = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'saveContent') {
        setIsDirty(false);
        onContentChange?.(data.content, false);
        onSave?.();
      }
    } catch (error) {
      console.error('Error saving content:', error);
    }
  };

  const monacoHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
        * { margin: 0; padding: 0; }
        html, body {
            height: 100%;
            overflow: hidden;
            background: #1e1e1e;
        }
        #container {
            width: 100%;
            height: 100%;
        }
    </style>
</head>
<body>
    <div id="container"></div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js"></script>
    <script>
        require.config({
            paths: {
                vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs'
            }
        });

        require(['vs/editor/editor.main'], function() {
            window.editor = monaco.editor.create(document.getElementById('container'), {
                value: ${JSON.stringify(initialContent)},
                language: ${JSON.stringify(language)},
                theme: ${JSON.stringify(theme)},
                readOnly: ${readOnly},
                automaticLayout: true,
                fontSize: 14,
                lineNumbers: 'on',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                formatOnPaste: true,
                formatOnType: true,
                autoIndent: 'full',
                tabSize: 2,
                insertSpaces: true,
                renderWhitespace: 'selection',
                bracketPairColorization: { enabled: true },
                guides: {
                    bracketPairs: true,
                    indentation: true
                },
                suggest: {
                    showKeywords: true,
                    showSnippets: true
                },
                quickSuggestions: {
                    other: true,
                    comments: true,
                    strings: true
                }
            });

            // Send content changes to React Native
            window.editor.onDidChangeModelContent(() => {
                const content = window.editor.getValue();
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'contentChanged',
                    content: content
                }));
            });

            // Handle Cmd/Ctrl+S for save
            window.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'save'
                }));
            });

            // Notify React Native that editor is ready
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'ready'
            }));
        });
    </script>
</body>
</html>
  `;

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.fileInfo}>
          <Text style={styles.fileName}>{fileName}</Text>
          {isDirty && !readOnly && <Text style={styles.dirtyIndicator}>●</Text>}
          {readOnly && (
            <View style={styles.readOnlyBadge}>
              <Ionicons name="lock-closed" size={12} color="#FFD700" />
              <Text style={styles.readOnlyText}>Read-only</Text>
            </View>
          )}
        </View>
        <View style={styles.toolbarButtons}>
          {!readOnly && (
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
              <Text style={[styles.buttonText, !isDirty && styles.disabledText]}>
                Save
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading editor...</Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ html: monacoHTML }}
        onMessage={(event) => {
          handleMessage(event);
          receiveSaveContent(event);
        }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={false}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      />

      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          {language.toUpperCase()} • Monaco Editor
        </Text>
        <Text style={styles.statusText}>
          {isDirty ? 'Modified' : 'Saved'}
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
  readOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3D3D00',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginLeft: 8,
  },
  readOnlyText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  toolbarButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  saveButton: {
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
  },
  buttonText: {
    color: '#4A90E2',
    fontSize: 12,
    marginLeft: 5,
    fontWeight: 'bold',
  },
  disabledText: {
    color: '#666',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    zIndex: 1000,
  },
  loadingText: {
    color: '#AAA',
    marginTop: 10,
    fontSize: 14,
  },
  webview: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    backgroundColor: '#007ACC',
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
  },
});
