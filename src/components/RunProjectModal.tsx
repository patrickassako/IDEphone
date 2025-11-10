/**
 * Run Project Modal
 * Allows users to run/test projects in browser-based IDEs
 * Supports StackBlitz and CodeSandbox
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GeneratedFile } from '../services/ai/MultiFileGenerator';
import { ProjectConfig } from './ProjectGeneratorModal';
import { StackBlitzService } from '../services/integrations/StackBlitzService';

interface RunProjectModalProps {
  visible: boolean;
  projectName: string;
  files: GeneratedFile[];
  config: ProjectConfig;
  onClose: () => void;
}

type IDEService = 'stackblitz' | 'codesandbox';

export const RunProjectModal: React.FC<RunProjectModalProps> = ({
  visible,
  projectName,
  files,
  config,
  onClose,
}) => {
  const [isOpening, setIsOpening] = useState(false);
  const [selectedService, setSelectedService] = useState<IDEService | null>(null);

  const handleOpenIDE = async (service: IDEService) => {
    try {
      setIsOpening(true);
      setSelectedService(service);

      await StackBlitzService.openInBrowserIDE(projectName, files, config, service);

      Alert.alert(
        'Opening in Browser',
        `Your project is opening in ${service === 'stackblitz' ? 'StackBlitz' : 'CodeSandbox'}. You can now test it with full functionality!`,
        [{ text: 'OK' }]
      );

      // Close modal after opening
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error opening IDE:', error);
      Alert.alert(
        'Error',
        `Failed to open ${service}. Please try again or use another service.`
      );
    } finally {
      setIsOpening(false);
      setSelectedService(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="play-circle" size={28} color="#0F7B6C" />
              <View>
                <Text style={styles.headerTitle}>Run Project</Text>
                <Text style={styles.headerSubtitle}>Test with full functionality</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#AAA" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.description}>
              Choose a browser-based IDE to run and test your project with full Node.js support,
              hot reload, and live preview.
            </Text>

            {/* IDE Options */}
            <View style={styles.ideOptions}>
              {/* StackBlitz */}
              <TouchableOpacity
                style={styles.ideCard}
                onPress={() => handleOpenIDE('stackblitz')}
                disabled={isOpening}
              >
                <View style={[styles.ideIcon, { backgroundColor: '#1389FD20' }]}>
                  <Ionicons name="flash" size={32} color="#1389FD" />
                </View>
                <View style={styles.ideInfo}>
                  <Text style={styles.ideName}>StackBlitz</Text>
                  <Text style={styles.ideDescription}>
                    Fast, runs Node.js in browser, instant hot reload
                  </Text>
                  <View style={styles.ideFeatures}>
                    <View style={styles.featureBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#0F7B6C" />
                      <Text style={styles.featureText}>Instant startup</Text>
                    </View>
                    <View style={styles.featureBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#0F7B6C" />
                      <Text style={styles.featureText}>Full Node.js</Text>
                    </View>
                  </View>
                </View>
                {isOpening && selectedService === 'stackblitz' && (
                  <ActivityIndicator size="small" color="#1389FD" />
                )}
                {!isOpening && (
                  <Ionicons name="arrow-forward" size={20} color="#666" />
                )}
              </TouchableOpacity>

              {/* CodeSandbox */}
              <TouchableOpacity
                style={styles.ideCard}
                onPress={() => handleOpenIDE('codesandbox')}
                disabled={isOpening}
              >
                <View style={[styles.ideIcon, { backgroundColor: '#15161820' }]}>
                  <Ionicons name="cube" size={32} color="#151618" />
                </View>
                <View style={styles.ideInfo}>
                  <Text style={styles.ideName}>CodeSandbox</Text>
                  <Text style={styles.ideDescription}>
                    Popular, great UI, excellent for sharing
                  </Text>
                  <View style={styles.ideFeatures}>
                    <View style={styles.featureBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#0F7B6C" />
                      <Text style={styles.featureText}>Easy sharing</Text>
                    </View>
                    <View style={styles.featureBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#0F7B6C" />
                      <Text style={styles.featureText}>Beautiful UI</Text>
                    </View>
                  </View>
                </View>
                {isOpening && selectedService === 'codesandbox' && (
                  <ActivityIndicator size="small" color="#151618" />
                )}
                {!isOpening && (
                  <Ionicons name="arrow-forward" size={20} color="#666" />
                )}
              </TouchableOpacity>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#2EAADC" />
              <Text style={styles.infoText}>
                Your project will open in a new browser tab with a fully functional development
                environment. You can edit, test, and share it!
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#AAA',
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2D2D2D',
  },
  content: {
    padding: 20,
  },
  description: {
    color: '#AAA',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  ideOptions: {
    gap: 16,
    marginBottom: 20,
  },
  ideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D2D2D',
    gap: 16,
  },
  ideIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ideInfo: {
    flex: 1,
  },
  ideName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ideDescription: {
    color: '#AAA',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  ideFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featureText: {
    color: '#2EAADC',
    fontSize: 11,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#1E3A8A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2EAADC',
  },
  infoText: {
    flex: 1,
    color: '#2EAADC',
    fontSize: 13,
    lineHeight: 20,
  },
});
