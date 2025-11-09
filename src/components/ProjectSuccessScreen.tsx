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
import ConfettiCannon from 'react-native-confetti-cannon';
import { GeneratedFile } from '../services/ai/MultiFileGenerator';
import { ProjectConfig } from './ProjectGeneratorModal';

interface ProjectSuccessScreenProps {
  projectName: string;
  files: GeneratedFile[];
  config: ProjectConfig;
  summary: string;
  onOpenProject: () => void;
  onClose: () => void;
}

export const ProjectSuccessScreen: React.FC<ProjectSuccessScreenProps> = ({
  projectName,
  files,
  config,
  summary,
  onOpenProject,
  onClose,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const confettiRef = useRef<any>(null);

  useEffect(() => {
    // Celebration animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Trigger confetti after a short delay
    setTimeout(() => {
      confettiRef.current?.start();
    }, 300);
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
      {/* Confetti Cannon */}
      <ConfettiCannon
        ref={confettiRef}
        count={200}
        origin={{ x: -10, y: 0 }}
        autoStart={false}
        fadeOut={true}
        explosionSpeed={350}
        fallSpeed={2500}
        colors={['#2EAADC', '#9F7AEA', '#0F7B6C', '#E91E63', '#FFD700']}
      />

      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <Ionicons name="checkmark-circle" size={80} color="#0F7B6C" />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>🎉 Project Created Successfully!</Text>
        <View style={styles.divider} />

        {/* Project Name */}
        <View style={styles.projectNameContainer}>
          <Ionicons name="folder" size={24} color="#2EAADC" />
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

        {/* Detailed Summary */}
        <ScrollView style={styles.summarySection} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>📊 Project Summary</Text>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Ionicons name="construct" size={18} color="#2EAADC" />
              <View style={styles.summaryItemText}>
                <Text style={styles.summaryLabel}>Framework</Text>
                <Text style={styles.summaryValue}>{config.framework}</Text>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <Ionicons name="color-palette" size={18} color="#9F7AEA" />
              <View style={styles.summaryItemText}>
                <Text style={styles.summaryLabel}>Styling</Text>
                <Text style={styles.summaryValue}>{config.styling}</Text>
              </View>
            </View>

            {config.typescript && (
              <View style={styles.summaryItem}>
                <Ionicons name="code-slash" size={18} color="#3178C6" />
                <View style={styles.summaryItemText}>
                  <Text style={styles.summaryLabel}>TypeScript</Text>
                  <Text style={styles.summaryValue}>Enabled</Text>
                </View>
              </View>
            )}

            {config.tests && (
              <View style={styles.summaryItem}>
                <Ionicons name="flask" size={18} color="#0F7B6C" />
                <View style={styles.summaryItemText}>
                  <Text style={styles.summaryLabel}>Tests</Text>
                  <Text style={styles.summaryValue}>Included</Text>
                </View>
              </View>
            )}

            {config.git && (
              <View style={styles.summaryItem}>
                <Ionicons name="git-branch" size={18} color="#FFF" />
                <View style={styles.summaryItemText}>
                  <Text style={styles.summaryLabel}>Git</Text>
                  <Text style={styles.summaryValue}>Initialized</Text>
                </View>
              </View>
            )}
          </View>

          {/* File Breakdown */}
          <Text style={styles.sectionTitle}>📁 File Breakdown</Text>
          <View style={styles.breakdownGrid}>
            {filesByType.components > 0 && (
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownBadge, { backgroundColor: '#2EAADC' }]}>
                  <Text style={styles.breakdownValue}>{filesByType.components}</Text>
                </View>
                <Text style={styles.breakdownLabel}>Components</Text>
              </View>
            )}
            {filesByType.tests > 0 && (
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownBadge, { backgroundColor: '#0F7B6C' }]}>
                  <Text style={styles.breakdownValue}>{filesByType.tests}</Text>
                </View>
                <Text style={styles.breakdownLabel}>Tests</Text>
              </View>
            )}
            {filesByType.config > 0 && (
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownBadge, { backgroundColor: '#9F7AEA' }]}>
                  <Text style={styles.breakdownValue}>{filesByType.config}</Text>
                </View>
                <Text style={styles.breakdownLabel}>Config</Text>
              </View>
            )}
            {filesByType.styles > 0 && (
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownBadge, { backgroundColor: '#E91E63' }]}>
                  <Text style={styles.breakdownValue}>{filesByType.styles}</Text>
                </View>
                <Text style={styles.breakdownLabel}>Styles</Text>
              </View>
            )}
            {filesByType.other > 0 && (
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownBadge, { backgroundColor: '#666' }]}>
                  <Text style={styles.breakdownValue}>{filesByType.other}</Text>
                </View>
                <Text style={styles.breakdownLabel}>Other</Text>
              </View>
            )}
          </View>

          {/* Languages */}
          <Text style={styles.sectionTitle}>💻 Languages</Text>
          <View style={styles.languageList}>
            {Array.from(languages).map((lang, index) => (
              <View key={index} style={styles.languageTag}>
                <Ionicons name="code-slash" size={14} color="#2EAADC" />
                <Text style={styles.languageText}>{lang}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>🚀 Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton} onPress={onOpenProject}>
              <Ionicons name="folder-open" size={20} color="#2EAADC" />
              <Text style={styles.actionButtonText}>Open Project</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.openButton} onPress={onOpenProject}>
            <Text style={styles.openButtonText}>Open in Editor</Text>
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
    padding: 20,
  },
  content: {
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(15, 123, 108, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#2D2D2D',
    marginBottom: 24,
  },
  projectNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  projectName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2EAADC',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#252525',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2EAADC',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#AAA',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2D2D2D',
  },
  summarySection: {
    flex: 1,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
    marginTop: 8,
  },
  summaryGrid: {
    gap: 12,
    marginBottom: 24,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    padding: 14,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  summaryItemText: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#AAA',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  breakdownItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  breakdownBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  breakdownValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#AAA',
    fontWeight: '600',
  },
  languageList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  languageTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#252525',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  languageText: {
    color: '#2EAADC',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsSection: {
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#252525',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2EAADC',
  },
  actionButtonText: {
    color: '#2EAADC',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#2D2D2D',
    paddingVertical: 16,
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
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#2EAADC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  openButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
