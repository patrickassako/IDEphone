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
import { FileItem } from '../types';
import { FileSystemService } from '../services/FileSystemService';
import { useEditor } from '../contexts/EditorContext';

interface FileBrowserProps {
  onFileSelect: (file: FileItem) => void;
  fullscreen?: boolean;
}

export const FileBrowser: React.FC<FileBrowserProps> = ({ onFileSelect, fullscreen = false }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [allFiles, setAllFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { rootPath, setRootPath } = useEditor();

  useEffect(() => {
    initializeFileSystem();
  }, []);

  useEffect(() => {
    // When rootPath changes (e.g., a project is selected), load that project's files
    if (rootPath) {
      console.log('FileBrowser: Loading files from rootPath:', rootPath);
      setCurrentPath(rootPath);
      loadFiles(rootPath);
    }
  }, [rootPath]);

  const initializeFileSystem = async () => {
    await FileSystemService.initialize();
    // Don't set a default path here - wait for a project to be selected
    if (rootPath) {
      setCurrentPath(rootPath);
      loadFiles(rootPath);
    }
  };

  const loadFiles = async (path: string) => {
    const items = await FileSystemService.readDirectory(path);
    setFiles(items);

    // Load all files recursively for search (only in fullscreen mode)
    if (fullscreen && rootPath) {
      loadAllFilesRecursive(rootPath);
    }
  };

  const loadAllFilesRecursive = async (path: string) => {
    try {
      const allFilesList: FileItem[] = [];

      const scanDirectory = async (dirPath: string, depth: number = 0) => {
        if (depth > 10) return; // Prevent infinite loops

        const items = await FileSystemService.readDirectory(dirPath);

        for (const item of items) {
          // Skip hidden files/folders and node_modules
          if (item.name.startsWith('.') || item.name === 'node_modules') {
            continue;
          }

          allFilesList.push(item);

          if (item.type === 'directory') {
            await scanDirectory(item.path, depth + 1);
          }
        }
      };

      await scanDirectory(path);
      setAllFiles(allFilesList);
    } catch (error) {
      console.error('Error loading all files:', error);
    }
  };

  const filterFiles = (query: string) => {
    if (!query.trim()) {
      return files;
    }

    const lowerQuery = query.toLowerCase();
    return allFiles.filter(file =>
      file.name.toLowerCase().includes(lowerQuery)
    );
  };

  const handleFilePress = async (file: FileItem) => {
    if (file.type === 'directory') {
      if (file.isExpanded) {
        // Collapse
        setFiles(
          files.map((f) =>
            f.path === file.path ? { ...f, isExpanded: false, children: [] } : f
          )
        );
      } else {
        // Expand
        const children = await FileSystemService.readDirectory(file.path);
        setFiles(
          files.map((f) =>
            f.path === file.path ? { ...f, isExpanded: true, children } : f
          )
        );
      }
    } else {
      onFileSelect(file);
    }
  };

  const handleNewFile = async () => {
    if (newItemName.trim()) {
      try {
        await FileSystemService.createFile(currentPath, newItemName);
        loadFiles(currentPath);
        setShowNewFileModal(false);
        setNewItemName('');
      } catch (error) {
        Alert.alert('Error', 'Failed to create file');
      }
    }
  };

  const handleNewFolder = async () => {
    if (newItemName.trim()) {
      try {
        await FileSystemService.createDirectory(currentPath, newItemName);
        loadFiles(currentPath);
        setShowNewFolderModal(false);
        setNewItemName('');
      } catch (error) {
        Alert.alert('Error', 'Failed to create folder');
      }
    }
  };

  const handleDelete = (file: FileItem) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${file.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await FileSystemService.deleteItem(file.path);
              loadFiles(currentPath);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const renderFileItem = ({ item, level = 0 }: { item: FileItem; level?: number }) => (
    <View>
      <TouchableOpacity
        style={[styles.fileItem, { paddingLeft: 10 + level * 20 }]}
        onPress={() => handleFilePress(item)}
        onLongPress={() => handleDelete(item)}
      >
        <Ionicons
          name={
            item.type === 'directory'
              ? item.isExpanded
                ? 'folder-open'
                : 'folder'
              : 'document-text'
          }
          size={20}
          color={item.type === 'directory' ? '#FFD700' : '#4A90E2'}
        />
        <Text style={styles.fileName}>{item.name}</Text>
      </TouchableOpacity>
      {item.isExpanded &&
        item.children?.map((child) => (
          <View key={child.path}>{renderFileItem({ item: child, level: level + 1 })}</View>
        ))}
    </View>
  );

  const displayedFiles = searchQuery ? filterFiles(searchQuery) : files;

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Text style={styles.title}>Files</Text>
        <View style={styles.toolbarButtons}>
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => setShowNewFileModal(true)}
          >
            <Ionicons name="document-outline" size={20} color="#4A90E2" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => setShowNewFolderModal(true)}
          >
            <Ionicons name="folder-outline" size={20} color="#4A90E2" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => loadFiles(currentPath)}
          >
            <Ionicons name="refresh" size={20} color="#4A90E2" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar (only in fullscreen mode) */}
      {fullscreen && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search files..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      )}

      <FlatList
        data={displayedFiles}
        keyExtractor={(item) => item.path}
        renderItem={({ item }) => renderFileItem({ item })}
        style={styles.fileList}
        ListEmptyComponent={
          searchQuery ? (
            <View style={styles.emptySearch}>
              <Ionicons name="search-outline" size={48} color="#666" />
              <Text style={styles.emptySearchText}>
                No files found matching "{searchQuery}"
              </Text>
            </View>
          ) : null
        }
      />

      {/* New File Modal */}
      <Modal visible={showNewFileModal} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New File</Text>
            <TextInput
              style={styles.input}
              placeholder="File name"
              value={newItemName}
              onChangeText={setNewItemName}
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowNewFileModal(false);
                  setNewItemName('');
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleNewFile}
              >
                <Text style={styles.buttonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* New Folder Modal */}
      <Modal visible={showNewFolderModal} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Folder</Text>
            <TextInput
              style={styles.input}
              placeholder="Folder name"
              value={newItemName}
              onChangeText={setNewItemName}
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowNewFolderModal(false);
                  setNewItemName('');
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleNewFolder}
              >
                <Text style={styles.buttonText}>Create</Text>
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
  toolbar: {
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
  toolbarButtons: {
    flexDirection: 'row',
  },
  toolbarButton: {
    marginLeft: 10,
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D2D2D',
    marginHorizontal: 10,
    marginVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    paddingVertical: 8,
  },
  emptySearch: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptySearchText: {
    color: '#666',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  fileList: {
    flex: 1,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  fileName: {
    color: '#FFF',
    marginLeft: 10,
    fontSize: 14,
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
