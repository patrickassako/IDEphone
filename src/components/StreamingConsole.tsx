/**
 * Streaming Console Component - Ultra Minimal Version
 * Displays real-time AI generation activity
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

export interface StreamMessage {
  id: string;
  type: 'info' | 'success' | 'progress' | 'file' | 'directory';
  message: string;
  timestamp: number;
  icon?: string;
  indent?: number;
}

export interface FileTreeNode {
  path: string;
  type: 'file' | 'directory';
  status: 'pending' | 'creating' | 'completed';
  children?: FileTreeNode[];
}

interface StreamingConsoleProps {
  messages: StreamMessage[];
  fileTree: FileTreeNode[];
  progress: number;
  estimatedTime?: number;
  onComplete?: () => void;
}

export const StreamingConsole: React.FC<StreamingConsoleProps> = ({
  messages = [],
  fileTree = [],
  progress = 0,
  estimatedTime,
}) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🚀 Generating Your Project</Text>
        <Text style={styles.subtitle}>AI is crafting your code...</Text>
      </View>

      {/* Progress */}
      <View style={styles.progressSection}>
        <Text style={styles.progressText}>Progress: {Math.round(progress || 0)}%</Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(100, Math.max(0, progress || 0))}%` },
            ]}
          />
        </View>
        {estimatedTime && estimatedTime > 0 && (
          <Text style={styles.timeText}>About {estimatedTime}s remaining</Text>
        )}
      </View>

      {/* Messages */}
      <View style={styles.messagesSection}>
        <Text style={styles.sectionTitle}>Activity:</Text>
        {messages && messages.length > 0 ? (
          messages.slice(-5).map((msg) => (
            <Text key={msg.id} style={styles.messageText}>
              • {msg.message}
            </Text>
          ))
        ) : (
          <Text style={styles.emptyText}>Starting...</Text>
        )}
      </View>

      {/* File Count */}
      {fileTree && fileTree.length > 0 && (
        <View style={styles.filesSection}>
          <Text style={styles.filesText}>
            📁 {fileTree.length} files created
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1A1A1A',
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#AAA',
  },
  progressSection: {
    marginBottom: 24,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2EAADC',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2EAADC',
  },
  timeText: {
    fontSize: 13,
    color: '#AAA',
    marginTop: 8,
  },
  messagesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  messageText: {
    fontSize: 14,
    color: '#DDD',
    marginBottom: 8,
    paddingLeft: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  filesSection: {
    marginTop: 16,
  },
  filesText: {
    fontSize: 14,
    color: '#0F7B6C',
    fontWeight: '600',
  },
});
