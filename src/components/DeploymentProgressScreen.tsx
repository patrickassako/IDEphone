/**
 * Deployment Progress Screen
 * Shows real-time deployment progress and Vercel build logs
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BuildLog, ProjectDeployment } from '../types';

interface DeploymentProgressScreenProps {
  deployment: ProjectDeployment;
  onClose: () => void;
  onSuccess?: (url: string) => void;
}

export const DeploymentProgressScreen: React.FC<DeploymentProgressScreenProps> = ({
  deployment,
  onClose,
  onSuccess,
}) => {
  const [logs, setLogs] = useState<BuildLog[]>([
    {
      timestamp: Date.now(),
      message: 'Starting deployment...',
      type: 'info',
    },
  ]);
  const [status, setStatus] = useState<ProjectDeployment['status']>(deployment.status);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate deployment progress
    simulateDeployment();
  }, []);

  const simulateDeployment = async () => {
    // Add initial logs
    addLog('Uploading project files to Vercel...', 'info');
    await sleep(1000);
    setProgress(10);

    addLog('Files uploaded successfully', 'success');
    addLog('Installing dependencies...', 'info');
    await sleep(2000);
    setProgress(30);

    addLog('npm install completed', 'success');
    addLog('Running build command: npm run build', 'info');
    setStatus('BUILDING');
    await sleep(3000);
    setProgress(60);

    addLog('TypeScript compilation successful', 'success');
    addLog('Vite build completed', 'success');
    await sleep(2000);
    setProgress(80);

    addLog('Deploying to Vercel edge network...', 'info');
    await sleep(2000);
    setProgress(95);

    addLog('Deployment complete!', 'success');
    addLog(`URL: ${deployment.url}`, 'success');
    setProgress(100);
    setStatus('READY');

    // Call success callback
    if (onSuccess) {
      setTimeout(() => onSuccess(deployment.url), 1000);
    }
  };

  const addLog = (message: string, type: BuildLog['type']) => {
    setLogs(prev => [
      ...prev,
      {
        timestamp: Date.now(),
        message,
        type,
      },
    ]);
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Error opening URL:', err));
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'BUILDING':
      case 'QUEUED':
        return <ActivityIndicator size="large" color="#2eaadc" />;
      case 'READY':
        return <Ionicons name="checkmark-circle" size={60} color="#22c55e" />;
      case 'ERROR':
        return <Ionicons name="close-circle" size={60} color="#ef4444" />;
      default:
        return <ActivityIndicator size="large" color="#2eaadc" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'QUEUED':
        return 'Waiting in queue...';
      case 'BUILDING':
        return 'Building project...';
      case 'READY':
        return 'Deployment successful!';
      case 'ERROR':
        return 'Deployment failed';
      default:
        return 'Deploying...';
    }
  };

  const getLogColor = (type: BuildLog['type']) => {
    switch (type) {
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'success':
        return '#22c55e';
      default:
        return '#94a3b8';
    }
  };

  const getLogIcon = (type: BuildLog['type']) => {
    switch (type) {
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      case 'success':
        return 'checkmark-circle';
      default:
        return 'information-circle';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Deploying to Vercel</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Status */}
      <View style={styles.statusContainer}>
        {getStatusIcon()}
        <Text style={styles.statusText}>{getStatusText()}</Text>

        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{progress}%</Text>
      </View>

      {/* Logs */}
      <View style={styles.logsContainer}>
        <Text style={styles.logsTitle}>Build Logs</Text>
        <ScrollView
          style={styles.logsScroll}
          contentContainerStyle={styles.logsContent}
        >
          {logs.map((log, index) => (
            <View key={index} style={styles.logRow}>
              <Ionicons
                name={getLogIcon(log.type)}
                size={16}
                color={getLogColor(log.type)}
                style={styles.logIcon}
              />
              <Text style={[styles.logMessage, { color: getLogColor(log.type) }]}>
                {log.message}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Actions */}
      {status === 'READY' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => openUrl(deployment.url)}
          >
            <Ionicons name="globe-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Open Deployment</Text>
          </TouchableOpacity>

          {deployment.inspectorUrl && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => openUrl(deployment.inspectorUrl!)}
            >
              <Ionicons name="analytics-outline" size={20} color="#2eaadc" />
              <Text style={styles.secondaryButtonText}>View in Vercel</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {status === 'ERROR' && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.errorButton} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  statusText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 16,
    marginBottom: 20,
  },
  progressBarContainer: {
    width: '80%',
    height: 8,
    backgroundColor: '#1e1e1e',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2eaadc',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
  },
  logsContainer: {
    flex: 1,
    padding: 20,
  },
  logsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  logsScroll: {
    flex: 1,
  },
  logsContent: {
    paddingBottom: 20,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingVertical: 4,
  },
  logIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  logMessage: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  actions: {
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e1e1e',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2eaadc',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2eaadc',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  errorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#2eaadc',
    fontSize: 16,
    fontWeight: '600',
  },
});
