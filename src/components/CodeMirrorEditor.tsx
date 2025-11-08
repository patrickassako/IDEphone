import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

interface CodeMirrorEditorProps {
  filePath: string;
  fileName: string;
  initialContent?: string;
  language?: string;
  onContentChange?: (content: string, isDirty: boolean) => void;
  onSave?: () => void;
  readOnly?: boolean;
  theme?: 'dark' | 'light';
}

export const CodeMirrorEditor: React.FC<CodeMirrorEditorProps> = ({
  filePath,
  fileName,
  initialContent = '',
  language = 'javascript',
  onContentChange,
  onSave,
  readOnly = false,
  theme = 'dark',
}) => {
  const [content, setContent] = useState(initialContent);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

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
        case 'saveContent':
          setIsDirty(false);
          onContentChange?.(data.content, false);
          onSave?.();
          break;
      }
    } catch (error) {
      console.error('Error handling message from WebView:', error);
    }
  };

  const handleSave = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.editorView) {
          const content = window.editorView.state.doc.toString();
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'saveContent',
            content: content
          }));
        }
        true;
      `);
    }
  };

  const codeMirrorHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #editor {
            height: 100%;
            width: 100%;
            overflow: hidden;
        }
        body {
            background: ${theme === 'dark' ? '#1e1e1e' : '#ffffff'};
            font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
            touch-action: manipulation;
        }
        #editor {
            font-size: 14px;
            line-height: 1.5;
        }
        .cm-editor {
            height: 100%;
            background: ${theme === 'dark' ? '#1e1e1e' : '#ffffff'};
        }
        .cm-scroller {
            overflow: auto;
            -webkit-overflow-scrolling: touch;
        }
        .cm-content {
            padding: 10px;
            caret-color: ${theme === 'dark' ? '#ffffff' : '#000000'};
        }
        .cm-line {
            padding: 0;
        }
        .cm-gutters {
            background: ${theme === 'dark' ? '#252525' : '#f5f5f5'};
            border-right: 1px solid ${theme === 'dark' ? '#333' : '#ddd'};
            color: ${theme === 'dark' ? '#858585' : '#999'};
        }

        /* Syntax highlighting */
        .cm-keyword { color: #569cd6; }
        .cm-string { color: #ce9178; }
        .cm-comment { color: #6a9955; font-style: italic; }
        .cm-number { color: #b5cea8; }
        .cm-variableName { color: #9cdcfe; }
        .cm-propertyName { color: #9cdcfe; }
        .cm-operator { color: #d4d4d4; }
        .cm-bracket { color: #ffd700; }
        .cm-tag { color: #569cd6; }
        .cm-attributeName { color: #9cdcfe; }
        .cm-function { color: #dcdcaa; }
        .cm-className { color: #4ec9b0; }
        .cm-typeName { color: #4ec9b0; }
    </style>
</head>
<body>
    <div id="editor"></div>

    <script type="module">
        import {EditorView, basicSetup} from 'https://cdn.jsdelivr.net/npm/codemirror@6.0.1/dist/index.js';
        import {javascript} from 'https://cdn.jsdelivr.net/npm/@codemirror/lang-javascript@6.2.2/dist/index.js';
        import {python} from 'https://cdn.jsdelivr.net/npm/@codemirror/lang-python@6.1.6/dist/index.js';
        import {html} from 'https://cdn.jsdelivr.net/npm/@codemirror/lang-html@6.4.9/dist/index.js';
        import {css} from 'https://cdn.jsdelivr.net/npm/@codemirror/lang-css@6.3.0/dist/index.js';
        import {json} from 'https://cdn.jsdelivr.net/npm/@codemirror/lang-json@6.0.1/dist/index.js';
        import {markdown} from 'https://cdn.jsdelivr.net/npm/@codemirror/lang-markdown@6.3.0/dist/index.js';
        import {EditorState} from 'https://cdn.jsdelivr.net/npm/@codemirror/state@6.4.1/dist/index.js';
        import {keymap} from 'https://cdn.jsdelivr.net/npm/@codemirror/view@6.34.1/dist/index.js';

        // Language map
        const languages = {
            javascript: javascript(),
            typescript: javascript({typescript: true}),
            jsx: javascript({jsx: true}),
            tsx: javascript({typescript: true, jsx: true}),
            python: python(),
            html: html(),
            css: css(),
            json: json(),
            markdown: markdown(),
        };

        const lang = ${JSON.stringify(language)};
        const langExtension = languages[lang] || languages.javascript;

        // Save command
        const saveCommand = keymap.of([{
            key: 'Mod-s',
            preventDefault: true,
            run: () => {
                window.ReactNativeWebView.postMessage(JSON.stringify({type: 'save'}));
                return true;
            }
        }]);

        // Create editor
        window.editorView = new EditorView({
            doc: ${JSON.stringify(initialContent)},
            extensions: [
                basicSetup,
                langExtension,
                saveCommand,
                EditorView.lineWrapping,
                EditorState.readOnly.of(${readOnly}),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        const content = update.state.doc.toString();
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'contentChanged',
                            content: content
                        }));
                    }
                }),
            ],
            parent: document.getElementById('editor')
        });

        // Focus editor on mobile tap
        document.getElementById('editor').addEventListener('touchstart', (e) => {
            window.editorView.focus();
        }, {passive: true});

        // Notify ready
        window.ReactNativeWebView.postMessage(JSON.stringify({type: 'ready'}));
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
          <Text style={styles.loadingText}>Loading CodeMirror...</Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ html: codeMirrorHTML }}
        onMessage={handleMessage}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={false}
        scrollEnabled={true}
        showsVerticalScrollIndicator={true}
        showsHorizontalScrollIndicator={false}
        keyboardDisplayRequiresUserAction={false}
        automaticallyAdjustContentInsets={false}
        bounces={false}
      />

      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          {language.toUpperCase()} • CodeMirror 6
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
