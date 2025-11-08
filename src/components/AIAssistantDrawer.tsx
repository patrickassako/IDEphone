/**
 * AI Assistant Drawer Component
 * Modern bottom sheet with AI chat and quick actions
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AIService, AIContext, AIMessage, EditorReference } from '../services/ai';
import { AIContextBuilder } from '../services/ai/AIContextBuilder';
import { AIActionExecutor } from '../services/ai/AIActionExecutor';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.92;

interface AIAssistantDrawerProps {
  visible: boolean;
  onClose: () => void;
  filePath?: string;
  fileName?: string;
  fileContent?: string;
  selectedText?: string;
  editorRef?: EditorReference;
  onCodeInsert?: (code: string) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  codeBlocks?: Array<{ language: string; code: string }>;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  visible,
  onClose,
  filePath,
  fileName,
  fileContent,
  selectedText,
  editorRef,
  onCodeInsert,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [slideAnim] = useState(new Animated.Value(DRAWER_HEIGHT));
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: DRAWER_HEIGHT,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    }
  }, [visible]);

  const buildContext = (): AIContext => {
    return AIContextBuilder.buildMinimal(
      fileName || 'untitled',
      fileContent || '',
      selectedText
    );
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const context = buildContext();
      context.messages = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await AIService.generateResponse(inputText, context);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        codeBlocks: response.codeBlocks,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Auto-scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to get AI response'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action: 'fix' | 'explain' | 'refactor' | 'comment') => {
    if (!selectedText && !fileContent) return;

    const code = selectedText || fileContent || '';
    let prompt = '';

    switch (action) {
      case 'fix':
        prompt = 'Fix any bugs or issues in this code';
        break;
      case 'explain':
        prompt = 'Explain what this code does in simple terms';
        break;
      case 'refactor':
        prompt = 'Refactor this code to improve readability and performance';
        break;
      case 'comment':
        prompt = 'Add clear, concise comments to this code';
        break;
    }

    setInputText(prompt);
    // Auto-send
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleApplyCode = async (code: string) => {
    if (editorRef) {
      try {
        await editorRef.replaceSelection(code);
        onClose();
      } catch {
        // If no selection, try insert at cursor
        try {
          await editorRef.insertAtCursor(code);
          onClose();
        } catch (error: any) {
          alert(`Failed to apply code: ${error.message}`);
        }
      }
    } else if (onCodeInsert) {
      onCodeInsert(code);
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Drag Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="sparkles" size={24} color="#9F7AEA" />
                </View>
                <View>
                  <Text style={styles.headerTitle}>AI Assistant</Text>
                  {fileName && <Text style={styles.headerSubtitle}>{fileName}</Text>}
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#AAA" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('fix')}
              disabled={isLoading}
            >
              <Ionicons name="build-outline" size={18} color="#4A90E2" />
              <Text style={styles.quickActionText}>Fix</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('explain')}
              disabled={isLoading}
            >
              <Ionicons name="bulb-outline" size={18} color="#4A90E2" />
              <Text style={styles.quickActionText}>Explain</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('refactor')}
              disabled={isLoading}
            >
              <Ionicons name="git-branch-outline" size={18} color="#4A90E2" />
              <Text style={styles.quickActionText}>Refactor</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('comment')}
              disabled={isLoading}
            >
              <Ionicons name="chatbox-outline" size={18} color="#4A90E2" />
              <Text style={styles.quickActionText}>Comment</Text>
            </TouchableOpacity>
          </View>

          {/* Chat Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatContainer}
            contentContainerStyle={styles.chatContent}
          >
            {messages.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={48} color="#666" />
                <Text style={styles.emptyStateText}>
                  Ask me anything about your code!
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  I can help fix bugs, explain code, refactor, and more.
                </Text>
              </View>
            )}

            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageContainer,
                  message.role === 'user' ? styles.userMessage : styles.assistantMessage,
                ]}
              >
                <View style={styles.messageHeader}>
                  <Ionicons
                    name={message.role === 'user' ? 'person-circle' : 'sparkles'}
                    size={20}
                    color={message.role === 'user' ? '#4A90E2' : '#9F7AEA'}
                  />
                  <Text style={styles.messageRole}>
                    {message.role === 'user' ? 'You' : 'AI'}
                  </Text>
                </View>
                <Text style={styles.messageContent}>{message.content}</Text>

                {/* Code Blocks */}
                {message.codeBlocks && message.codeBlocks.map((block, index) => (
                  <View key={index} style={styles.codeBlockContainer}>
                    <View style={styles.codeBlockHeader}>
                      <Text style={styles.codeBlockLanguage}>{block.language}</Text>
                      <TouchableOpacity
                        style={styles.applyButton}
                        onPress={() => handleApplyCode(block.code)}
                      >
                        <Ionicons name="arrow-down-circle" size={16} color="#4A90E2" />
                        <Text style={styles.applyButtonText}>Apply</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView horizontal style={styles.codeBlock}>
                      <Text style={styles.codeBlockText}>{block.code}</Text>
                    </ScrollView>
                  </View>
                ))}
              </View>
            ))}

            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#4A90E2" />
                <Text style={styles.loadingText}>AI is thinking...</Text>
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Ask AI about your code..."
                placeholderTextColor="#666"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={1000}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
                onPress={handleSendMessage}
                disabled={isLoading || !inputText.trim()}
              >
                <Ionicons name="send" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  drawer: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: DRAWER_HEIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#444',
    borderRadius: 3,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#2D2D2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#AAA',
    fontSize: 14,
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2D2D2D',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#252525',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  quickActionText: {
    color: '#4A90E2',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 20,
    paddingBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    color: '#AAA',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptyStateSubtext: {
    color: '#666',
    fontSize: 15,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  messageContainer: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  userMessage: {
    backgroundColor: '#252525',
    borderColor: '#4A90E2',
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  assistantMessage: {
    backgroundColor: '#1E1E2E',
    borderColor: '#9F7AEA',
    width: '100%',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  messageRole: {
    color: '#AAA',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  messageContent: {
    color: '#FFF',
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: 0.2,
  },
  codeBlockContainer: {
    marginTop: 16,
    backgroundColor: '#0D1117',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#2D2D2D',
  },
  codeBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#161B22',
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
  },
  codeBlockLanguage: {
    color: '#9F7AEA',
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#252525',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  applyButtonText: {
    color: '#4A90E2',
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '600',
  },
  codeBlock: {
    padding: 16,
  },
  codeBlockText: {
    color: '#E6EDF3',
    fontSize: 14,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#9F7AEA',
    marginBottom: 16,
  },
  loadingText: {
    color: '#AAA',
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#2D2D2D',
    backgroundColor: '#1A1A1A',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#252525',
    color: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    fontSize: 15,
    lineHeight: 22,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#333',
  },
  sendButton: {
    width: 48,
    height: 48,
    backgroundColor: '#4A90E2',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
  },
});
