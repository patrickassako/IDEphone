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
}

export const FileBrowser: React.FC<FileBrowserProps> = ({ onFileSelect }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const { rootPath, setRootPath } = useEditor();

  useEffect(() => {
    initializeFileSystem();
  }, []);

  const initializeFileSystem = async () => {
    await FileSystemService.initialize();
    const baseDir = FileSystemService.getBaseDir();
    setRootPath(baseDir);
    setCurrentPath(baseDir);
    loadFiles(baseDir);
  };

  const loadFiles = async (path: string) => {
    const items = await FileSystemService.readDirectory(path);
    setFiles(items);
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

      <FlatList
        data={files}
        keyExtractor={(item) => item.path}
        renderItem={({ item }) => renderFileItem({ item })}
        style={styles.fileList}
      />

      {/* New File Modal */}
      <Modal visible={showNewFileModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New File</Text>
            <TextInput
              style={styles.input}
              placeholder="File name"
              value={newItemName}
              onChangeText={setNewItemName}
              autoFocus
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
      <Modal visible={showNewFolderModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Folder</Text>
            <TextInput
              style={styles.input}
              placeholder="Folder name"
              value={newItemName}
              onChangeText={setNewItemName}
              autoFocus
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
