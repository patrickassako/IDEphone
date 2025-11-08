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

export const StreamingConsole: React.FC<StreamingConsoleProps> = ({
  messages,
  fileTree,
  progress,
  estimatedTime,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [visibleMessages, setVisibleMessages] = useState<StreamMessage[]>([]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages.length]);

  // Simulate typing effect for messages
  useEffect(() => {
    if (messages.length === 0) {
      setVisibleMessages([]);
      return;
    }

    const lastMessage = messages[messages.length - 1];
    const alreadyVisible = visibleMessages.find((m) => m.id === lastMessage.id);

    if (!alreadyVisible) {
      // Add new message with typing effect
      setTimeout(() => {
        setVisibleMessages([...messages]);
      }, 50);
    } else {
      setVisibleMessages([...messages]);
    }
  }, [messages]);

  const getStatusIcon = (status: 'pending' | 'creating' | 'completed'): React.ReactNode => {
    switch (status) {
      case 'completed':
        return <Ionicons name="checkmark-circle" size={16} color="#0F7B6C" />;
      case 'creating':
        return (
          <View style={styles.spinnerContainer}>
            <Ionicons name="sync" size={16} color="#2EAADC" />
          </View>
        );
      case 'pending':
        return <Ionicons name="ellipse-outline" size={16} color="#666" />;
    }
  };

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
      <View key={`${node.path}-${index}`} style={[styles.treeNode, { marginLeft: depth * 20 }]}>
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
        {node.children && node.children.length > 0 && renderFileTree(node.children, depth + 1)}
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      {/* Progress Section */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>📊 Progress</Text>
          <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: `${progress}%`,
              },
            ]}
          />
        </View>
        {estimatedTime && estimatedTime > 0 && (
          <Text style={styles.estimatedTime}>
            Estimated time: {estimatedTime}s remaining
          </Text>
        )}
      </View>

      {/* AI Activity Section */}
      <View style={styles.activitySection}>
        <Text style={styles.sectionTitle}>💬 AI Activity</Text>
        <ScrollView
          ref={scrollViewRef}
          style={styles.messageList}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          {visibleMessages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.message,
                msg.indent && { marginLeft: msg.indent * 16 },
              ]}
            >
              <Ionicons
                name={msg.icon as any || getMessageIcon(msg.type)}
                size={16}
                color={getMessageColor(msg.type)}
                style={styles.messageIcon}
              />
              <Text style={styles.messageText}>{msg.message}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* File Tree Section */}
      {fileTree.length > 0 && (
        <View style={styles.treeSection}>
          <Text style={styles.sectionTitle}>📁 File Tree</Text>
          <ScrollView
            style={styles.treeList}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {renderFileTree(fileTree)}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  progressSection: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressPercent: {
    color: '#2EAADC',
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#2D2D2D',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2EAADC',
    borderRadius: 4,
  },
  estimatedTime: {
    color: '#666',
    fontSize: 13,
    marginTop: 8,
  },
  activitySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  messageList: {
    backgroundColor: '#252525',
    borderRadius: 12,
    padding: 16,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  message: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  messageIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  messageText: {
    color: '#DDD',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  treeSection: {
    flex: 1,
  },
  treeList: {
    backgroundColor: '#252525',
    borderRadius: 12,
    padding: 16,
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
  spinnerContainer: {
    width: 16,
    height: 16,
  },
});
