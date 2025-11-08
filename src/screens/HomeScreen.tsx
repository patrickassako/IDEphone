import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FileSystemService } from '../services/FileSystemService';
import { Repository } from '../types';
import { useEditor } from '../contexts/EditorContext';
import { GitService } from '../services/GitService';

interface HomeScreenProps {
  onProjectSelect: (repo: Repository) => void;
  navigation?: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onProjectSelect, navigation }) => {
  const [projects, setProjects] = useState<Repository[]>([]);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [cloneUrl, setCloneUrl] = useState('');
  const { setRootPath, setCurrentRepository } = useEditor();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      await FileSystemService.initialize();
      const baseDir = FileSystemService.getBaseDir();
      const items = await FileSystemService.readDirectory(baseDir);

      const repos: Repository[] = items
        .filter((item) => item.type === 'directory')
        .map((item) => ({
          name: item.name,
          path: item.path,
        }));

      setProjects(repos);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      Alert.alert('Error', 'Please enter a project name');
      return;
    }

    try {
      const baseDir = FileSystemService.getBaseDir();
      const projectPath = await FileSystemService.createDirectory(baseDir, projectName);

      // Initialize git repository
      await GitService.init(projectPath);

      // Create a default README file
      await FileSystemService.createFile(projectPath, 'README.md');
      await FileSystemService.writeFile(
        projectPath + '/README.md',
        `# ${projectName}\n\nCreated with IDEphone`
      );

      const newRepo: Repository = {
        name: projectName,
        path: projectPath,
      };

      setShowNewProjectModal(false);
      setProjectName('');
      loadProjects();

      Alert.alert('Success', 'Project created successfully', [
        { text: 'OK', onPress: () => handleOpenProject(newRepo) },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create project');
    }
  };

  const handleCloneProject = async () => {
    if (!cloneUrl.trim()) {
      Alert.alert('Error', 'Please enter a repository URL');
      return;
    }

    try {
      const repoName = cloneUrl.split('/').pop()?.replace('.git', '') || 'cloned-repo';
      const baseDir = FileSystemService.getBaseDir();
      const projectPath = baseDir + repoName;

      await GitService.clone(cloneUrl, projectPath);

      const newRepo: Repository = {
        name: repoName,
        path: projectPath,
        url: cloneUrl,
      };

      setShowCloneModal(false);
      setCloneUrl('');
      loadProjects();

      Alert.alert('Success', 'Repository cloned successfully', [
        { text: 'OK', onPress: () => handleOpenProject(newRepo) },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to clone repository');
    }
  };

  const handleOpenProject = (repo: Repository) => {
    setRootPath(repo.path);
    setCurrentRepository(repo);
    onProjectSelect(repo);
  };

  const handleDeleteProject = (repo: Repository) => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete ${repo.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await FileSystemService.deleteItem(repo.path);
              loadProjects();
              Alert.alert('Success', 'Project deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete project');
            }
          },
        },
      ]
    );
  };

  const renderProject = ({ item }: { item: Repository }) => (
    <TouchableOpacity
      style={styles.projectItem}
      onPress={() => handleOpenProject(item)}
      onLongPress={() => handleDeleteProject(item)}
    >
      <View style={styles.projectIcon}>
        <Ionicons name="folder" size={40} color="#FFD700" />
      </View>
      <View style={styles.projectInfo}>
        <Text style={styles.projectName}>{item.name}</Text>
        {item.url && <Text style={styles.projectUrl}>{item.url}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={24} color="#666" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>IDEphone</Text>
        <Text style={styles.subtitle}>Mobile Code Editor</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowNewProjectModal(true)}
        >
          <Ionicons name="add-circle" size={24} color="#4A90E2" />
          <Text style={styles.actionText}>Nouveau Projet</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowCloneModal(true)}
        >
          <Ionicons name="cloud-download" size={24} color="#4A90E2" />
          <Text style={styles.actionText}>Cloner Repository</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.projectsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Projets Récents</Text>
        </View>
        {projects.length > 0 ? (
          <FlatList
            data={projects}
            renderItem={renderProject}
            keyExtractor={(item) => item.path}
            style={styles.projectList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>Aucun projet</Text>
            <Text style={styles.emptySubtext}>
              Créez un nouveau projet, clonez un repository ou connectez-vous à GitHub
            </Text>
          </View>
        )}
      </View>

      {/* New Project Modal */}
      <Modal visible={showNewProjectModal} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nouveau Projet</Text>
            <TextInput
              style={styles.input}
              placeholder="Nom du projet"
              placeholderTextColor="#666"
              value={projectName}
              onChangeText={setProjectName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowNewProjectModal(false);
                  setProjectName('');
                }}
              >
                <Text style={styles.buttonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreateProject}
              >
                <Text style={styles.buttonText}>Créer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Clone Modal */}
      <Modal visible={showCloneModal} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cloner Repository</Text>
            <TextInput
              style={styles.input}
              placeholder="Repository URL (https://...)"
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
                <Text style={styles.buttonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCloneProject}
              >
                <Text style={styles.buttonText}>Cloner</Text>
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
    padding: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#AAA',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: 15,
  },
  actionText: {
    color: '#FFF',
    marginTop: 8,
    fontSize: 14,
  },
  projectsSection: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  projectList: {
    flex: 1,
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#2D2D2D',
    borderRadius: 8,
    marginBottom: 10,
  },
  projectIcon: {
    marginRight: 15,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  projectUrl: {
    color: '#AAA',
    fontSize: 12,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#AAA',
    fontSize: 18,
    marginTop: 15,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
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
  createButton: {
    backgroundColor: '#4A90E2',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});
