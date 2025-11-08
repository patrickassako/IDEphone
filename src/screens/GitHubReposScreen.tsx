import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Octokit } from '@octokit/rest';
import { GitService } from '../services/GitService';
import { FileSystemService } from '../services/FileSystemService';
import { useNavigation } from '@react-navigation/native';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  clone_url: string;
  private: boolean;
  updated_at: string;
  language: string | null;
}

export const GitHubReposScreen: React.FC = () => {
  const navigation = useNavigation();
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState<number | null>(null);

  useEffect(() => {
    loadRepos();
  }, []);

  const loadRepos = async () => {
    try {
      const token = GitService.getGitHubToken();

      if (!token) {
        Alert.alert(
          'No Token',
          'Please set your GitHub token in Settings first.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Go to Settings', onPress: () => navigation.goBack() },
          ]
        );
        setLoading(false);
        return;
      }

      const octokit = new Octokit({ auth: token });

      // Fetch user's repositories (including private ones)
      const response = await octokit.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100,
      });

      setRepos(response.data as GitHubRepo[]);
    } catch (error: any) {
      console.error('Error loading repos:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to load repositories. Check your token.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCloneRepo = async (repo: GitHubRepo) => {
    try {
      setCloning(repo.id);

      const projectName = repo.name;
      const baseDir = FileSystemService.getBaseDir();
      const projectPath = baseDir + projectName;

      console.log('Starting clone process...');
      console.log('Repository:', repo.full_name);
      console.log('Clone URL:', repo.clone_url);
      console.log('Destination:', projectPath);
      console.log('Is private:', repo.private);
      console.log('Has token:', !!GitService.getGitHubToken());

      // Check if project already exists
      const exists = await FileSystemService.exists(projectPath);
      if (exists) {
        Alert.alert(
          'Error',
          `Project "${projectName}" already exists. Please delete it first.`
        );
        setCloning(null);
        return;
      }

      // Ensure token is set before cloning
      const token = GitService.getGitHubToken();
      if (!token && repo.private) {
        Alert.alert(
          'Error',
          'This is a private repository but no GitHub token is configured. Please set your token in Settings.'
        );
        setCloning(null);
        return;
      }

      console.log('Cloning repository...');

      // Extract owner and repo name from full_name (e.g., "owner/repo")
      const [owner, repoName] = repo.full_name.split('/');

      // Try to clone using the ZIP method (more reliable on mobile)
      // We'll try main first, then master if it fails
      try {
        await GitService.cloneFromZip(owner, repoName, projectPath, 'main');
      } catch (error: any) {
        if (error.message?.includes('not found')) {
          console.log('main branch not found, trying master...');
          await GitService.cloneFromZip(owner, repoName, projectPath, 'master');
        } else {
          throw error;
        }
      }

      console.log('Clone successful!');
      Alert.alert(
        'Success',
        `Repository "${projectName}" cloned successfully!`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to home
              navigation.navigate('Home' as never);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error cloning repo:', error);
      Alert.alert('Clone Failed', error.message || 'Failed to clone repository');
    } finally {
      setCloning(null);
    }
  };

  const renderRepoItem = ({ item }: { item: GitHubRepo }) => (
    <View style={styles.repoCard}>
      <View style={styles.repoHeader}>
        <View style={styles.repoTitleContainer}>
          <Ionicons
            name={item.private ? 'lock-closed' : 'logo-github'}
            size={20}
            color={item.private ? '#FFD700' : '#4A90E2'}
          />
          <Text style={styles.repoName} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.cloneButton,
            cloning === item.id && styles.cloningButton,
          ]}
          onPress={() => handleCloneRepo(item)}
          disabled={cloning !== null}
        >
          {cloning === item.id ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="cloud-download" size={18} color="#FFF" />
              <Text style={styles.cloneButtonText}>Clone</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {item.description && (
        <Text style={styles.repoDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.repoFooter}>
        {item.language && (
          <View style={styles.languageBadge}>
            <Text style={styles.languageText}>{item.language}</Text>
          </View>
        )}
        <Text style={styles.updatedText}>
          Updated {new Date(item.updated_at).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading repositories...</Text>
      </View>
    );
  }

  if (repos.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="logo-github" size={64} color="#666" />
        <Text style={styles.emptyText}>No repositories found</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadRepos}>
          <Ionicons name="refresh" size={20} color="#FFF" />
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={repos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderRepoItem}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={loadRepos}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContainer: {
    padding: 15,
  },
  loadingText: {
    color: '#AAA',
    marginTop: 10,
    fontSize: 14,
  },
  emptyText: {
    color: '#AAA',
    fontSize: 16,
    marginTop: 15,
    marginBottom: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  refreshButtonText: {
    color: '#FFF',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  repoCard: {
    backgroundColor: '#2D2D2D',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  repoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  repoTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  repoName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  cloneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    minWidth: 80,
    justifyContent: 'center',
  },
  cloningButton: {
    backgroundColor: '#666',
  },
  cloneButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  repoDescription: {
    color: '#AAA',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  repoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageBadge: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
  },
  languageText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  updatedText: {
    color: '#666',
    fontSize: 11,
  },
});
