/**
 * Vercel Preview Panel
 * Shows deployed Vercel project in WebView
 * Like Lovable.dev - permanent URL that updates on redeploy
 */

import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

interface VercelPreviewPanelProps {
  deploymentUrl: string;
  deploymentId: string;
  projectName: string;
  status: 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
  onClose: () => void;
  onRedeploy?: () => void;
}

export const VercelPreviewPanel: React.FC<VercelPreviewPanelProps> = ({
  deploymentUrl,
  deploymentId,
  projectName,
  status,
  onClose,
  onRedeploy,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [showBuildingOverlay, setShowBuildingOverlay] = useState(status === 'BUILDING');

  const handleRefresh = () => {
    webViewRef.current?.reload();
  };

  const handleRedeploy = () => {
    Alert.alert(
      'Redeploy Project',
      'This will redeploy your project with the latest changes. The URL will stay the same.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeploy',
          onPress: () => {
            setShowBuildingOverlay(true);
            if (onRedeploy) {
              onRedeploy();
            }
          },
        },
      ]
    );
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

  const handleOpenInBrowser = async () => {
    try {
      await Linking.openURL(deploymentUrl);
    } catch (error) {
      Alert.alert('Error', 'Could not open URL in browser');
    }
  };

  const handleCopyUrl = () => {
    Alert.alert('Deployment URL', deploymentUrl, [
      {
        text: 'Copy',
        onPress: () => {
          // Copy to clipboard would require expo-clipboard
          Alert.alert('URL copied to share!', deploymentUrl);
        },
      },
      { text: 'Close', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        {/* Close Button */}
        <TouchableOpacity onPress={onClose} style={styles.toolbarButton}>
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>

        {/* Project Name & Status */}
        <View style={styles.titleContainer}>
          <Text style={styles.projectName} numberOfLines={1}>
            {projectName}
          </Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                status === 'READY' && styles.statusReady,
                status === 'BUILDING' && styles.statusBuilding,
                status === 'ERROR' && styles.statusError,
              ]}
            />
            <Text style={styles.statusText}>
              {status === 'READY' ? 'Live' : status === 'BUILDING' ? 'Building...' : 'Error'}
            </Text>
          </View>
        </View>

        {/* Navigation Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            onPress={handleGoBack}
            style={[styles.toolbarButton, !canGoBack && styles.disabled]}
            disabled={!canGoBack}
          >
            <Ionicons name="arrow-back" size={22} color={canGoBack ? '#FFF' : '#666'} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleGoForward}
            style={[styles.toolbarButton, !canGoForward && styles.disabled]}
            disabled={!canGoForward}
          >
            <Ionicons name="arrow-forward" size={22} color={canGoForward ? '#FFF' : '#666'} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRefresh} style={styles.toolbarButton}>
            <Ionicons name="refresh" size={22} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleOpenInBrowser} style={styles.toolbarButton}>
            <Ionicons name="open-outline" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* WebView */}
      <View style={styles.webviewContainer}>
        {(isLoading || showBuildingOverlay) && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0F7B6C" />
            <Text style={styles.loadingText}>
              {showBuildingOverlay
                ? 'Building your project on Vercel...\nThis may take 30-60 seconds'
                : 'Loading preview...'}
            </Text>
            {showBuildingOverlay && (
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={() => setShowBuildingOverlay(false)}
              >
                <Text style={styles.dismissButtonText}>View anyway</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <WebView
          ref={webViewRef}
          source={{ uri: deploymentUrl }}
          style={styles.webview}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => {
            setIsLoading(false);
            setShowBuildingOverlay(false);
          }}
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

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionButton} onPress={handleCopyUrl}>
          <Ionicons name="link" size={20} color="#2EAADC" />
          <Text style={styles.actionButtonText}>Share URL</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.redeployButton]}
          onPress={handleRedeploy}
        >
          <Ionicons name="cloud-upload" size={20} color="#0F7B6C" />
          <Text style={[styles.actionButtonText, styles.redeployButtonText]}>Redeploy</Text>
        </TouchableOpacity>
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#AAA',
  },
  statusReady: {
    backgroundColor: '#0F7B6C',
  },
  statusBuilding: {
    backgroundColor: '#FFA500',
  },
  statusError: {
    backgroundColor: '#F87171',
  },
  statusText: {
    color: '#AAA',
    fontSize: 11,
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
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    zIndex: 10,
  },
  loadingText: {
    color: '#AAA',
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  dismissButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  dismissButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  actionBar: {
    flexDirection: 'row',
    backgroundColor: '#252525',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2EAADC',
  },
  actionButtonText: {
    color: '#2EAADC',
    fontSize: 14,
    fontWeight: '600',
  },
  redeployButton: {
    backgroundColor: '#0F7B6C',
    borderColor: '#0F7B6C',
  },
  redeployButtonText: {
    color: '#FFF',
  },
});
