# 🚀 Guide de Résolution Rapide - Déploiement Vercel

## ❌ Erreur Actuelle
```
ERROR  Deployment response: The page could not be found
NOT_FOUND
```

## ✅ Solution en 3 Étapes

### Étape 1: Configurer les Variables d'Environnement sur Vercel

Le backend est déployé mais il manque les variables d'environnement requises !

**1. Obtenir votre Vercel Token:**
   - Allez sur https://vercel.com/account/tokens
   - Cliquez "Create Token"
   - Nom: "IDEphone Backend"
   - Copiez le token (vous ne le verrez qu'une fois!)

**2. Ajouter les Variables sur Vercel:**
   - Allez sur https://vercel.com/dashboard
   - Sélectionnez votre projet "idephone"
   - Allez dans **Settings → Environment Variables**
   - Ajoutez ces 3 variables:

   ```
   Variable 1:
   Name: VERCEL_TOKEN
   Value: [Collez votre token Vercel]
   Environment: Production ✓

   Variable 2:
   Name: VERCEL_AUTOMATION_BYPASS_SECRET
   Value: [Un string random, ex: abc123xyz789]
   Environment: Production ✓

   Variable 3:
   Name: ANTHROPIC_API_KEY
   Value: [Votre clé API Anthropic - optionnel pour l'instant]
   Environment: Production ✓
   ```

**3. Sauvegarder** les variables

### Étape 2: Redéployer le Backend

Après avoir ajouté les variables, **redéployez** pour qu'elles prennent effet :

```bash
cd /path/to/IDEphone
vercel deploy --prod
```

Cela va créer une NOUVELLE URL comme:
```
https://idephone-xyz123.vercel.app
```

### Étape 3: Mettre à Jour l'App Mobile

**1. Ouvrez votre fichier `.env` local**

**2. Mettez à jour avec la NOUVELLE URL de l'étape 2:**

```env
# Remplacez par la NOUVELLE URL du redéploiement
EXPO_PUBLIC_VERCEL_DEPLOYMENT_URL=https://idephone-xyz123.vercel.app/api/deploy-to-vercel
EXPO_PUBLIC_CODESANDBOX_PROXY_URL=https://idephone-xyz123.vercel.app/api/codesandbox-proxy

# Collez le MÊME bypass secret que sur Vercel
EXPO_PUBLIC_VERCEL_BYPASS_TOKEN=abc123xyz789
```

**3. Redémarrez l'app:**

```bash
# Arrêtez avec Ctrl+C
npm start
# Rechargez l'app sur votre téléphone (secouer et "Reload")
```

## 🧪 Test

Essayez de créer et déployer un projet:

1. Ouvrez IDEphone
2. Créez un projet
3. Cliquez sur "Deploy to Vercel"
4. Attendez 30-60 secondes
5. Votre projet devrait être déployé! 🎉

## 🐛 Toujours Pas Résolu?

### Vérifier que le backend fonctionne:

```bash
curl https://votre-nouvelle-url.vercel.app/api/deploy-to-vercel
```

Vous devriez voir:
```json
{"error":"Method not allowed"}
```

Si vous voyez "NOT_FOUND", cela signifie que le backend n'est pas correctement déployé.

### Vérifier les logs Vercel:

```bash
vercel logs
```

### Variables d'Environnement Manquantes?

Si les logs montrent "VERCEL_TOKEN not set", retournez à l'Étape 1 et vérifiez que vous avez bien ajouté toutes les variables.

## 📊 Checklist Finale

- [ ] Variables d'environnement ajoutées sur Vercel Dashboard
- [ ] Backend redéployé avec `vercel deploy --prod`
- [ ] Fichier `.env` local mis à jour avec nouvelle URL
- [ ] App mobile redémarrée avec `npm start`
- [ ] Testé le déploiement dans l'app

## 💡 Astuce

Vous pouvez tester les endpoints directement:

```bash
# Test CodeSandbox endpoint
curl -X POST https://votre-url.vercel.app/api/codesandbox-proxy \
  -H "Content-Type: application/json" \
  -d '{"projectName":"test","files":[{"path":"index.js","content":"console.log(\"hello\")"}]}'

# Test Vercel Deployment endpoint
curl -X POST https://votre-url.vercel.app/api/deploy-to-vercel \
  -H "Content-Type: application/json" \
  -d '{"projectName":"test","files":[{"path":"index.js","content":"console.log(\"hello\")"}]}'
```

Si vous obtenez des réponses JSON (même des erreurs), cela signifie que le backend fonctionne !

---

**Besoin d'aide?** Consultez:
- `DEPLOY_BACKEND.md` - Guide de déploiement complet
- `TROUBLESHOOTING.md` - Guide de résolution des problèmes
- `BYPASS_TOKEN_GUIDE.md` - Guide du token de bypass
