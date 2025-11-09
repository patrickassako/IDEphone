/**
 * Streaming Console Component - Enhanced with smooth animations
 * Displays real-time AI generation activity with Cursor/Notion style
 */

import React, { useRef, useEffect } from 'react';
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

// Animated Message Component
const AnimatedMessage: React.FC<{ message: StreamMessage; index: number }> = ({ message, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50, // Stagger effect
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getIcon = (type: StreamMessage['type']): string => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'progress': return 'sync';
      case 'file': return 'document-outline';
      case 'directory': return 'folder-outline';
      default: return 'information-circle';
    }
  };

  const getColor = (type: StreamMessage['type']): string => {
    switch (type) {
      case 'success': return '#0F7B6C';
      case 'progress': return '#2EAADC';
      case 'file': return '#9F7AEA';
      case 'directory': return '#E91E63';
      default: return '#AAA';
    }
  };

  return (
    <Animated.View
      style={[
        styles.message,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      <Ionicons name={getIcon(message.type) as any} size={14} color={getColor(message.type)} style={styles.messageIcon} />
      <Text style={styles.messageText}>{message.message}</Text>
    </Animated.View>
  );
};

export const StreamingConsole: React.FC<StreamingConsoleProps> = ({
  messages = [],
  fileTree = [],
  progress = 0,
  estimatedTime,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Animate progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="rocket" size={28} color="#2EAADC" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Generating Your Project</Text>
          <Text style={styles.subtitle}>AI is crafting your code...</Text>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressPercent}>{Math.round(progress || 0)}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBarFill,
              { width: progressWidth },
            ]}
          />
        </View>
        {estimatedTime && estimatedTime > 0 && (
          <Text style={styles.timeText}>⏱️ {estimatedTime}s remaining</Text>
        )}
      </View>

      {/* Messages */}
      <View style={styles.messagesSection}>
        <View style={styles.messagesHeader}>
          <Ionicons name="terminal" size={16} color="#2EAADC" />
          <Text style={styles.sectionTitle}>Activity Log</Text>
        </View>
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length > 0 ? (
            messages.map((msg, index) => (
              <AnimatedMessage key={msg.id} message={msg} index={index} />
            ))
          ) : (
            <Text style={styles.emptyText}>Initializing...</Text>
          )}
        </ScrollView>
      </View>

      {/* File Count */}
      {fileTree && fileTree.length > 0 && (
        <View style={styles.filesSection}>
          <Ionicons name="folder-open" size={16} color="#0F7B6C" />
          <Text style={styles.filesText}>{fileTree.length} files created</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(46, 170, 220, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#AAA',
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
  progressLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  progressPercent: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2EAADC',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#2D2D2D',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2EAADC',
    borderRadius: 3,
  },
  timeText: {
    fontSize: 12,
    color: '#AAA',
    marginTop: 8,
  },
  messagesSection: {
    flex: 1,
    marginBottom: 16,
  },
  messagesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  messagesList: {
    flex: 1,
    backgroundColor: '#252525',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  messagesContent: {
    padding: 14,
  },
  message: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  messageIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  messageText: {
    flex: 1,
    fontSize: 13,
    color: '#DDD',
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  filesSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 123, 108, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  filesText: {
    fontSize: 14,
    color: '#0F7B6C',
    fontWeight: '600',
  },
});
