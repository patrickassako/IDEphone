import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GitHubAuthService, GitHubUser } from '../services/GitHubAuthService';
import { GitHubAPIService } from '../services/GitHubAPIService';

interface SettingsScreenProps {
  navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    await GitHubAuthService.initialize();
    setIsAuthenticated(GitHubAuthService.isAuthenticated());
    setUser(GitHubAuthService.getUser());
  };

  const handleTokenAuth = async () => {
    if (!token.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un token d\'accès GitHub');
      return;
    }

    setLoading(true);
    try {
      const success = await GitHubAuthService.authenticateWithToken(token);

      if (success) {
        setIsAuthenticated(true);
        setUser(GitHubAuthService.getUser());
        setShowTokenModal(false);
        setToken('');
        Alert.alert('Succès', 'Connexion à GitHub réussie!');
      } else {
        Alert.alert('Erreur', 'Token invalide. Veuillez vérifier et réessayer.');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Échec de la connexion à GitHub');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter de GitHub?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await GitHubAuthService.signOut();
            GitHubAPIService.resetClient();
            setIsAuthenticated(false);
            setUser(null);
            Alert.alert('Succès', 'Déconnexion réussie');
          },
        },
      ]
    );
  };

  const navigateToGitHubRepos = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Non connecté',
        'Veuillez vous connecter à GitHub pour accéder à vos repositories'
      );
      return;
    }
    navigation.navigate('GitHubRepos');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connexion GitHub</Text>

        {isAuthenticated && user ? (
          <View style={styles.userContainer}>
            <View style={styles.userHeader}>
              <Image
                source={{ uri: user.avatar_url }}
                style={styles.avatar}
              />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userLogin}>@{user.login}</Text>
                {user.bio && <Text style={styles.userBio}>{user.bio}</Text>}
                <Text style={styles.userStats}>
                  {user.public_repos} repositories publics
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={navigateToGitHubRepos}
            >
              <Ionicons name="logo-github" size={20} color="#FFF" />
              <Text style={styles.buttonText}>Mes Repositories GitHub</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.signOutButton]}
              onPress={handleSignOut}
            >
              <Ionicons name="log-out-outline" size={20} color="#FFF" />
              <Text style={styles.buttonText}>Déconnexion</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.notConnected}>
            <Ionicons name="logo-github" size={64} color="#666" />
            <Text style={styles.notConnectedText}>
              Non connecté à GitHub
            </Text>
            <Text style={styles.notConnectedSubtext}>
              Connectez-vous pour accéder à vos repositories et les gérer facilement
            </Text>

            <TouchableOpacity
              style={styles.connectButton}
              onPress={() => setShowTokenModal(true)}
            >
              <Ionicons name="log-in-outline" size={20} color="#FFF" />
              <Text style={styles.buttonText}>Se connecter avec un Token</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.helpButton}
              onPress={() => {
                Alert.alert(
                  'Comment obtenir un token?',
                  '1. Allez sur github.com/settings/tokens\n' +
                  '2. Cliquez sur "Generate new token (classic)"\n' +
                  '3. Donnez un nom au token\n' +
                  '4. Sélectionnez les permissions "repo" et "user"\n' +
                  '5. Cliquez sur "Generate token"\n' +
                  '6. Copiez le token et collez-le ici'
                );
              }}
            >
              <Text style={styles.helpButtonText}>
                Comment obtenir un token?
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>À propos</Text>
        <View style={styles.aboutContainer}>
          <Text style={styles.appName}>IDEphone</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.description}>
            Éditeur de code mobile pour développeurs
          </Text>
        </View>
      </View>

      {/* Token Input Modal */}
      <Modal visible={showTokenModal} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Token d'accès GitHub</Text>
            <Text style={styles.modalSubtitle}>
              Entrez votre Personal Access Token GitHub
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
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowTokenModal(false);
                  setToken('');
                }}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleTokenAuth}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Connexion...' : 'Connexion'}
                </Text>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 15,
  },
  userContainer: {
    gap: 15,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D2D2D',
    padding: 15,
    borderRadius: 8,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
  userLogin: {
    color: '#AAA',
    fontSize: 14,
    marginTop: 2,
  },
  userBio: {
    color: '#CCC',
    fontSize: 12,
    marginTop: 5,
  },
  userStats: {
    color: '#4A90E2',
    fontSize: 12,
    marginTop: 5,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 8,
    gap: 10,
  },
  signOutButton: {
    backgroundColor: '#E74C3C',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notConnected: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  notConnectedText: {
    color: '#AAA',
    fontSize: 18,
    marginTop: 15,
  },
  notConnectedSubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    gap: 10,
    width: '100%',
  },
  helpButton: {
    marginTop: 15,
  },
  helpButtonText: {
    color: '#4A90E2',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  aboutContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appName: {
    color: '#4A90E2',
    fontSize: 28,
    fontWeight: 'bold',
  },
  version: {
    color: '#AAA',
    fontSize: 14,
    marginTop: 5,
  },
  description: {
    color: '#CCC',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
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
    marginBottom: 5,
  },
  modalSubtitle: {
    color: '#AAA',
    fontSize: 14,
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
});
