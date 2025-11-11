# 🚀 Guide de Redéploiement Backend Vercel

## Vous avez l'erreur 404 ?

Si vous voyez :
```
ERROR Backend response: The page could not be found
NOT_FOUND
```

C'est parce que votre backend Vercel ne contient pas les fichiers API.

---

## ✅ Solution Rapide (5 minutes)

### Étape 1 : Vérifier les fichiers API localement

```bash
ls -la api/
```

Vous devriez voir :
- `codesandbox-proxy.js` ✅
- `deploy-to-vercel.js` ✅

Si vous ne les voyez pas, faites `git pull` d'abord.

---

### Étape 2 : Se connecter à Vercel (si première fois)

```bash
vercel login
```

Suivez les instructions pour vous connecter.

---

### Étape 3 : Déployer en Production

```bash
# Depuis la racine du projet IDEphone
vercel deploy --prod
```

**IMPORTANT** : Pendant le déploiement, Vercel va poser des questions :

```
? Set up and deploy "~/IDEphone"? [Y/n]
→ Répondez: Y

? Which scope do you want to deploy to?
→ Choisissez votre compte personnel

? Link to existing project? [y/N]
→ Répondez: y

? What's the name of your existing project?
→ Tapez: idephone-3ywrb3cqg (ou le nom de votre projet)
```

---

### Étape 4 : Ajouter VERCEL_TOKEN (Critique !)

Après le déploiement, vous DEVEZ ajouter votre `VERCEL_TOKEN` :

1. Créez un token (si vous ne l'avez pas déjà) :
   - https://vercel.com/account/tokens
   - Cliquez "Create Token"
   - Copiez le token

2. Ajoutez-le dans Vercel Dashboard :
   - https://vercel.com/dashboard
   - Sélectionnez votre projet
   - **Settings** → **Environment Variables**
   - Cliquez **"Add"**
   - Name: `VERCEL_TOKEN`
   - Value: [collez votre token]
   - Environments: Cochez **Production**, **Preview**, **Development**
   - Cliquez **"Save"**

---

### Étape 5 : Redéployer APRÈS avoir ajouté le token

```bash
vercel deploy --prod
```

Cette fois, le backend aura accès au token !

---

### Étape 6 : Vérifier que ça marche

Ouvrez dans votre navigateur :

```
https://idephone-3ywrb3cqg-patricks-projects-ce18ee33.vercel.app/api/codesandbox-proxy
```

**Résultat attendu :**
```json
{"error":"Method not allowed"}
```

✅ **C'est BON !** Le endpoint existe (il refuse juste les GET, il veut des POST)

❌ **Si vous voyez "404 Not Found"** : Le déploiement n'a pas fonctionné, recommencez depuis l'Étape 3.

---

### Étape 7 : Tester dans l'app

**Redémarrez l'app mobile** (important !) :

```bash
# Ctrl+C pour arrêter
npm start
```

Puis testez **"Deploy & Test"** ou **"Test Live"** !

---

## 📋 Checklist Complète

Avant de tester, vérifiez :

- [ ] Fichiers API présents localement : `ls -la api/`
- [ ] Backend déployé : `vercel deploy --prod`
- [ ] VERCEL_TOKEN ajouté dans Vercel Dashboard
- [ ] Redéployé après avoir ajouté le token : `vercel deploy --prod`
- [ ] Endpoint accessible dans navigateur (voir Étape 6)
- [ ] EXPO_PUBLIC_VERCEL_BYPASS_TOKEN dans .env local
- [ ] App mobile redémarrée

---

## 🔍 Logs de Succès

Après déploiement, dans l'app vous devriez voir :

```
LOG Using deployment API: https://idephone-3ywrb3cqg-patricks-projects-ce18ee33.vercel.app/api/deploy-to-vercel
LOG ✅ Using Vercel bypass token for authentication
LOG Deployment successful!
LOG URL: https://cree-une-landing-abc123.vercel.app
```

Au lieu de :
```
ERROR Backend response: The page could not be found
```

---

## ⚠️ Problèmes Courants

### "VERCEL_TOKEN not set"
→ Vous avez oublié l'Étape 4. Ajoutez le token dans Vercel Dashboard, puis redéployez.

### "Authentication Required"
→ Vérifiez que `EXPO_PUBLIC_VERCEL_BYPASS_TOKEN` est dans votre `.env` local.

### "Network request failed"
→ Vérifiez votre connexion internet et l'URL dans `.env`.

---

## 🎯 Résumé en 3 Commandes

Si vous avez déjà tout configuré :

```bash
# 1. Déployer
vercel deploy --prod

# 2. Attendre la fin du build (1-2 minutes)

# 3. Tester dans le navigateur
open https://idephone-3ywrb3cqg-patricks-projects-ce18ee33.vercel.app/api/codesandbox-proxy
```

Devrait retourner `{"error":"Method not allowed"}` ✅

---

Besoin d'aide ? Consultez `TROUBLESHOOTING.md` !
