/**
 * AI Assistant Drawer Component
 * Bottom drawer with AI chat and quick actions
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AIService, AIContext, AIMessage, EditorReference } from '../services/ai';
import { AIContextBuilder } from '../services/ai/AIContextBuilder';
import { AIActionExecutor } from '../services/ai/AIActionExecutor';

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
  const [slideAnim] = useState(new Animated.Value(0));
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
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

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View
          style={[styles.drawer, { transform: [{ translateY }] }]}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="sparkles" size={20} color="#4A90E2" />
              <Text style={styles.headerTitle}>AI Assistant</Text>
              {fileName && <Text style={styles.headerSubtitle}>{fileName}</Text>}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  drawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  headerSubtitle: {
    color: '#AAA',
    fontSize: 12,
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  quickActions: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D2D2D',
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  quickActionText: {
    color: '#4A90E2',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 12,
    paddingBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: '#AAA',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyStateSubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
  },
  userMessage: {
    backgroundColor: '#2D2D2D',
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  assistantMessage: {
    backgroundColor: '#1a1a2e',
    alignSelf: 'flex-start',
    maxWidth: '90%',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageRole: {
    color: '#AAA',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  messageContent: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
  },
  codeBlockContainer: {
    marginTop: 12,
    backgroundColor: '#0D1117',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  codeBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#161B22',
  },
  codeBlockLanguage: {
    color: '#AAA',
    fontSize: 12,
    fontWeight: 'bold',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#2D2D2D',
    borderRadius: 4,
  },
  applyButtonText: {
    color: '#4A90E2',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  codeBlock: {
    padding: 12,
  },
  codeBlockText: {
    color: '#E6EDF3',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  loadingText: {
    color: '#AAA',
    marginLeft: 8,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#1E1E1E',
  },
  input: {
    flex: 1,
    backgroundColor: '#2D2D2D',
    color: '#FFF',
    padding: 12,
    borderRadius: 20,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    backgroundColor: '#4A90E2',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
