# 🔑 Guide Rapide : Obtenir le Bypass Token Vercel

## Problème
Vous avez l'erreur **"Deployment failed (401)"** parce que Vercel Deployment Protection est activée.

Sans compte Pro, vous ne pouvez pas la désactiver. **Mais vous pouvez utiliser un bypass token !**

---

## ✅ Solution en 3 Étapes

### Étape 1 : Obtenir le Bypass Token

1. Allez sur https://vercel.com/dashboard
2. Cliquez sur votre projet : **`idephone`** (le plus récent déployé)
3. Cliquez sur **Settings** (dans le menu de gauche)
4. Scrollez jusqu'à **Deployment Protection**
5. Vous verrez une section **"Protection Bypass for Automation"**
6. Cliquez sur **"Generate Token"** ou **"Create Bypass Token"**
7. **Copiez le token** (il ressemble à : `AbCdEf123456...`)

💡 **Important** : Ce token permet à votre app de s'authentifier automatiquement.

---

### Étape 2 : Ajouter le Token au fichier .env

Ouvrez le fichier `.env` à la racine du projet IDEphone et ajoutez le token :

```env
# Backend Proxy Configuration
EXPO_PUBLIC_CODESANDBOX_PROXY_URL=https://idephone-j603gaotl-patricks-projects-ce18ee33.vercel.app/api/codesandbox-proxy
EXPO_PUBLIC_VERCEL_DEPLOYMENT_URL=https://idephone-j603gaotl-patricks-projects-ce18ee33.vercel.app/api/deploy-to-vercel

# Collez votre bypass token ici ⬇️
EXPO_PUBLIC_VERCEL_BYPASS_TOKEN=AbCdEf123456VotreTokenIci
```

**Remplacez** `AbCdEf123456VotreTokenIci` par le token que vous avez copié.

---

### Étape 3 : Redémarrer l'App

Les variables d'environnement sont chargées au démarrage. **Vous DEVEZ redémarrer l'app** :

```bash
# Arrêtez l'app avec Ctrl+C
# Puis relancez
npm start
```

---

## ✨ C'est Tout !

Maintenant, essayez de nouveau **"Deploy & Test"** ou **"Test Live"**.

Dans les logs, vous devriez voir :
```
✅ Using Vercel bypass token for authentication
```

Au lieu de :
```
ERROR Deployment failed (401)
```

---

## 🔍 Où Trouver le Bypass Token dans Vercel

```
Vercel Dashboard
  └── Your Project (idephone)
      └── Settings
          └── Deployment Protection
              └── Protection Bypass for Automation  ← ICI !
                  └── [Generate Token]
```

---

## ❓ Questions Fréquentes

**Q: Le token expire-t-il ?**
A: Non, le bypass token ne expire pas. Mais vous pouvez le révoquer et en créer un nouveau.

**Q: C'est sécurisé ?**
A: Oui, c'est la méthode officielle Vercel pour l'automation. Le token est dans `.env` qui est dans `.gitignore`, donc il ne sera jamais committé.

**Q: Je dois le faire pour chaque projet ?**
A: Non ! Ce token permet d'accéder à VOTRE backend IDEphone. Une fois configuré, tous vos projets générés pourront déployer.

**Q: Ça marchera pour CodeSandbox aussi ?**
A: Oui ! Le token fonctionne pour les deux endpoints (CodeSandbox proxy ET Vercel deployment).

---

## 🛟 Besoin d'Aide ?

Si ça ne marche toujours pas après avoir suivi ces étapes :
1. Vérifiez que le token est bien copié dans `.env` (pas d'espaces avant/après)
2. Vérifiez que vous avez bien redémarré l'app
3. Consultez `TROUBLESHOOTING.md` pour plus de solutions
