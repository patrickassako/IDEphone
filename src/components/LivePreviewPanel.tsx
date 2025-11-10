/**
 * Live Preview Panel
 * Shows CodeSandbox embed in a WebView INSIDE the app
 * Like Lovable.dev - user stays in the app, no external browser
 */

import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

interface LivePreviewPanelProps {
  embedUrl: string;
  sandboxId: string;
  projectName: string;
  onClose: () => void;
  onRefresh?: () => void;
}

export const LivePreviewPanel: React.FC<LivePreviewPanelProps> = ({
  embedUrl,
  sandboxId,
  projectName,
  onClose,
  onRefresh,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  const handleRefresh = () => {
    webViewRef.current?.reload();
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleGoBack = () => {
    if (canGoBack) {
      webViewRef.current?.goBack();
    }
  };

  const handleGoForward = () => {
    if (canGoForward) {
      webViewRef.current?.goForward();
    }
  };

  const handleOpenInBrowser = () => {
    Alert.alert(
      'Open in Browser',
      `Sandbox ID: ${sandboxId}\n\nWould you like to open this in your default browser?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open',
          onPress: () => {
            const url = `https://codesandbox.io/s/${sandboxId}`;
            // User can copy and paste this URL
            Alert.alert('Sandbox URL', url);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        {/* Close Button */}
        <TouchableOpacity onPress={onClose} style={styles.toolbarButton}>
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>

        {/* Project Name */}
        <View style={styles.titleContainer}>
          <Text style={styles.projectName} numberOfLines={1}>
            {projectName}
          </Text>
          <Text style={styles.sandboxId}>CodeSandbox Live Preview</Text>
        </View>

        {/* Navigation Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            onPress={handleGoBack}
            style={[styles.toolbarButton, !canGoBack && styles.disabled]}
            disabled={!canGoBack}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={canGoBack ? '#FFF' : '#666'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleGoForward}
            style={[styles.toolbarButton, !canGoForward && styles.disabled]}
            disabled={!canGoForward}
          >
            <Ionicons
              name="arrow-forward"
              size={22}
              color={canGoForward ? '#FFF' : '#666'}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRefresh} style={styles.toolbarButton}>
            <Ionicons name="refresh" size={22} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleOpenInBrowser}
            style={styles.toolbarButton}
          >
            <Ionicons name="open-outline" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* WebView */}
      <View style={styles.webviewContainer}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0F7B6C" />
            <Text style={styles.loadingText}>Loading preview...</Text>
          </View>
        )}

        <WebView
          ref={webViewRef}
          source={{ uri: embedUrl }}
          style={styles.webview}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
            setCanGoForward(navState.canGoForward);
          }}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
        />
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={16} color="#2EAADC" />
        <Text style={styles.infoText}>
          Make changes in the editor, then refresh to see updates
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  toolbarButton: {
    padding: 8,
    borderRadius: 6,
  },
  disabled: {
    opacity: 0.3,
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  projectName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sandboxId: {
    color: '#AAA',
    fontSize: 11,
    marginTop: 2,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  webviewContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    zIndex: 10,
  },
  loadingText: {
    color: '#AAA',
    marginTop: 12,
    fontSize: 14,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#2EAADC',
  },
  infoText: {
    flex: 1,
    color: '#2EAADC',
    fontSize: 12,
  },
});
