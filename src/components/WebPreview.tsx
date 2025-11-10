/**
 * Web Preview Component
 * Displays live preview of web projects using WebView
 * Shows rendered HTML/CSS/JS in real-time
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';

interface WebPreviewProps {
  projectPath: string;
  projectName: string;
  onClose: () => void;
}

export const WebPreview: React.FC<WebPreviewProps> = ({
  projectPath,
  projectName,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [error, setError] = useState<string>('');

  React.useEffect(() => {
    loadProjectContent();
  }, [projectPath]);

  const loadProjectContent = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Try to find index.html in common locations
      const possiblePaths = [
        `${projectPath}/index.html`,
        `${projectPath}/public/index.html`,
        `${projectPath}/src/index.html`,
        `${projectPath}/dist/index.html`,
        `${projectPath}/build/index.html`,
      ];

      let foundPath: string | null = null;
      for (const path of possiblePaths) {
        const info = await FileSystem.getInfoAsync(path);
        if (info.exists) {
          foundPath = path;
          console.log(`Found index.html at: ${path}`);
          break;
        }
      }

      if (foundPath) {
        const content = await FileSystem.readAsStringAsync(foundPath);

        // Try to load CSS files from various locations
        const cssPaths = [
          `${projectPath}/style.css`,
          `${projectPath}/styles.css`,
          `${projectPath}/src/index.css`,
          `${projectPath}/src/style.css`,
          `${projectPath}/src/styles.css`,
          `${projectPath}/public/style.css`,
        ];

        let cssContent = '';
        for (const cssPath of cssPaths) {
          const cssExists = await FileSystem.getInfoAsync(cssPath);
          if (cssExists.exists) {
            cssContent = await FileSystem.readAsStringAsync(cssPath);
            console.log(`Found CSS at: ${cssPath}`);
            break;
          }
        }

        // Inject CSS into HTML if found
        let modifiedHtml = content;
        if (cssContent) {
          if (content.includes('</head>')) {
            modifiedHtml = content.replace(
              '</head>',
              `<style>${cssContent}</style></head>`
            );
          } else {
            // No head tag, inject at beginning
            modifiedHtml = `<style>${cssContent}</style>${content}`;
          }
        }

        setHtmlContent(modifiedHtml);
      } else {
        // No HTML file found - generate a preview notice
        console.warn('No index.html found in project');
        setHtmlContent(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${projectName}</title>
              <style>
                body {
                  margin: 0;
                  padding: 40px;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  min-height: 100vh;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  text-align: center;
                }
                .container {
                  background: rgba(255,255,255,0.1);
                  padding: 60px 40px;
                  border-radius: 20px;
                  backdrop-filter: blur(10px);
                  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                }
                h1 {
                  font-size: 2.5rem;
                  margin: 0 0 20px 0;
                }
                p {
                  font-size: 1.2rem;
                  opacity: 0.9;
                }
                .badge {
                  display: inline-block;
                  background: rgba(255,255,255,0.2);
                  padding: 8px 16px;
                  border-radius: 20px;
                  margin-top: 20px;
                  font-size: 0.9rem;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>📱 ${projectName}</h1>
                <p>No HTML preview available</p>
                <p style="font-size: 0.9rem; opacity: 0.8; margin-top: 10px;">
                  This project doesn't have an index.html file in the root, public, src, dist, or build folders.
                </p>
                <div class="badge">Use "Test Live" or "Deploy & Test" for full preview</div>
              </div>
            </body>
          </html>
        `);
      }

      setIsLoading(false);
    } catch (err: any) {
      console.error('Error loading preview:', err);
      const errorMsg = err?.message || 'Unknown error';
      setError(`Failed to load preview: ${errorMsg}`);
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadProjectContent();
  };

  return (
    <Modal visible={true} animationType="slide">
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="phone-portrait-outline" size={24} color="#2EAADC" />
            <View>
              <Text style={styles.headerTitle}>Web Preview</Text>
              <Text style={styles.headerSubtitle}>{projectName}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
              <Ionicons name="refresh" size={20} color="#2EAADC" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#AAA" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Preview Area */}
        <View style={styles.previewContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2EAADC" />
              <Text style={styles.loadingText}>Loading preview...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color="#E53E3E" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <WebView
              source={{ html: htmlContent }}
              style={styles.webview}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('WebView error:', nativeEvent);
                setError('Failed to render preview');
              }}
            />
          )}
        </View>

        {/* Info Bar */}
        <View style={styles.infoBar}>
          <Ionicons name="information-circle" size={16} color="#666" />
          <Text style={styles.infoText}>
            Preview shows static HTML. Run dev server for full functionality.
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
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
  headerSubtitle: {
    color: '#AAA',
    fontSize: 13,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    padding: 8,
    backgroundColor: '#2D2D2D',
    borderRadius: 8,
  },
  closeButton: {
    padding: 4,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  loadingText: {
    color: '#AAA',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 20,
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#2EAADC',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#252525',
    borderTopWidth: 1,
    borderTopColor: '#2D2D2D',
  },
  infoText: {
    color: '#666',
    fontSize: 12,
    flex: 1,
  },
});
