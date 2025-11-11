/**
 * Project Validation Modal
 * Shows validation errors and allows AI to fix them
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProjectValidationError } from '../types';

interface ProjectValidationModalProps {
  visible: boolean;
  errors: ProjectValidationError[];
  warnings: ProjectValidationError[];
  onClose: () => void;
  onFixErrors?: () => Promise<void>;
  onContinueAnyway?: () => void;
}

export const ProjectValidationModal: React.FC<ProjectValidationModalProps> = ({
  visible,
  errors,
  warnings,
  onClose,
  onFixErrors,
  onContinueAnyway,
}) => {
  const [isFixing, setIsFixing] = useState(false);

  const handleFixErrors = async () => {
    if (!onFixErrors) return;

    setIsFixing(true);
    try {
      await onFixErrors();
      onClose();
    } catch (error) {
      console.error('Error fixing:', error);
    } finally {
      setIsFixing(false);
    }
  };

  const getSeverityIcon = (severity: 'error' | 'warning') => {
    return severity === 'error' ? 'close-circle' : 'warning';
  };

  const getSeverityColor = (severity: 'error' | 'warning') => {
    return severity === 'error' ? '#ef4444' : '#f59e0b';
  };

  const totalIssues = errors.length + warnings.length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons
                name={errors.length > 0 ? 'alert-circle' : 'warning'}
                size={24}
                color={errors.length > 0 ? '#ef4444' : '#f59e0b'}
              />
              <Text style={styles.title}>
                {errors.length > 0 ? 'Validation Errors' : 'Warnings'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Summary */}
          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              Found {totalIssues} issue{totalIssues !== 1 ? 's' : ''} in your project
            </Text>
            {errors.length > 0 && (
              <Text style={styles.summarySubtext}>
                {errors.length} error{errors.length !== 1 ? 's' : ''} must be fixed before deployment
              </Text>
            )}
          </View>

          {/* Issues List */}
          <ScrollView style={styles.issuesList}>
            {errors.map((error, index) => (
              <View key={`error-${index}`} style={styles.issueItem}>
                <Ionicons
                  name={getSeverityIcon(error.severity)}
                  size={20}
                  color={getSeverityColor(error.severity)}
                  style={styles.issueIcon}
                />
                <View style={styles.issueContent}>
                  <Text style={styles.issueFile}>{error.file}</Text>
                  {error.line && (
                    <Text style={styles.issueLine}>Line {error.line}</Text>
                  )}
                  <Text style={styles.issueMessage}>{error.message}</Text>
                  {error.suggestedFix && (
                    <View style={styles.fixSuggestion}>
                      <Ionicons name="bulb-outline" size={14} color="#2eaadc" />
                      <Text style={styles.fixText}>{error.suggestedFix}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}

            {warnings.map((warning, index) => (
              <View key={`warning-${index}`} style={styles.issueItem}>
                <Ionicons
                  name={getSeverityIcon(warning.severity)}
                  size={20}
                  color={getSeverityColor(warning.severity)}
                  style={styles.issueIcon}
                />
                <View style={styles.issueContent}>
                  <Text style={styles.issueFile}>{warning.file}</Text>
                  {warning.line && (
                    <Text style={styles.issueLine}>Line {warning.line}</Text>
                  )}
                  <Text style={styles.issueMessage}>{warning.message}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            {onFixErrors && errors.length > 0 && (
              <TouchableOpacity
                style={styles.fixButton}
                onPress={handleFixErrors}
                disabled={isFixing}
              >
                {isFixing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="construct-outline" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Fix with AI</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {errors.length === 0 && onContinueAnyway && (
              <TouchableOpacity
                style={styles.continueButton}
                onPress={onContinueAnyway}
              >
                <Text style={styles.buttonText}>Continue Anyway</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
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
  },
  modal: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  summary: {
    padding: 20,
    backgroundColor: '#0f0f0f',
  },
  summaryText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
  issuesList: {
    flex: 1,
    padding: 20,
  },
  issueItem: {
    flexDirection: 'row',
    backgroundColor: '#0f0f0f',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  issueIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  issueContent: {
    flex: 1,
  },
  issueFile: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2eaadc',
    marginBottom: 4,
  },
  issueLine: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 8,
  },
  issueMessage: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  fixSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#1e1e1e',
    borderRadius: 4,
    gap: 6,
  },
  fixText: {
    flex: 1,
    fontSize: 13,
    color: '#2eaadc',
  },
  actions: {
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  fixButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2eaadc',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b',
    paddingVertical: 14,
    borderRadius: 8,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    paddingVertical: 14,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
});
