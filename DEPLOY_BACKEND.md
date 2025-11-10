# 🚀 Backend Deployment Guide

Ce guide explique comment déployer le backend proxy pour CodeSandbox.

## Pourquoi un Backend ?

**Problème** : CodeSandbox nécessite des requêtes POST, mais React Native mobile ne peut faire que des GET avec `Linking.openURL()`.

**Solution** : Un backend proxy qui :
1. Reçoit les fichiers de votre app mobile (POST)
2. Forward le POST à CodeSandbox
3. Retourne l'URL du sandbox créé
4. L'app ouvre cette URL

## 📋 Prérequis

- Compte Vercel gratuit : https://vercel.com/signup
- Vercel CLI installé : `npm install -g vercel`

## 🔧 Déploiement sur Vercel (Gratuit)

### Étape 1 : Login Vercel

```bash
vercel login
```

### Étape 2 : Déployer

```bash
cd /home/user/IDEphone
vercel deploy --prod
```

### Étape 3 : Copier l'URL

Après déploiement, Vercel vous donne une URL comme :
```
https://idephone-abc123.vercel.app
```

### Étape 4 : Configurer dans l'App

Créez un fichier `.env` à la racine du projet :

```bash
cp .env.example .env
```

Éditez `.env` et remplacez l'URL :

```env
EXPO_PUBLIC_CODESANDBOX_PROXY_URL=https://idephone-abc123.vercel.app/api/codesandbox-proxy
```

### Étape 5 : Redémarrer l'App

```bash
# Arrêtez le serveur Expo (Ctrl+C)
npm start
# Rechargez l'app sur votre téléphone
```

## ✅ Test

1. Ouvrez un projet dans IDEphone
2. Cliquez "Test Live"
3. Choisissez "CodeSandbox"
4. Ça devrait ouvrir CodeSandbox avec votre code ! 🎉

## 🔍 Debugging

### Vérifier que le backend fonctionne

```bash
curl -X POST https://votre-url.vercel.app/api/codesandbox-proxy \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "test",
    "files": [
      {
        "path": "index.js",
        "content": "console.log(\"Hello\")"
      }
    ]
  }'
```

Vous devriez recevoir :
```json
{
  "success": true,
  "sandboxId": "abc123",
  "sandboxUrl": "https://codesandbox.io/s/abc123"
}
```

### Logs

Voir les logs Vercel :
```bash
vercel logs
```

## 💡 Alternative : Développement Local

Si vous voulez tester en local avec ngrok :

```bash
# Terminal 1 : Lancer le backend local
node api/codesandbox-proxy.js

# Terminal 2 : Exposer avec ngrok
ngrok http 3000

# Copier l'URL ngrok dans .env
EXPO_PUBLIC_CODESANDBOX_PROXY_URL=https://abc123.ngrok.io/api/codesandbox-proxy
```

## 📊 Limites Vercel Gratuit

- ✅ **100 GB bandwidth/mois** → Largement suffisant
- ✅ **Unlimited requests** → Pas de limite
- ✅ **Serverless functions** → Parfait pour ce cas

## 🎯 Prochaine Étape

Après déploiement, le flow sera :

```
Mobile App → Vercel Proxy → CodeSandbox → ✅ Fonctionne !
```

Plus de problèmes de POST depuis mobile !
