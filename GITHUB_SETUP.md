# Configuration GitHub pour IDEphone

IDEphone intègre maintenant la gestion complète de vos repositories GitHub directement depuis votre téléphone mobile.

## Fonctionnalités

- **Connexion GitHub** : Connectez-vous à votre compte GitHub pour accéder à tous vos repositories
- **Liste des Repositories** : Parcourez tous vos repositories GitHub
- **Clonage Rapide** : Clonez n'importe quel repository directement sur votre téléphone
- **Gestion Locale** : Gérez vos projets clonés comme des projets locaux
- **Recherche** : Recherchez parmi vos repositories

## Configuration

### 1. Obtenir un Personal Access Token GitHub

Pour utiliser les fonctionnalités GitHub dans IDEphone, vous devez créer un Personal Access Token :

1. Connectez-vous sur [github.com](https://github.com)
2. Allez dans **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
3. Cliquez sur **Generate new token (classic)**
4. Donnez un nom descriptif à votre token (ex: "IDEphone Mobile")
5. Sélectionnez les permissions suivantes :
   - ✅ **repo** (Full control of private repositories)
   - ✅ **user** (Read user profile data)
6. Cliquez sur **Generate token**
7. **Important** : Copiez immédiatement le token généré (vous ne pourrez plus le voir après)

### 2. Connexion dans IDEphone

1. Ouvrez IDEphone sur votre téléphone
2. Appuyez sur l'icône **⚙️ Paramètres** (en haut à droite de l'écran d'accueil)
3. Dans la section **Connexion GitHub**, appuyez sur **Se connecter avec un Token**
4. Collez votre Personal Access Token
5. Appuyez sur **Connexion**

Une fois connecté, vous verrez votre profil GitHub avec :
- Votre avatar
- Votre nom d'utilisateur
- Votre bio
- Le nombre de repositories publics

## Utilisation

### Accéder à vos Repositories GitHub

1. Allez dans **Paramètres** (icône ⚙️)
2. Appuyez sur **Mes Repositories GitHub**
3. Vous verrez la liste de tous vos repositories

### Cloner un Repository

1. Dans la liste des repositories GitHub, appuyez sur un repository
2. Confirmez le clonage
3. Une fois cloné, vous pouvez l'ouvrir directement ou revenir à l'accueil

Le repository cloné sera disponible dans la liste "Projets Récents" sur l'écran d'accueil.

### Rechercher un Repository

1. Dans l'écran **Mes Repositories GitHub**, utilisez la barre de recherche en haut
2. Tapez le nom du repository que vous cherchez
3. Appuyez sur l'icône 🔍

### Déconnexion

1. Allez dans **Paramètres**
2. Appuyez sur **Déconnexion** (bouton rouge)
3. Confirmez la déconnexion

## Informations Importantes

### Sécurité

- Votre Personal Access Token est stocké de manière sécurisée dans le trousseau de votre appareil (SecureStore)
- Ne partagez jamais votre token avec personne
- Vous pouvez révoquer votre token à tout moment depuis GitHub

### Limitations

- Les repositories privés nécessitent les permissions "repo" dans votre token
- Le clonage initial peut prendre du temps selon la taille du repository
- Assurez-vous d'avoir une connexion internet stable pour le clonage

### Gestion des Repositories Clonés

Une fois qu'un repository est cloné :
- Il est stocké localement sur votre téléphone
- Vous pouvez le modifier avec l'éditeur IDEphone
- Utilisez le panneau Git pour gérer vos commits
- Vous pouvez pousser vos modifications vers GitHub (avec les bonnes permissions)

## Fonctionnalités à Venir

- [ ] Authentification OAuth native (sans token manuel)
- [ ] Gestion des Pull Requests
- [ ] Gestion des Issues
- [ ] Synchronisation automatique
- [ ] Support des webhooks
- [ ] Notifications GitHub

## Support

Pour toute question ou problème :
- Vérifiez que votre token a les bonnes permissions
- Assurez-vous d'avoir une connexion internet active
- Consultez les logs de l'application en cas d'erreur

---

**IDEphone** - Votre IDE mobile complet avec intégration GitHub
