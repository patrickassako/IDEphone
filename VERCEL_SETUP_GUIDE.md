# 🚀 Guide de Configuration Vercel pour IDEphone

Ce guide vous aide à déployer le backend Vercel qui permet les fonctionnalités "Test Live" et "Deploy & Test".

## 📋 Prérequis

1. Un compte Vercel (gratuit) : https://vercel.com
2. Vercel CLI installé : `npm install -g vercel`

## 🔑 Étape 1 : Créer un Token Vercel

1. Allez sur https://vercel.com/account/tokens
2. Cliquez sur **"Create Token"**
3. Donnez un nom au token : `IDEphone Backend`
4. **Copiez le token** (vous ne pourrez plus le voir après)

## 📦 Étape 2 : Déployer le Backend

Depuis le dossier racine du projet IDEphone :

```bash
# Se connecter à Vercel (si première fois)
vercel login

# Déployer en production
vercel deploy --prod
```

**Important** : Lors du déploiement, Vercel vous demandera :
- Project name : `idephone` (ou le nom que vous voulez)
- Link to existing project : `No` (si première fois)
- Directory to deploy : `.` (dossier actuel)

**Notez l'URL de déploiement** qui s'affiche à la fin, par exemple :
```
✅ Production: https://idephone-abc123.vercel.app
```

## ⚙️ Étape 3 : Ajouter le Token comme Variable d'Environnement

1. Allez sur votre dashboard Vercel : https://vercel.com/dashboard
2. Sélectionnez votre projet `idephone`
3. Allez dans **Settings** → **Environment Variables**
4. Cliquez sur **Add**
5. Ajoutez :
   - **Name** : `VERCEL_TOKEN`
   - **Value** : [collez le token de l'Étape 1]
   - **Environment** : Sélectionnez **Production**, **Preview**, et **Development**
6. Cliquez sur **Save**

## 🔄 Étape 4 : Redéployer avec le Token

Redéployez pour que le token soit pris en compte :

```bash
vercel deploy --prod
```

## 📱 Étape 5 : Mettre à Jour l'App Mobile

Le fichier `.env` a déjà été créé avec votre URL. Vérifiez qu'il contient :

```env
EXPO_PUBLIC_CODESANDBOX_PROXY_URL=https://VOTRE-URL.vercel.app/api/codesandbox-proxy
EXPO_PUBLIC_VERCEL_DEPLOYMENT_URL=https://VOTRE-URL.vercel.app/api/deploy-to-vercel
```

Remplacez `VOTRE-URL.vercel.app` par l'URL que vous avez notée à l'Étape 2.

**Redémarrez l'app mobile** pour que les variables d'environnement soient chargées :

```bash
# Arrêtez l'app (Ctrl+C)
# Puis relancez
npm start
```

## ✅ Étape 6 : Tester

1. Ouvrez l'app sur votre téléphone
2. Générez ou ouvrez un projet
3. Essayez les boutons :
   - **Preview** : Affiche l'aperçu HTML local
   - **Test Live** : Crée un sandbox CodeSandbox temporaire
   - **Deploy & Test** : Déploie sur Vercel avec URL permanente

## 🔍 Vérifier que le Backend Fonctionne

Testez les endpoints dans votre navigateur :

```
https://VOTRE-URL.vercel.app/api/codesandbox-proxy
```

Vous devriez voir : `{"error":"Method not allowed"}` (c'est normal, car il faut un POST)

Si vous voyez "404 Not Found", le backend n'a pas été déployé correctement.

## 🐛 Dépannage

### Erreur "Network request failed"
- ✅ Vérifiez que l'URL dans `.env` commence par `https://`
- ✅ Vérifiez que l'URL est correcte (copiez depuis Vercel dashboard)
- ✅ Redémarrez l'app mobile après avoir modifié `.env`

### Erreur "Backend endpoint not found" (404)
- ✅ Redéployez le backend : `vercel deploy --prod`
- ✅ Vérifiez que les fichiers `api/codesandbox-proxy.js` et `api/deploy-to-vercel.js` existent
- ✅ Vérifiez que `vercel.json` existe à la racine du projet

### Erreur "VERCEL_TOKEN not set"
- ✅ Ajoutez le token dans Vercel Dashboard → Settings → Environment Variables
- ✅ Redéployez après avoir ajouté le token

### Erreur "Deployment failed: Invalid token"
- ✅ Créez un nouveau token sur https://vercel.com/account/tokens
- ✅ Mettez à jour la variable d'environnement dans Vercel Dashboard

## 📚 Plus d'Informations

- Documentation Vercel : https://vercel.com/docs
- Documentation CodeSandbox API : https://codesandbox.io/docs/api
- Fichier détaillé : `DEPLOY_BACKEND.md`

## 🎉 C'est tout !

Une fois configuré, vous pourrez :
- Tester vos projets dans CodeSandbox directement depuis l'app
- Déployer vos projets sur Vercel avec des URLs permanentes
- Partager vos créations avec n'importe qui via une simple URL
