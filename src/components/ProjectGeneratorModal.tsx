/**
 * Project Generator Modal Component
 * Notion-style interface for creating entire projects from AI prompts
 * Features: Streaming generation, real-time file tree, progress tracking
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.95;

type ProjectTemplate = 'web' | 'react' | 'react-native' | 'node' | 'fullstack';
type Framework = 'vanilla' | 'react' | 'next' | 'vite' | 'expo';
type Styling = 'css' | 'tailwind' | 'styled-components' | 'emotion';

interface ProjectGeneratorModalProps {
  visible: boolean;
  onClose: () => void;
  onGenerate: (config: ProjectConfig) => void;
}

export interface ProjectConfig {
  description: string;
  template: ProjectTemplate;
  framework: Framework;
  styling: Styling;
  typescript: boolean;
  tests: boolean;
  git: boolean;
}

export const ProjectGeneratorModal: React.FC<ProjectGeneratorModalProps> = ({
  visible,
  onClose,
  onGenerate,
}) => {
  const [slideAnim] = useState(new Animated.Value(MODAL_HEIGHT));
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState<ProjectTemplate>('react');
  const [framework, setFramework] = useState<Framework>('vite');
  const [styling, setStyling] = useState<Styling>('tailwind');
  const [typescript, setTypescript] = useState(true);
  const [tests, setTests] = useState(false);
  const [git, setGit] = useState(true);

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
        toValue: MODAL_HEIGHT,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    }
  }, [visible]);

  const handleGenerate = () => {
    if (description.trim().length === 0) return;

    const config: ProjectConfig = {
      description,
      template,
      framework,
      styling,
      typescript,
      tests,
      git,
    };

    onGenerate(config);
  };

  const getPlaceholder = (): string => {
    const placeholders: Record<ProjectTemplate, string> = {
      web: 'e.g., Create a modern landing page for a SaaS product with hero section, features, and pricing...',
      react: 'e.g., Build a todo app with dark mode, local storage, and drag-and-drop functionality...',
      'react-native': 'e.g., Create an Instagram-like app with photo feed, stories, and user profiles...',
      node: 'e.g., Build a REST API with authentication, user management, and MongoDB integration...',
      fullstack: 'e.g., Create a full-stack e-commerce platform with product catalog, cart, and checkout...',
    };
    return placeholders[template];
  };

  const templates: Array<{ value: ProjectTemplate; icon: string; label: string; desc: string }> = [
    { value: 'web', icon: 'globe-outline', label: 'Web Page', desc: 'HTML, CSS, JS' },
    { value: 'react', icon: 'logo-react', label: 'React App', desc: 'SPA with React' },
    { value: 'react-native', icon: 'phone-portrait-outline', label: 'Mobile App', desc: 'React Native' },
    { value: 'node', icon: 'server-outline', label: 'Backend', desc: 'Node.js API' },
    { value: 'fullstack', icon: 'layers-outline', label: 'Full-stack', desc: 'Complete app' },
  ];

  const frameworks: Record<ProjectTemplate, Array<{ value: Framework; label: string }>> = {
    web: [
      { value: 'vanilla', label: 'Vanilla JS' },
    ],
    react: [
      { value: 'vite', label: 'Vite' },
      { value: 'next', label: 'Next.js' },
      { value: 'react', label: 'CRA' },
    ],
    'react-native': [
      { value: 'expo', label: 'Expo' },
    ],
    node: [
      { value: 'vanilla', label: 'Express' },
    ],
    fullstack: [
      { value: 'next', label: 'Next.js' },
      { value: 'vite', label: 'Vite + Express' },
    ],
  };

  const stylingOptions: Array<{ value: Styling; label: string }> = [
    { value: 'tailwind', label: 'Tailwind CSS' },
    { value: 'css', label: 'Plain CSS' },
    { value: 'styled-components', label: 'Styled Components' },
    { value: 'emotion', label: 'Emotion' },
  ];

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.modal,
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
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="rocket" size={28} color="#2EAADC" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Create New Project</Text>
                <Text style={styles.headerSubtitle}>AI-powered project generation</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#AAA" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Description Input */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>📝 Describe Your Project</Text>
              <TextInput
                style={styles.input}
                placeholder={getPlaceholder()}
                placeholderTextColor="#666"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
              <Text style={styles.hint}>
                Be as specific as possible. Include features, design preferences, and functionality.
              </Text>
            </View>

            {/* Template Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>🎨 Template</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.templateScroll}
              >
                {templates.map((t) => (
                  <TouchableOpacity
                    key={t.value}
                    style={[
                      styles.templateCard,
                      template === t.value && styles.templateCardSelected,
                    ]}
                    onPress={() => setTemplate(t.value)}
                  >
                    <Ionicons
                      name={t.icon as any}
                      size={32}
                      color={template === t.value ? '#2EAADC' : '#666'}
                    />
                    <Text
                      style={[
                        styles.templateLabel,
                        template === t.value && styles.templateLabelSelected,
                      ]}
                    >
                      {t.label}
                    </Text>
                    <Text style={styles.templateDesc}>{t.desc}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Framework Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>⚡ Framework</Text>
              <View style={styles.optionsRow}>
                {frameworks[template].map((f) => (
                  <TouchableOpacity
                    key={f.value}
                    style={[
                      styles.optionButton,
                      framework === f.value && styles.optionButtonSelected,
                    ]}
                    onPress={() => setFramework(f.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        framework === f.value && styles.optionTextSelected,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Styling Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>💅 Styling</Text>
              <View style={styles.optionsRow}>
                {stylingOptions.map((s) => (
                  <TouchableOpacity
                    key={s.value}
                    style={[
                      styles.optionButton,
                      styling === s.value && styles.optionButtonSelected,
                    ]}
                    onPress={() => setStyling(s.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        styling === s.value && styles.optionTextSelected,
                      ]}
                    >
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Advanced Options */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>⚙️ Advanced Options</Text>
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setTypescript(!typescript)}
                >
                  <Ionicons
                    name={typescript ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={typescript ? '#2EAADC' : '#666'}
                  />
                  <Text style={styles.checkboxLabel}>TypeScript</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setTests(!tests)}
                >
                  <Ionicons
                    name={tests ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={tests ? '#2EAADC' : '#666'}
                  />
                  <Text style={styles.checkboxLabel}>Include Tests</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setGit(!git)}
                >
                  <Ionicons
                    name={git ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={git ? '#2EAADC' : '#666'}
                  />
                  <Text style={styles.checkboxLabel}>Initialize Git</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Ionicons name="close-circle-outline" size={20} color="#AAA" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.generateButton,
                description.trim().length === 0 && styles.generateButtonDisabled,
              ]}
              onPress={handleGenerate}
              disabled={description.trim().length === 0}
            >
              <Ionicons name="sparkles" size={20} color="#FFF" />
              <Text style={styles.generateButtonText}>Generate Project</Text>
            </TouchableOpacity>
          </View>
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
  modal: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: MODAL_HEIGHT,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 22,
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionLabel: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#252525',
    color: '#FFF',
    padding: 16,
    borderRadius: 12,
    fontSize: 15,
    lineHeight: 24,
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#333',
  },
  hint: {
    color: '#666',
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },
  templateScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  templateCard: {
    width: 110,
    padding: 16,
    marginRight: 12,
    backgroundColor: '#252525',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2D2D2D',
    alignItems: 'center',
  },
  templateCardSelected: {
    borderColor: '#2EAADC',
    backgroundColor: '#1E3A8A',
  },
  templateLabel: {
    color: '#AAA',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  templateLabelSelected: {
    color: '#2EAADC',
  },
  templateDesc: {
    color: '#666',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#252525',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  optionButtonSelected: {
    backgroundColor: '#1E3A8A',
    borderColor: '#2EAADC',
  },
  optionText: {
    color: '#AAA',
    fontSize: 14,
    fontWeight: '600',
  },
  optionTextSelected: {
    color: '#2EAADC',
  },
  checkboxContainer: {
    gap: 16,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxLabel: {
    color: '#FFF',
    fontSize: 15,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#2D2D2D',
    backgroundColor: '#1A1A1A',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2D2D2D',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cancelButtonText: {
    color: '#AAA',
    fontSize: 16,
    fontWeight: 'bold',
  },
  generateButton: {
    flex: 2,
    backgroundColor: '#2EAADC',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    shadowColor: '#2EAADC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  generateButtonDisabled: {
    backgroundColor: '#444',
    opacity: 0.5,
    shadowOpacity: 0,
  },
  generateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
