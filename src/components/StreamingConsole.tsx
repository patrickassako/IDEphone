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

// Animated Tree Node Component with pop effect
const AnimatedTreeNode: React.FC<{
  node: FileTreeNode;
  depth: number;
}> = ({ node, depth }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pop animation when node appears
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    // Spinning animation for "creating" status
    if (node.status === 'creating') {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [node.status]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getStatusIcon = (status: 'pending' | 'creating' | 'completed'): React.ReactNode => {
    switch (status) {
      case 'completed':
        return <Ionicons name="checkmark-circle" size={16} color="#0F7B6C" />;
      case 'creating':
        return (
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name="sync" size={16} color="#2EAADC" />
          </Animated.View>
        );
      case 'pending':
        return <Ionicons name="ellipse-outline" size={16} color="#666" />;
    }
  };

  return (
    <Animated.View
      style={[
        styles.treeNode,
        { marginLeft: depth * 20, transform: [{ scale: scaleAnim }] },
      ]}
    >
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
    </Animated.View>
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

  // Advanced typing effect for messages (character by character)
  useEffect(() => {
    if (messages.length === 0) {
      setVisibleMessages([]);
      setTypingMessages({});
      return;
    }

    const lastMessage = messages[messages.length - 1];
    const alreadyVisible = visibleMessages.find((m) => m.id === lastMessage.id);

    if (!alreadyVisible) {
      // Add message to visible list
      setVisibleMessages([...messages]);

      // Start typing effect for new message
      const fullText = lastMessage.message;
      let currentIndex = 0;

      const typeInterval = setInterval(() => {
        currentIndex++;
        setTypingMessages((prev) => ({
          ...prev,
          [lastMessage.id]: fullText.substring(0, currentIndex),
        }));

        if (currentIndex >= fullText.length) {
          clearInterval(typeInterval);
        }
      }, 15); // 15ms per character for smooth typing

      return () => clearInterval(typeInterval);
    }
  }, [messages.length]);

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
        <AnimatedTreeNode node={node} depth={depth} />
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
          <View style={styles.progressBarGlow} />
        </View>
        {estimatedTime && estimatedTime > 0 && (
          <Text style={styles.estimatedTime}>
            ⏱️ About {estimatedTime}s remaining
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
              <Text style={styles.messageText}>
                {typingMessages[msg.id] || msg.message}
                {typingMessages[msg.id] && typingMessages[msg.id].length < msg.message.length && (
                  <Text style={styles.cursor}>▊</Text>
                )}
              </Text>
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
