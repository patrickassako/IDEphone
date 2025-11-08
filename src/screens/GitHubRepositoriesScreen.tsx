import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GitHubAuthService, GitHubRepository } from '../services/GitHubAuthService';
import { GitService } from '../services/GitService';
import { FileSystemService } from '../services/FileSystemService';
import { Repository } from '../types';
import { useEditor } from '../contexts/EditorContext';

interface GitHubRepositoriesScreenProps {
  navigation: any;
}

export const GitHubRepositoriesScreen: React.FC<GitHubRepositoriesScreenProps> = ({
  navigation,
}) => {
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<GitHubRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cloningRepo, setCloningRepo] = useState<number | null>(null);
  const { setRootPath, setCurrentRepository } = useEditor();

  useEffect(() => {
    loadRepositories();
  }, []);

  useEffect(() => {
    filterRepositories();
  }, [searchQuery, repositories]);

  const loadRepositories = async () => {
    try {
      setLoading(true);
      const repos = await GitHubAuthService.fetchRepositories();
      setRepositories(repos);
      setFilteredRepos(repos);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les repositories');
      console.error('Error loading repositories:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRepositories();
    setRefreshing(false);
  };

  const filterRepositories = () => {
    if (!searchQuery.trim()) {
      setFilteredRepos(repositories);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = repositories.filter(
      (repo) =>
        repo.name.toLowerCase().includes(query) ||
        repo.description?.toLowerCase().includes(query) ||
        repo.language?.toLowerCase().includes(query)
    );
    setFilteredRepos(filtered);
  };

  const handleCloneRepository = async (repo: GitHubRepository) => {
    Alert.alert(
      'Cloner le repository',
      `Voulez-vous cloner ${repo.full_name}?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Cloner',
          onPress: async () => {
            try {
              setCloningRepo(repo.id);
              await FileSystemService.initialize();
              const baseDir = FileSystemService.getBaseDir();
              const projectPath = baseDir + repo.name;

              // Clone the repository
              await GitService.clone(repo.clone_url, projectPath);

              const newRepo: Repository = {
                name: repo.name,
                path: projectPath,
                url: repo.clone_url,
              };

              setCloningRepo(null);
              Alert.alert(
                'Succès',
                'Repository cloné avec succès!',
                [
                  {
                    text: 'Ouvrir',
                    onPress: () => {
                      setRootPath(newRepo.path);
                      setCurrentRepository(newRepo);
                      navigation.navigate('Home');
                      setTimeout(() => {
                        navigation.navigate('Editor');
                      }, 100);
                    },
                  },
                  { text: 'OK' },
                ]
              );
            } catch (error) {
              setCloningRepo(null);
              Alert.alert('Erreur', 'Impossible de cloner le repository');
              console.error('Error cloning repository:', error);
            }
          },
        },
      ]
    );
  };

  const renderRepository = ({ item }: { item: GitHubRepository }) => {
    const isCloning = cloningRepo === item.id;

    return (
      <TouchableOpacity
        style={styles.repoItem}
        onPress={() => handleCloneRepository(item)}
        disabled={isCloning}
      >
        <View style={styles.repoHeader}>
          <View style={styles.repoIcon}>
            <Ionicons
              name={item.private ? 'lock-closed' : 'logo-github'}
              size={24}
              color={item.private ? '#E74C3C' : '#4A90E2'}
            />
          </View>
          <View style={styles.repoInfo}>
            <Text style={styles.repoName}>{item.name}</Text>
            {item.description && (
              <Text style={styles.repoDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <View style={styles.repoMeta}>
              {item.language && (
                <View style={styles.metaItem}>
                  <View style={[styles.languageDot, { backgroundColor: getLanguageColor(item.language) }]} />
                  <Text style={styles.metaText}>{item.language}</Text>
                </View>
              )}
              <View style={styles.metaItem}>
                <Ionicons name="star" size={12} color="#AAA" />
                <Text style={styles.metaText}>{item.stargazers_count}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="git-branch" size={12} color="#AAA" />
                <Text style={styles.metaText}>{item.forks_count}</Text>
              </View>
            </View>
          </View>
          {isCloning ? (
            <ActivityIndicator size="small" color="#4A90E2" />
          ) : (
            <Ionicons name="cloud-download" size={24} color="#4A90E2" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="albums-outline" size={64} color="#666" />
      <Text style={styles.emptyText}>
        {searchQuery ? 'Aucun repository trouvé' : 'Aucun repository'}
      </Text>
      <Text style={styles.emptySubtext}>
        {searchQuery
          ? 'Essayez une autre recherche'
          : 'Créez des repositories sur GitHub pour les voir ici'}
      </Text>
    </View>
  );

  if (loading) {
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
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un repository..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.header}>
        <Text style={styles.count}>
          {filteredRepos.length} repository{filteredRepos.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={filteredRepos}
        renderItem={renderRepository}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4A90E2"
          />
        }
        style={styles.list}
      />
    </View>
  );
};

const getLanguageColor = (language: string): string => {
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
    Shell: '#89E051',
  };
  return colors[language] || '#AAA';
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
    fontSize: 16,
    marginTop: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D2D2D',
    margin: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  count: {
    color: '#AAA',
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  repoItem: {
    backgroundColor: '#2D2D2D',
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 8,
    padding: 15,
  },
  repoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  repoIcon: {
    marginRight: 12,
  },
  repoInfo: {
    flex: 1,
  },
  repoName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  repoDescription: {
    color: '#AAA',
    fontSize: 14,
    marginBottom: 8,
  },
  repoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#AAA',
    fontSize: 12,
  },
  languageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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
  },
});
