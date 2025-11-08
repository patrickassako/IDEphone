import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GitHubAPIService, GitHubRepository } from '../services/GitHubAPIService';
import { GitService } from '../services/GitService';
import { FileSystemService } from '../services/FileSystemService';
import { useEditor } from '../contexts/EditorContext';
import { Repository } from '../types';

interface GitHubReposScreenProps {
  navigation: any;
}

export const GitHubReposScreen: React.FC<GitHubReposScreenProps> = ({
  navigation,
}) => {
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cloning, setCloning] = useState<number | null>(null);
  const { setRootPath, setCurrentRepository } = useEditor();

  useEffect(() => {
    loadRepositories();
  }, []);

  const loadRepositories = async () => {
    try {
      setLoading(true);
      const repos = await GitHubAPIService.listUserRepositories('updated', 50);
      setRepositories(repos);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les repositories');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRepositories();
    setRefreshing(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadRepositories();
      return;
    }

    try {
      setLoading(true);
      const repos = await GitHubAPIService.searchRepositories(
        `${searchQuery} user:${repositories[0]?.owner.login || ''}`
      );
      setRepositories(repos);
    } catch (error) {
      Alert.alert('Erreur', 'Échec de la recherche');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloneRepository = async (repo: GitHubRepository) => {
    Alert.alert(
      'Cloner le repository',
      `Voulez-vous cloner "${repo.name}"?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Cloner',
          onPress: () => cloneRepository(repo),
        },
      ]
    );
  };

  const cloneRepository = async (repo: GitHubRepository) => {
    try {
      setCloning(repo.id);

      const baseDir = FileSystemService.getBaseDir();
      const projectPath = `${baseDir}${repo.name}`;

      // Check if project already exists
      const exists = await FileSystemService.exists(projectPath);
      if (exists) {
        Alert.alert(
          'Repository existe déjà',
          'Un projet avec ce nom existe déjà. Voulez-vous l\'ouvrir?',
          [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Ouvrir',
              onPress: () => openProject(repo.name, projectPath, repo.clone_url),
            },
          ]
        );
        return;
      }

      // Clone the repository
      await GitService.clone(repo.clone_url, projectPath, 1);

      Alert.alert(
        'Succès',
        'Repository cloné avec succès!',
        [
          {
            text: 'Ouvrir',
            onPress: () => openProject(repo.name, projectPath, repo.clone_url),
          },
          { text: 'OK', style: 'cancel' },
        ]
      );
    } catch (error) {
      console.error('Clone error:', error);
      Alert.alert('Erreur', 'Échec du clonage du repository');
    } finally {
      setCloning(null);
    }
  };

  const openProject = (name: string, path: string, url?: string) => {
    const repo: Repository = {
      name,
      path,
      url,
    };

    setRootPath(path);
    setCurrentRepository(repo);
    navigation.navigate('Editor');
  };

  const getLanguageColor = (language: string | null): string => {
    const colors: { [key: string]: string } = {
      JavaScript: '#F7DF1E',
      TypeScript: '#3178C6',
      Python: '#3776AB',
      Java: '#007396',
      'C++': '#00599C',
      C: '#A8B9CC',
      'C#': '#239120',
      Ruby: '#CC342D',
      Go: '#00ADD8',
      Rust: '#000000',
      Swift: '#FA7343',
      Kotlin: '#7F52FF',
      PHP: '#777BB4',
      HTML: '#E34F26',
      CSS: '#1572B6',
    };

    return colors[language || ''] || '#666';
  };

  const renderRepository = ({ item }: { item: GitHubRepository }) => {
    const isCloning = cloning === item.id;

    return (
      <TouchableOpacity
        style={styles.repoItem}
        onPress={() => handleCloneRepository(item)}
        disabled={isCloning}
      >
        <View style={styles.repoHeader}>
          <View style={styles.repoInfo}>
            <View style={styles.repoNameContainer}>
              <Ionicons
                name={item.private ? 'lock-closed' : 'book'}
                size={16}
                color={item.private ? '#E74C3C' : '#4A90E2'}
              />
              <Text style={styles.repoName}>{item.name}</Text>
            </View>
            {item.description && (
              <Text style={styles.repoDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <View style={styles.repoMetadata}>
              {item.language && (
                <View style={styles.languageContainer}>
                  <View
                    style={[
                      styles.languageDot,
                      { backgroundColor: getLanguageColor(item.language) },
                    ]}
                  />
                  <Text style={styles.languageText}>{item.language}</Text>
                </View>
              )}
              <View style={styles.statsContainer}>
                <Ionicons name="star" size={14} color="#666" />
                <Text style={styles.statText}>{item.stargazers_count}</Text>
                <Ionicons
                  name="git-branch"
                  size={14}
                  color="#666"
                  style={{ marginLeft: 10 }}
                />
                <Text style={styles.statText}>{item.forks_count}</Text>
              </View>
            </View>
          </View>
          {isCloning ? (
            <ActivityIndicator size="small" color="#4A90E2" />
          ) : (
            <Ionicons name="cloud-download-outline" size={24} color="#4A90E2" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Chargement des repositories...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un repository..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={repositories}
        renderItem={renderRepository}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#4A90E2"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="logo-github" size={64} color="#666" />
            <Text style={styles.emptyText}>Aucun repository trouvé</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
  },
  loadingText: {
    color: '#AAA',
    marginTop: 10,
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#2D2D2D',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    color: '#FFF',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#4A90E2',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    width: 45,
  },
  listContainer: {
    padding: 15,
  },
  repoItem: {
    backgroundColor: '#2D2D2D',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  repoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  repoInfo: {
    flex: 1,
    marginRight: 10,
  },
  repoNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    gap: 8,
  },
  repoName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  repoDescription: {
    color: '#AAA',
    fontSize: 14,
    marginBottom: 10,
  },
  repoMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  languageText: {
    color: '#AAA',
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: '#666',
    fontSize: 12,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: '#AAA',
    fontSize: 18,
    marginTop: 15,
  },
});
