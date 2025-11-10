# 🚀 Backend Deployment Guide

Ce guide explique comment déployer le backend pour IDEphone.

## Pourquoi un Backend ?

**Deux fonctionnalités** :

1. **CodeSandbox Proxy** (Quick Preview)
   - Crée des CodeSandbox temporaires
   - Preview instantanée dans WebView
   - URLs temporaires qui changent

2. **Vercel Deployment API** (Like Lovable.dev) ⭐
   - Déploie chaque projet sur Vercel
   - URLs permanentes (ex: my-todo-app-xyz.vercel.app)
   - Auto-redéploiement sur modifications
   - Comme Lovable.dev !

## 📋 Prérequis

- Compte Vercel gratuit : https://vercel.com/signup
- Vercel CLI installé : `npm install -g vercel`
- **Vercel Access Token** (pour l'API de déploiement)

## 🔧 Déploiement sur Vercel (Gratuit)

### Étape 1 : Créer un Vercel Access Token

1. Allez sur https://vercel.com/account/tokens
2. Cliquez "Create Token"
3. Nom : "IDEphone Backend"
4. Scope : "Full Account"
5. Expiration : "No Expiration" ou 1 an
6. Cliquez "Create" et **COPIEZ LE TOKEN** (vous ne le verrez qu'une fois !)

### Étape 2 : Login Vercel CLI

```bash
vercel login
```

### Étape 3 : Déployer le Backend

```bash
cd /home/user/IDEphone
vercel deploy --prod
```

Après déploiement, Vercel vous donne une URL comme :
```
https://idephone-abc123.vercel.app
```

### Étape 4 : Ajouter le Token comme Variable d'Environnement

**IMPORTANT** : Le backend a besoin de votre token Vercel pour déployer les projets !

**Option A : Via l'interface Vercel** (Recommandé)
1. Allez sur https://vercel.com
2. Cliquez sur votre projet "idephone"
3. Settings → Environment Variables
4. Ajoutez :
   - Name: `VERCEL_TOKEN`
   - Value: [Collez votre token]
   - Environment: Production, Preview, Development
5. Cliquez "Save"

**Option B : Via CLI**
```bash
vercel env add VERCEL_TOKEN production
# Collez votre token quand demandé
```

### Étape 5 : Redéployer (pour appliquer le token)

```bash
vercel deploy --prod
```

### Étape 6 : Configurer dans l'App Mobile

Créez un fichier `.env` à la racine du projet :

```bash
cp .env.example .env
```

Éditez `.env` et remplacez les URLs :

```env
# CodeSandbox Proxy (quick preview)
EXPO_PUBLIC_CODESANDBOX_PROXY_URL=https://idephone-abc123.vercel.app/api/codesandbox-proxy

# Vercel Deployment API (permanent URLs like Lovable.dev)
EXPO_PUBLIC_VERCEL_DEPLOYMENT_URL=https://idephone-abc123.vercel.app/api/deploy-to-vercel
```

### Étape 7 : Redémarrer l'App

```bash
# Arrêtez le serveur Expo (Ctrl+C)
npm start
# Rechargez l'app sur votre téléphone
```

## ✅ Test

### Option 1 : Quick Preview avec CodeSandbox (2-3 secondes)

1. Ouvrez un projet dans IDEphone
2. Cliquez **"Test Live"** (bouton vert)
3. Choisissez **"CodeSandbox"**
4. WebView s'ouvre avec votre code ! 🎉
5. **Temporaire** - nouvelle URL à chaque fois

### Option 2 : Deploy to Vercel (30-60 secondes) ⭐ COMME LOVABLE.DEV

1. Ouvrez un projet dans IDEphone
2. Cliquez **"Deploy & Test"** (bouton orange)
3. Attendez 30-60 secondes...
4. Votre projet est déployé sur Vercel avec URL permanente ! 🚀
5. Exemple : `https://my-todo-app-xyz.vercel.app`
6. **Permanent** - même URL quand vous redéployez

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
