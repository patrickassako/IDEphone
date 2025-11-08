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
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import JSZip from 'jszip';
import { FileSystemService } from '../services/FileSystemService';
import { FolderPickerService } from '../services/FolderPickerService';
import { Repository } from '../types';
import { useEditor } from '../contexts/EditorContext';
import { GitService } from '../services/GitService';

interface HomeScreenProps {
  onProjectSelect: (repo: Repository) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onProjectSelect }) => {
  const [projects, setProjects] = useState<Repository[]>([]);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [cloneUrl, setCloneUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
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
      const projectPath = baseDir + (baseDir.endsWith('/') ? '' : '/') + repoName;

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
      console.error('Error cloning repository:', error);
      Alert.alert('Error', `Failed to clone repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleOpenProject = (repo: Repository) => {
    console.log('Opening project:', repo.name, 'Path:', repo.path);
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

  const handleImportFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true, // Allow multiple file selection
      });

      if (result.canceled) {
        return;
      }

      const files = result.assets;
      const baseDir = FileSystemService.getBaseDir();

      // Create a project folder for imported files if it doesn't exist
      const importedProjectName = 'Imported Files';
      const importedProjectPath = baseDir + importedProjectName;

      try {
        await FileSystemService.createDirectory(baseDir, importedProjectName);
      } catch (error) {
        // Directory might already exist, that's ok
      }

      // Copy all files to the imported project folder
      let successCount = 0;
      for (const file of files) {
        try {
          const fileName = file.name;
          const destPath = importedProjectPath + '/' + fileName;
          await FileSystemService.copyItem(file.uri, destPath);
          successCount++;
        } catch (error) {
          console.error(`Error importing file ${file.name}:`, error);
        }
      }

      if (successCount > 0) {
        Alert.alert(
          'Success',
          `${successCount} file(s) imported successfully`,
          [
            {
              text: 'OK',
              onPress: () => {
                loadProjects();
                const repo: Repository = {
                  name: importedProjectName,
                  path: importedProjectPath,
                };
                handleOpenProject(repo);
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to import files');
      }
    } catch (error) {
      console.error('Error importing file:', error);
      Alert.alert('Error', 'Failed to import file');
    }
  };

  const handleOpenProjectOptions = () => {
    Alert.alert(
      'Ouvrir un projet',
      'Choisissez une méthode pour ouvrir votre projet',
      [
        {
          text: 'Fichier ZIP',
          onPress: handleOpenProjectFromZip,
        },
        {
          text: 'Sélectionner des fichiers',
          onPress: handleOpenProjectFromFiles,
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]
    );
  };

  const handleOpenProjectFromZip = async () => {
    try {
      setIsImporting(true);

      // Pick a ZIP file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/zip',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsImporting(false);
        return;
      }

      const zipFile = result.assets[0];
      const baseDir = FileSystemService.getBaseDir();

      // Extract project name from ZIP filename
      const projectName = zipFile.name.replace('.zip', '').replace(/[^a-zA-Z0-9-_]/g, '_');
      const projectPath = baseDir + (baseDir.endsWith('/') ? '' : '/') + projectName;

      // Check if project already exists
      const exists = await FileSystemService.exists(projectPath);
      if (exists) {
        Alert.alert(
          'Project Exists',
          `A project named "${projectName}" already exists. Do you want to replace it?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setIsImporting(false),
            },
            {
              text: 'Replace',
              style: 'destructive',
              onPress: async () => {
                await FileSystemService.deleteItem(projectPath);
                await extractZipAndOpen(zipFile.uri, projectPath, projectName);
              },
            },
          ]
        );
      } else {
        await extractZipAndOpen(zipFile.uri, projectPath, projectName);
      }
    } catch (error) {
      console.error('Error opening project from ZIP:', error);
      Alert.alert('Error', 'Failed to open project from ZIP file');
      setIsImporting(false);
    }
  };

  const handleOpenProjectFromFiles = async () => {
    try {
      setIsImporting(true);

      // Show instructions first
      const instructions = Platform.select({
        android:
          'Sélectionnez TOUS les fichiers de votre projet.\n\n' +
          'Astuce: Dans votre gestionnaire de fichiers, appuyez longuement sur un fichier, puis sélectionnez tous les autres fichiers du projet.',
        ios:
          'Ouvrez l\'app Files, naviguez vers votre projet.\n\n' +
          'Appuyez sur "Sélectionner" en haut à droite, puis sélectionnez tous les fichiers de votre projet.',
        default: 'Sélectionnez tous les fichiers de votre projet',
      });

      Alert.alert(
        'Comment sélectionner votre projet ?',
        instructions,
        [
          {
            text: 'Annuler',
            style: 'cancel',
            onPress: () => setIsImporting(false),
          },
          {
            text: 'Continuer',
            onPress: async () => {
              await selectMultipleFiles();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error opening project from files:', error);
      Alert.alert('Error', 'Failed to open project');
      setIsImporting(false);
    }
  };

  const selectMultipleFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (result.canceled) {
        setIsImporting(false);
        return;
      }

      const files = result.assets;
      if (files.length === 0) {
        Alert.alert('Error', 'No files selected');
        setIsImporting(false);
        return;
      }

      const baseDir = FileSystemService.getBaseDir();

      // Extract project name from first file or use timestamp
      const projectName = `Project_${new Date().getTime()}`;
      const projectPath = baseDir + (baseDir.endsWith('/') ? '' : '/') + projectName;

      // Create project directory
      await FileSystemService.createDirectory(baseDir, projectName);

      // Copy all files and recreate structure
      let successCount = 0;
      for (const file of files) {
        try {
          const fileName = file.name;
          const destPath = projectPath + '/' + fileName;

          // Create parent directories if file has path separators
          const pathParts = fileName.split('/');
          if (pathParts.length > 1) {
            let currentPath = projectPath;
            for (let i = 0; i < pathParts.length - 1; i++) {
              currentPath += '/' + pathParts[i];
              const dirExists = await FileSystemService.exists(currentPath);
              if (!dirExists) {
                await FileSystem.makeDirectoryAsync(currentPath, { intermediates: true });
              }
            }
          }

          await FileSystemService.copyItem(file.uri, destPath);
          successCount++;
        } catch (error) {
          console.error(`Error importing file ${file.name}:`, error);
        }
      }

      setIsImporting(false);

      if (successCount > 0) {
        const newRepo: Repository = {
          name: projectName,
          path: projectPath,
        };

        loadProjects();

        Alert.alert(
          'Success',
          `Project opened with ${successCount} files`,
          [{ text: 'OK', onPress: () => handleOpenProject(newRepo) }]
        );
      } else {
        Alert.alert('Error', 'Failed to import files');
      }
    } catch (error) {
      console.error('Error selecting files:', error);
      Alert.alert('Error', 'Failed to select files');
      setIsImporting(false);
    }
  };

  const extractZipAndOpen = async (zipUri: string, projectPath: string, projectName: string) => {
    try {
      // Read ZIP file as base64
      const zipBase64 = await FileSystem.readAsStringAsync(zipUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to binary
      const zipBinary = atob(zipBase64);
      const zipArray = new Uint8Array(zipBinary.length);
      for (let i = 0; i < zipBinary.length; i++) {
        zipArray[i] = zipBinary.charCodeAt(i);
      }

      // Unzip the file
      const zip = await JSZip.loadAsync(zipArray);

      // Create project directory
      await FileSystemService.createDirectory(FileSystemService.getBaseDir(), projectName);

      // Extract all files
      let fileCount = 0;
      const filePromises: Promise<void>[] = [];

      zip.forEach((relativePath, file) => {
        if (!file.dir) {
          const promise = (async () => {
            try {
              // Skip hidden files and system files
              if (relativePath.includes('__MACOSX') || relativePath.startsWith('.')) {
                return;
              }

              const content = await file.async('string');
              const fullPath = projectPath + '/' + relativePath;

              // Create parent directories if needed
              const pathParts = relativePath.split('/');
              if (pathParts.length > 1) {
                let currentPath = projectPath;
                for (let i = 0; i < pathParts.length - 1; i++) {
                  currentPath += '/' + pathParts[i];
                  const dirExists = await FileSystemService.exists(currentPath);
                  if (!dirExists) {
                    await FileSystem.makeDirectoryAsync(currentPath, { intermediates: true });
                  }
                }
              }

              // Write the file
              await FileSystem.writeAsStringAsync(fullPath, content);
              fileCount++;
            } catch (error) {
              console.error(`Error extracting ${relativePath}:`, error);
            }
          })();

          filePromises.push(promise);
        }
      });

      // Wait for all files to be extracted
      await Promise.all(filePromises);

      setIsImporting(false);

      if (fileCount > 0) {
        const newRepo: Repository = {
          name: projectName,
          path: projectPath,
        };

        loadProjects();

        Alert.alert(
          'Success',
          `Project "${projectName}" opened successfully with ${fileCount} files`,
          [{ text: 'OK', onPress: () => handleOpenProject(newRepo) }]
        );
      } else {
        Alert.alert('Error', 'No files found in ZIP archive');
      }
    } catch (error) {
      console.error('Error extracting ZIP:', error);
      Alert.alert('Error', 'Failed to extract ZIP file');
      setIsImporting(false);
    }
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

      <View style={styles.actionsContainer}>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowNewProjectModal(true)}
          >
            <Ionicons name="add-circle" size={24} color="#4A90E2" />
            <Text style={styles.actionText}>New Project</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleOpenProjectOptions}
            disabled={isImporting}
          >
            {isImporting ? (
              <ActivityIndicator size="small" color="#4A90E2" />
            ) : (
              <Ionicons name="folder-open" size={24} color="#4A90E2" />
            )}
            <Text style={styles.actionText}>Open Project</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowCloneModal(true)}
          >
            <Ionicons name="cloud-download" size={24} color="#4A90E2" />
            <Text style={styles.actionText}>Clone Repo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleImportFile}
          >
            <Ionicons name="document-attach" size={24} color="#4A90E2" />
            <Text style={styles.actionText}>Import Files</Text>
          </TouchableOpacity>
        </View>
        {isImporting && (
          <View style={styles.loadingBanner}>
            <ActivityIndicator size="small" color="#4A90E2" />
            <Text style={styles.loadingText}>Extracting project...</Text>
          </View>
        )}
      </View>

      <View style={styles.projectsSection}>
        <Text style={styles.sectionTitle}>Recent Projects</Text>
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
            <Text style={styles.emptyText}>No projects yet</Text>
            <Text style={styles.emptySubtext}>Create a new project or clone a repository to get started</Text>
          </View>
        )}
      </View>

      {/* New Project Modal */}
      <Modal visible={showNewProjectModal} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Project</Text>
            <TextInput
              style={styles.input}
              placeholder="Project name"
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
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreateProject}
              >
                <Text style={styles.buttonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Clone Modal */}
      <Modal visible={showCloneModal} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Clone Repository</Text>
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
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCloneProject}
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
  actionsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: 10,
    minWidth: 70,
  },
  actionText: {
    color: '#FFF',
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
  },
  loadingText: {
    color: '#4A90E2',
    marginLeft: 10,
    fontSize: 14,
  },
  projectsSection: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 15,
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
