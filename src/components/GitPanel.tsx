import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GitService } from '../services/GitService';
import { GitStatus } from '../types';
import { useEditor } from '../contexts/EditorContext';

export const GitPanel: React.FC = () => {
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [cloneUrl, setCloneUrl] = useState('');
  const [branches, setBranches] = useState<string[]>([]);
  const { rootPath } = useEditor();

  useEffect(() => {
    if (rootPath) {
      refreshStatus();
    }
  }, [rootPath]);

  const refreshStatus = async () => {
    if (!rootPath) return;

    setLoading(true);
    try {
      const status = await GitService.getChangedFiles(rootPath);
      setGitStatus(status);
      const branchList = await GitService.listBranches(rootPath);
      setBranches(branchList);
    } catch (error) {
      console.error('Error getting git status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInit = async () => {
    if (!rootPath) return;

    try {
      await GitService.init(rootPath);
      Alert.alert('Success', 'Git repository initialized');
      refreshStatus();
    } catch (error) {
      Alert.alert('Error', 'Failed to initialize repository');
    }
  };

  const handleClone = async () => {
    if (!rootPath || !cloneUrl.trim()) return;

    setLoading(true);
    try {
      await GitService.clone(cloneUrl, rootPath);
      Alert.alert('Success', 'Repository cloned successfully');
      setShowCloneModal(false);
      setCloneUrl('');
      refreshStatus();
    } catch (error) {
      Alert.alert('Error', 'Failed to clone repository');
    } finally {
      setLoading(false);
    }
  };

  const handleStage = async (filepath: string) => {
    if (!rootPath) return;

    try {
      await GitService.add(rootPath, filepath);
      refreshStatus();
    } catch (error) {
      Alert.alert('Error', 'Failed to stage file');
    }
  };

  const handleStageAll = async () => {
    if (!rootPath) return;

    try {
      await GitService.addAll(rootPath);
      refreshStatus();
    } catch (error) {
      Alert.alert('Error', 'Failed to stage all files');
    }
  };

  const handleCommit = async () => {
    if (!rootPath || !commitMessage.trim()) return;

    setLoading(true);
    try {
      await GitService.commit(rootPath, commitMessage);
      Alert.alert('Success', 'Changes committed');
      setShowCommitModal(false);
      setCommitMessage('');
      refreshStatus();
    } catch (error) {
      Alert.alert('Error', 'Failed to commit changes');
    } finally {
      setLoading(false);
    }
  };

  const handlePush = async () => {
    if (!rootPath) return;

    setLoading(true);
    try {
      await GitService.push(rootPath);
      Alert.alert('Success', 'Changes pushed to remote');
      refreshStatus();
    } catch (error) {
      Alert.alert('Error', 'Failed to push changes');
    } finally {
      setLoading(false);
    }
  };

  const handlePull = async () => {
    if (!rootPath) return;

    setLoading(true);
    try {
      await GitService.pull(rootPath);
      Alert.alert('Success', 'Changes pulled from remote');
      refreshStatus();
    } catch (error) {
      Alert.alert('Error', 'Failed to pull changes');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = (branchName: string) => {
    Alert.alert(
      'Checkout Branch',
      `Switch to branch ${branchName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Checkout',
          onPress: async () => {
            if (!rootPath) return;
            try {
              await GitService.checkout(rootPath, branchName);
              refreshStatus();
              Alert.alert('Success', `Switched to ${branchName}`);
            } catch (error) {
              Alert.alert('Error', 'Failed to checkout branch');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Git</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={refreshStatus}>
            <Ionicons name="refresh" size={20} color="#4A90E2" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleInit}>
            <Ionicons name="git-branch" size={20} color="#4A90E2" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowCloneModal(true)}
          >
            <Ionicons name="cloud-download" size={20} color="#4A90E2" />
          </TouchableOpacity>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#4A90E2" />
        </View>
      )}

      <ScrollView style={styles.content}>
        {gitStatus && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Branch: {gitStatus.branch}
              </Text>
            </View>

            {branches.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Branches</Text>
                {branches.map((branch) => (
                  <TouchableOpacity
                    key={branch}
                    style={styles.branchItem}
                    onPress={() => handleCheckout(branch)}
                  >
                    <Ionicons
                      name={branch === gitStatus.branch ? 'checkmark-circle' : 'ellipse-outline'}
                      size={16}
                      color={branch === gitStatus.branch ? '#4A90E2' : '#AAA'}
                    />
                    <Text style={styles.branchText}>{branch}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {gitStatus.staged.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Staged Changes</Text>
                {gitStatus.staged.map((file) => (
                  <View key={file} style={styles.fileItem}>
                    <Ionicons name="add-circle" size={16} color="#4CAF50" />
                    <Text style={styles.fileText}>{file}</Text>
                  </View>
                ))}
              </View>
            )}

            {gitStatus.unstaged.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Unstaged Changes</Text>
                {gitStatus.unstaged.map((file) => (
                  <TouchableOpacity
                    key={file}
                    style={styles.fileItem}
                    onPress={() => handleStage(file)}
                  >
                    <Ionicons name="create" size={16} color="#FFA500" />
                    <Text style={styles.fileText}>{file}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {gitStatus.untracked.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Untracked Files</Text>
                {gitStatus.untracked.map((file) => (
                  <TouchableOpacity
                    key={file}
                    style={styles.fileItem}
                    onPress={() => handleStage(file)}
                  >
                    <Ionicons name="help-circle" size={16} color="#AAA" />
                    <Text style={styles.fileText}>{file}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerButton} onPress={handleStageAll}>
          <Ionicons name="add" size={16} color="#FFF" />
          <Text style={styles.footerButtonText}>Stage All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => setShowCommitModal(true)}
        >
          <Ionicons name="checkmark" size={16} color="#FFF" />
          <Text style={styles.footerButtonText}>Commit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton} onPress={handlePush}>
          <Ionicons name="cloud-upload" size={16} color="#FFF" />
          <Text style={styles.footerButtonText}>Push</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton} onPress={handlePull}>
          <Ionicons name="cloud-download" size={16} color="#FFF" />
          <Text style={styles.footerButtonText}>Pull</Text>
        </TouchableOpacity>
      </View>

      {/* Commit Modal */}
      <Modal visible={showCommitModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Commit Changes</Text>
            <TextInput
              style={styles.commitInput}
              placeholder="Commit message"
              placeholderTextColor="#666"
              value={commitMessage}
              onChangeText={setCommitMessage}
              multiline
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCommitModal(false);
                  setCommitMessage('');
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.commitButton]}
                onPress={handleCommit}
              >
                <Text style={styles.buttonText}>Commit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Clone Modal */}
      <Modal visible={showCloneModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Clone Repository</Text>
            <TextInput
              style={styles.input}
              placeholder="Repository URL"
              placeholderTextColor="#666"
              value={cloneUrl}
              onChangeText={setCloneUrl}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCloneModal(false);
                  setCloneUrl('');
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.commitButton]}
                onPress={handleClone}
              >
                <Text style={styles.buttonText}>Clone</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 10,
    padding: 5,
  },
  loadingContainer: {
    padding: 10,
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  fileText: {
    color: '#FFF',
    marginLeft: 8,
    fontSize: 13,
  },
  branchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  branchText: {
    color: '#FFF',
    marginLeft: 8,
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#2D2D2D',
  },
  footerButtonText: {
    color: '#FFF',
    marginLeft: 5,
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: '#2D2D2D',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#1E1E1E',
    color: '#FFF',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  commitInput: {
    backgroundColor: '#1E1E1E',
    color: '#FFF',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#555',
  },
  commitButton: {
    backgroundColor: '#4A90E2',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});
