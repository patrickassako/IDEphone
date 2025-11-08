# IDEphone - Mobile Code Editor

Un éditeur de code complet pour mobile avec intégration Git, gestion de fichiers et édition de code avec coloration syntaxique.

## Fonctionnalités

### 📁 Gestion de Fichiers
- Navigation dans les dossiers et fichiers
- Création de nouveaux fichiers et dossiers
- Suppression de fichiers/dossiers
- Renommage (à venir)
- Copie de fichiers (à venir)

### ✏️ Éditeur de Code
- Éditeur de texte avec numérotation des lignes
- Ajustement de la taille de police
- Indicateur de modifications non sauvegardées
- Sauvegarde de fichiers
- Support multi-langages (JavaScript, TypeScript, Python, Java, C++, etc.)
- Détection automatique du langage par extension de fichier

### 📑 Gestion des Onglets
- Plusieurs fichiers ouverts simultanément
- Navigation entre les onglets
- Fermeture d'onglets
- Indicateur de fichiers modifiés

### 🔧 Intégration Git
- Initialisation de dépôts Git
- Clonage de dépôts distants
- Affichage du statut Git (staged, unstaged, untracked)
- Stage de fichiers individuels ou tous les fichiers
- Commits avec messages
- Push vers dépôt distant
- Pull depuis dépôt distant
- Gestion des branches
- Checkout de branches
- Création de nouvelles branches

### 🎨 Interface Utilisateur
- Thème sombre (type VS Code)
- Interface intuitive pour mobile
- Sidebar pour navigation de fichiers
- Panel Git latéral
- Barre d'onglets pour fichiers ouverts

## Technologies Utilisées

- **React Native avec Expo** - Framework mobile multiplateforme
- **TypeScript** - Typage statique
- **React Navigation** - Navigation entre écrans
- **Expo File System** - Gestion du système de fichiers
- **isomorphic-git** - Opérations Git en JavaScript
- **@expo/vector-icons** - Icônes

## Installation

```bash
# Installer les dépendances
npm install

# Lancer l'application
npm start

# Lancer sur Android
npm run android

# Lancer sur iOS (nécessite macOS)
npm run ios

# Lancer sur web
npm run web
```

## Structure du Projet

```
IDEphone/
├── src/
│   ├── components/       # Composants réutilisables
│   │   ├── CodeEditor.tsx
│   │   ├── FileBrowser.tsx
│   │   ├── GitPanel.tsx
│   │   └── TabBar.tsx
│   ├── contexts/         # Contextes React
│   │   └── EditorContext.tsx
│   ├── screens/          # Écrans de l'application
│   │   ├── HomeScreen.tsx
│   │   └── EditorScreen.tsx
│   ├── services/         # Services
│   │   ├── FileSystemService.ts
│   │   └── GitService.ts
│   ├── types/            # Types TypeScript
│   │   └── index.ts
│   └── utils/            # Utilitaires
├── App.tsx               # Point d'entrée
└── package.json
```

## Utilisation

### Créer un Nouveau Projet
1. Lancez l'application
2. Appuyez sur "New Project"
3. Entrez le nom du projet
4. Un dépôt Git sera automatiquement initialisé

### Cloner un Dépôt
1. Appuyez sur "Clone Repository"
2. Entrez l'URL du dépôt
3. Le dépôt sera cloné et prêt à être utilisé

### Éditer des Fichiers
1. Ouvrez un projet
2. Naviguez dans le File Browser
3. Appuyez sur un fichier pour l'ouvrir
4. Éditez le contenu
5. Appuyez sur l'icône de sauvegarde

### Opérations Git
1. Ouvrez le panel Git (à implémenter dans la navigation)
2. Visualisez les fichiers modifiés
3. Stage les fichiers souhaités
4. Créez un commit avec un message
5. Push vers le dépôt distant

## Fonctionnalités à Venir

- [ ] Coloration syntaxique avancée
- [ ] Auto-complétion
- [ ] Recherche et remplacement
- [ ] Terminal intégré
- [ ] Support des thèmes personnalisables
- [ ] Raccourcis clavier Bluetooth
- [ ] Synchronisation cloud
- [ ] Mode collaboratif
- [ ] Débogueur intégré

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou un pull request.

## Licence

MIT

## Auteur

Créé avec ❤️ pour les développeurs mobiles
