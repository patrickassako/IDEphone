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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GitHubAuthService, GitHubUser } from '../services/GitHubAuthService';
import { GitService } from '../services/GitService';

interface SettingsScreenProps {
  navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [token, setToken] = useState('');
  const [gitName, setGitName] = useState('IDEphone User');
  const [gitEmail, setGitEmail] = useState('user@idephone.app');
  const [showGitConfigModal, setShowGitConfigModal] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    await GitHubAuthService.initialize();
    setIsAuthenticated(GitHubAuthService.isAuthenticated());
    setUser(GitHubAuthService.getUser());
  };

  const handleLogin = async () => {
    setShowTokenModal(true);
  };

  const handleTokenLogin = async () => {
    if (!token.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un token GitHub valide');
      return;
    }

    try {
      const success = await GitHubAuthService.loginWithToken(token);
      if (success) {
        setIsAuthenticated(true);
        setUser(GitHubAuthService.getUser());
        setShowTokenModal(false);
        setToken('');
        Alert.alert('Succès', 'Connexion à GitHub réussie!');
      } else {
        Alert.alert('Erreur', 'Token invalide ou expiré');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de se connecter à GitHub');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter de GitHub?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await GitHubAuthService.logout();
            setIsAuthenticated(false);
            setUser(null);
            Alert.alert('Succès', 'Déconnecté de GitHub');
          },
        },
      ]
    );
  };

  const handleBrowseRepos = () => {
    navigation.navigate('GitHubRepositories');
  };

  const handleUpdateGitConfig = () => {
    if (!gitName.trim() || !gitEmail.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    GitService.setConfig({
      name: gitName,
      email: gitEmail,
    });

    setShowGitConfigModal(false);
    Alert.alert('Succès', 'Configuration Git mise à jour');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connexion GitHub</Text>

        {isAuthenticated && user ? (
          <View style={styles.userCard}>
            <Image
              source={{ uri: user.avatar_url }}
              style={styles.avatar}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name || user.login}</Text>
              <Text style={styles.userEmail}>{user.email || user.login}</Text>
              <Text style={styles.userStats}>
                {user.public_repos} repositories publics
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.notConnected}>
            <Ionicons name="logo-github" size={64} color="#666" />
            <Text style={styles.notConnectedText}>
              Non connecté à GitHub
            </Text>
            <Text style={styles.notConnectedSubtext}>
              Connectez votre compte pour cloner et gérer vos repositories
            </Text>
          </View>
        )}

        <View style={styles.buttons}>
          {isAuthenticated ? (
            <>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleBrowseRepos}
              >
                <Ionicons name="albums" size={20} color="#FFF" />
                <Text style={styles.buttonText}>Mes Repositories</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.dangerButton]}
                onPress={handleLogout}
              >
                <Ionicons name="log-out" size={20} color="#FFF" />
                <Text style={styles.buttonText}>Déconnexion</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleLogin}
            >
              <Ionicons name="logo-github" size={20} color="#FFF" />
              <Text style={styles.buttonText}>Se connecter à GitHub</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuration Git</Text>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => setShowGitConfigModal(true)}
        >
          <Ionicons name="git-branch" size={24} color="#4A90E2" />
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Nom et Email Git</Text>
            <Text style={styles.settingValue}>Configurer votre identité Git</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>À propos</Text>
        <View style={styles.settingItem}>
          <Ionicons name="information-circle" size={24} color="#4A90E2" />
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Version</Text>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>
        </View>
      </View>

      {/* Token Input Modal */}
      <Modal visible={showTokenModal} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Token d'accès GitHub</Text>
            <Text style={styles.modalDescription}>
              Créez un Personal Access Token sur GitHub avec les permissions 'repo' et 'user'
            </Text>
            <TextInput
              style={styles.input}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              placeholderTextColor="#666"
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              autoFocus
            />
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => {
                // Open GitHub token creation page
                Alert.alert(
                  'Créer un token',
                  'Allez sur github.com/settings/tokens/new pour créer un token avec les permissions repo et user'
                );
              }}
            >
              <Text style={styles.linkText}>Comment créer un token?</Text>
            </TouchableOpacity>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowTokenModal(false);
                  setToken('');
                }}
              >
                <Text style={styles.buttonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleTokenLogin}
              >
                <Text style={styles.buttonText}>Se connecter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Git Config Modal */}
      <Modal visible={showGitConfigModal} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Configuration Git</Text>
            <TextInput
              style={styles.input}
              placeholder="Nom"
              placeholderTextColor="#666"
              value={gitName}
              onChangeText={setGitName}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#666"
              value={gitEmail}
              onChangeText={setGitEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowGitConfigModal(false)}
              >
                <Text style={styles.buttonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleUpdateGitConfig}
              >
                <Text style={styles.buttonText}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 15,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D2D2D',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userEmail: {
    color: '#AAA',
    fontSize: 14,
    marginTop: 4,
  },
  userStats: {
    color: '#4A90E2',
    fontSize: 12,
    marginTop: 4,
  },
  notConnected: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#2D2D2D',
    borderRadius: 10,
    marginBottom: 15,
  },
  notConnectedText: {
    color: '#AAA',
    fontSize: 16,
    marginTop: 10,
  },
  notConnectedSubtext: {
    color: '#666',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  buttons: {
    gap: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#4A90E2',
  },
  dangerButton: {
    backgroundColor: '#E74C3C',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#2D2D2D',
    borderRadius: 8,
    marginBottom: 10,
  },
  settingInfo: {
    flex: 1,
    marginLeft: 15,
  },
  settingLabel: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingValue: {
    color: '#AAA',
    fontSize: 14,
    marginTop: 4,
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
    width: '90%',
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalDescription: {
    color: '#AAA',
    fontSize: 14,
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#1E1E1E',
    color: '#FFF',
    padding: 12,
    borderRadius: 5,
    marginBottom: 10,
  },
  linkButton: {
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  linkText: {
    color: '#4A90E2',
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalButton: {
    padding: 12,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#555',
  },
  createButton: {
    backgroundColor: '#4A90E2',
  },
});
