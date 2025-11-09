/**
 * Project Success Screen Component
 * Beautiful success screen with confetti animation when project is generated
 * Shows project stats, quick actions, and celebration
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GeneratedFile } from '../services/ai/MultiFileGenerator';
import { ProjectConfig } from './ProjectGeneratorModal';
import { SafeConfetti } from './SafeConfetti';

interface ProjectSuccessScreenProps {
  projectName: string;
  files: GeneratedFile[];
  config: ProjectConfig;
  summary: string;
  onOpenProject: () => void;
  onViewCode: () => void;
  onClose: () => void;
}

export const ProjectSuccessScreen: React.FC<ProjectSuccessScreenProps> = ({
  projectName,
  files,
  config,
  summary,
  onOpenProject,
  onViewCode,
  onClose,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Pulsing scale animation for success icon
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, []);

  // Calculate statistics
  const totalLines = files.reduce((sum, f) => sum + f.content.split('\n').length, 0);
  const languages = new Set(files.map((f) => f.language).filter(Boolean));

  // Group files by type
  const filesByType = {
    components: files.filter((f) => f.path.includes('component')).length,
    tests: files.filter((f) => f.path.includes('test') || f.path.includes('spec')).length,
    config: files.filter((f) => f.path.match(/\.(json|config|rc)\./)).length,
    styles: files.filter((f) => f.path.match(/\.(css|scss|sass|less)$/)).length,
    other: 0,
  };
  filesByType.other = files.length - (filesByType.components + filesByType.tests + filesByType.config + filesByType.styles);

  return (
    <View style={styles.container}>
      {/* Safe Confetti Animation */}
      <SafeConfetti />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Success Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={64} color="#0F7B6C" />
        </Animated.View>

        {/* Title */}
        <Text style={styles.title}>Project Created! 🎉</Text>

        {/* Project Name */}
        <View style={styles.projectNameContainer}>
          <Ionicons name="folder" size={20} color="#2EAADC" />
          <Text style={styles.projectName}>{projectName}</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{files.length}</Text>
            <Text style={styles.statLabel}>Files</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalLines}</Text>
            <Text style={styles.statLabel}>Lines</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{languages.size}</Text>
            <Text style={styles.statLabel}>Languages</Text>
          </View>
        </View>

        {/* Tech Stack */}
        <View style={styles.techSection}>
          <Text style={styles.techTitle}>Tech Stack:</Text>
          <View style={styles.techTags}>
            <View style={[styles.tag, styles.tagBlue]}>
              <Text style={styles.tagText}>{config.framework}</Text>
            </View>
            <View style={[styles.tag, styles.tagPurple]}>
              <Text style={styles.tagText}>{config.styling}</Text>
            </View>
            {config.typescript && (
              <View style={[styles.tag, styles.tagBlue]}>
                <Text style={styles.tagText}>TypeScript</Text>
              </View>
            )}
            {config.tests && (
              <View style={[styles.tag, styles.tagGreen]}>
                <Text style={styles.tagText}>Tests</Text>
              </View>
            )}
            {config.git && (
              <View style={[styles.tag, styles.tagGray]}>
                <Text style={styles.tagText}>Git</Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer Buttons */}
        <View style={styles.footerButtons}>
          <TouchableOpacity style={styles.viewCodeButton} onPress={onViewCode}>
            <Ionicons name="code-slash" size={18} color="#2EAADC" />
            <Text style={styles.viewCodeButtonText}>View Code</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.openButton} onPress={onOpenProject}>
            <Text style={styles.openButtonText}>Open Project</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    padding: 24,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  projectNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 28,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2EAADC',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#252525',
    borderRadius: 16,
    padding: 24,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#2D2D2D',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2EAADC',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 13,
    color: '#AAA',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2D2D2D',
  },
  techSection: {
    width: '100%',
    marginBottom: 32,
  },
  techTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  techTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tagBlue: {
    backgroundColor: 'rgba(46, 170, 220, 0.2)',
  },
  tagPurple: {
    backgroundColor: 'rgba(159, 122, 234, 0.2)',
  },
  tagGreen: {
    backgroundColor: 'rgba(15, 123, 108, 0.2)',
  },
  tagGray: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tagText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  footerButtons: {
    width: '100%',
    marginBottom: 12,
  },
  viewCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3A8A',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#2EAADC',
  },
  viewCodeButtonText: {
    color: '#2EAADC',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#2D2D2D',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#AAA',
    fontSize: 16,
    fontWeight: 'bold',
  },
  openButton: {
    flex: 2,
    backgroundColor: '#2EAADC',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  openButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
