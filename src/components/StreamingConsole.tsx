/**
 * Streaming Console Component
 * Displays real-time AI generation activity with Cursor-style streaming
 * Features: Typing effect, progress tracking, animated file tree
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

// Simple Tree Node Component (no animations for now)
const SimpleTreeNode: React.FC<{
  node: FileTreeNode;
  depth: number;
}> = ({ node, depth }) => {
  const getStatusIcon = (status: 'pending' | 'creating' | 'completed'): React.ReactNode => {
    switch (status) {
      case 'completed':
        return <Ionicons name="checkmark-circle" size={16} color="#0F7B6C" />;
      case 'creating':
        return <Ionicons name="sync" size={16} color="#2EAADC" />;
      case 'pending':
        return <Ionicons name="ellipse-outline" size={16} color="#666" />;
    }
  };

  return (
    <View style={[styles.treeNode, { marginLeft: depth * 20 }]}>
      <View style={styles.treeNodeContent}>
        {getStatusIcon(node.status)}
        <Ionicons
          name={node.type === 'directory' ? 'folder' : 'document-text'}
          size={16}
          color={node.type === 'directory' ? '#E91E63' : '#2EAADC'}
          style={styles.treeIcon}
        />
        <Text
          style={[
            styles.treeNodeText,
            node.status === 'completed' && styles.treeNodeTextCompleted,
          ]}
        >
          {node.path.split('/').pop()}
        </Text>
      </View>
    </View>
  );
};

export const StreamingConsole: React.FC<StreamingConsoleProps> = ({
  messages,
  fileTree,
  progress,
  estimatedTime,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [visibleMessages, setVisibleMessages] = useState<StreamMessage[]>([]);
  const [typingMessages, setTypingMessages] = useState<{ [key: string]: string }>({});

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages.length]);

  // Simple message update (no typing effect for now)
  useEffect(() => {
    setVisibleMessages(messages);
  }, [messages]);

  const getMessageIcon = (type: StreamMessage['type']): string => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'progress':
        return 'sync';
      case 'file':
        return 'document-outline';
      case 'directory':
        return 'folder-outline';
      default:
        return 'information-circle';
    }
  };

  const getMessageColor = (type: StreamMessage['type']): string => {
    switch (type) {
      case 'success':
        return '#0F7B6C';
      case 'progress':
        return '#2EAADC';
      case 'file':
        return '#9F7AEA';
      case 'directory':
        return '#E91E63';
      default:
        return '#AAA';
    }
  };

  const renderFileTree = (nodes: FileTreeNode[], depth = 0): React.ReactNode => {
    return nodes.map((node, index) => (
      <View key={`${node.path}-${index}`}>
        <SimpleTreeNode node={node} depth={depth} />
        {node.children && node.children.length > 0 && renderFileTree(node.children, depth + 1)}
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      {/* Header with Rocket Icon */}
      <View style={styles.headerSection}>
        <View style={styles.headerIcon}>
          <Ionicons name="rocket" size={32} color="#2EAADC" />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Generating Your Project</Text>
          <Text style={styles.headerSubtitle}>AI is crafting your code...</Text>
        </View>
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Progress</Text>
          <Text style={styles.progressPercent}>{Math.round(progress || 0)}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(100, Math.max(0, progress || 0))}%`,
              },
            ]}
          />
        </View>
        {estimatedTime && estimatedTime > 0 && (
          <Text style={styles.estimatedTime}>
            About {estimatedTime}s remaining
          </Text>
        )}
      </View>

      {/* AI Activity Section */}
      <View style={styles.activitySection}>
        <Text style={styles.sectionTitle}>AI Activity</Text>
        <View style={styles.messageList}>
          {visibleMessages && visibleMessages.length > 0 ? (
            visibleMessages.map((msg) => (
              <View key={msg.id} style={styles.message}>
                <Text style={styles.messageText}>{msg.message || ''}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Starting generation...</Text>
          )}
        </View>
      </View>

      {/* File Tree Section */}
      {fileTree && fileTree.length > 0 && (
        <View style={styles.treeSection}>
          <Text style={styles.sectionTitle}>File Tree</Text>
          <View style={styles.treeList}>
            {renderFileTree(fileTree)}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#AAA',
    fontSize: 14,
  },
  progressSection: {
    marginBottom: 28,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  progressTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  progressPercent: {
    color: '#2EAADC',
    fontSize: 22,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#2D2D2D',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2EAADC',
    borderRadius: 6,
  },
  progressBarGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  estimatedTime: {
    color: '#AAA',
    fontSize: 14,
    marginTop: 10,
    fontWeight: '500',
  },
  activitySection: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  messageList: {
    backgroundColor: '#252525',
    borderRadius: 14,
    padding: 18,
    maxHeight: 220,
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  message: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  messageIcon: {
    marginRight: 12,
    marginTop: 3,
  },
  messageText: {
    color: '#DDD',
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  cursor: {
    color: '#2EAADC',
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  treeSection: {
    flex: 1,
  },
  treeList: {
    backgroundColor: '#252525',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  treeNode: {
    marginBottom: 8,
  },
  treeNodeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  treeIcon: {
    marginHorizontal: 8,
  },
  treeNodeText: {
    color: '#AAA',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  treeNodeTextCompleted: {
    color: '#DDD',
  },
});
