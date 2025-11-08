import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

interface LightEditorProps {
  filePath: string;
  fileName: string;
  initialContent?: string;
  language?: string;
  onContentChange?: (content: string, isDirty: boolean) => void;
  onSave?: () => void;
  readOnly?: boolean;
  theme?: 'dark' | 'light';
}

export const LightEditor: React.FC<LightEditorProps> = ({
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
    // Update editor content when initialContent changes
    if (webViewRef.current && initialContent) {
      const escapedContent = initialContent
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$/g, '\\$');
      webViewRef.current.injectJavaScript(`
        if (window.editorReady && document.getElementById('editor')) {
          document.getElementById('editor').value = \`${escapedContent}\`;
          updateHighlighting();
        }
        true;
      `);
    }
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
        const content = document.getElementById('editor').value;
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'saveContent',
          content: content
        }));
        true;
      `);
    }
  };

  const editorHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body {
            height: 100%;
            width: 100%;
            overflow: hidden;
            background: ${theme === 'dark' ? '#1e1e1e' : '#ffffff'};
        }

        #container {
            display: flex;
            height: 100%;
            width: 100%;
        }

        #line-numbers {
            background: ${theme === 'dark' ? '#252525' : '#f5f5f5'};
            color: ${theme === 'dark' ? '#858585' : '#999'};
            padding: 12px 8px;
            text-align: right;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            line-height: 22px;
            user-select: none;
            overflow: hidden;
            min-width: 50px;
            white-space: pre;
        }

        #editor-wrapper {
            flex: 1;
            position: relative;
            overflow: hidden;
        }

        #editor {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            padding: 12px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            line-height: 22px;
            background: transparent;
            color: ${theme === 'dark' ? '#d4d4d4' : '#000000'};
            border: none;
            outline: none;
            resize: none;
            z-index: 2;
            caret-color: ${theme === 'dark' ? '#ffffff' : '#000000'};
            -webkit-text-fill-color: transparent;
        }

        #highlight {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            padding: 12px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            line-height: 22px;
            white-space: pre-wrap;
            word-wrap: break-word;
            overflow: auto;
            pointer-events: none;
            z-index: 1;
        }

        #editor:focus {
            outline: none;
        }

        /* Prism theme overrides */
        pre[class*="language-"] {
            margin: 0;
            padding: 0;
            background: transparent;
        }

        code[class*="language-"] {
            background: transparent;
            text-shadow: none;
        }
    </style>
</head>
<body>
    <div id="container">
        <div id="line-numbers"></div>
        <div id="editor-wrapper">
            <pre id="highlight"><code id="highlighting" class="language-${language}"></code></pre>
            <textarea
                id="editor"
                spellcheck="false"
                autocapitalize="off"
                autocomplete="off"
                autocorrect="off"
                ${readOnly ? 'readonly' : ''}
            ></textarea>
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-typescript.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-jsx.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-tsx.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-css.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-markup.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-json.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-markdown.min.js"></script>

    <script>
        const editor = document.getElementById('editor');
        const highlighting = document.getElementById('highlighting');
        const highlightDiv = document.getElementById('highlight');
        const lineNumbers = document.getElementById('line-numbers');

        function updateLineNumbers() {
            const lines = editor.value.split('\\n').length;
            lineNumbers.innerHTML = Array.from({length: lines}, (_, i) => i + 1).join('\\n');
        }

        function syncScroll() {
            highlightDiv.scrollTop = editor.scrollTop;
            highlightDiv.scrollLeft = editor.scrollLeft;
            lineNumbers.scrollTop = editor.scrollTop;
        }

        function updateHighlighting() {
            const text = editor.value;

            if (text[text.length - 1] === '\\n') {
                highlighting.innerHTML = Prism.highlight(text + ' ', Prism.languages.${language} || Prism.languages.javascript, '${language}');
            } else {
                highlighting.innerHTML = Prism.highlight(text, Prism.languages.${language} || Prism.languages.javascript, '${language}');
            }

            updateLineNumbers();
            syncScroll();
        }

        editor.addEventListener('input', (e) => {
            updateHighlighting();
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'contentChanged',
                content: editor.value
            }));
        });

        editor.addEventListener('scroll', syncScroll);

        editor.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                window.ReactNativeWebView.postMessage(JSON.stringify({type: 'save'}));
            }

            // Tab key handling
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = editor.selectionStart;
                const end = editor.selectionEnd;
                editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end);
                editor.selectionStart = editor.selectionEnd = start + 2;
                updateHighlighting();
            }
        });

        // Set initial content
        const initialContent = ${JSON.stringify(initialContent)};
        if (initialContent) {
            editor.value = initialContent;
            updateHighlighting();
        }

        // Mark editor as ready
        window.editorReady = true;

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
        source={{ html: editorHTML }}
        onMessage={handleMessage}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={false}
        bounces={false}
        keyboardDisplayRequiresUserAction={false}
        automaticallyAdjustContentInsets={false}
      />

      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          {language.toUpperCase()} • Syntax Highlighted
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
