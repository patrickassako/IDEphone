# 🔧 Dépannage IDEphone

## Erreur 401 "Authentication Required"

**Symptôme :**
```
ERROR Deployment error: [Error: Deployment failed (401)]
```

**Cause :** Vercel Deployment Protection est activée sur votre projet backend.

**Solution :**
1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet backend (ex: `idephone-xyz...`)
3. **Settings** → **Deployment Protection**
4. Changez **"Standard Protection"** → **"None"**
5. Cliquez sur **"Save"**

---

## Les variables d'environnement ne sont pas chargées

**Symptôme :**
L'app utilise encore les anciennes URLs même après avoir modifié `.env`

**Solution :**
Les variables d'environnement sont chargées au démarrage de l'app.

**Vous DEVEZ redémarrer l'app :**
```bash
# Arrêtez l'app avec Ctrl+C
# Puis relancez
npm start
```

Si vous utilisez Expo Go :
- Fermez complètement l'app (pas juste minimiser)
- Relancez l'app

---

## URL Backend incorrecte dans les logs

**Symptôme :**
```
LOG Using deployment API: https://mon-url.vercel.app/
```
L'URL se termine par `/` au lieu de `/api/deploy-to-vercel`

**Cause :** Le fichier `.env` n'est pas correctement formaté ou pas rechargé.

**Solution :**
Vérifiez que votre `.env` contient les URLs COMPLÈTES :
```env
EXPO_PUBLIC_CODESANDBOX_PROXY_URL=https://votre-url.vercel.app/api/codesandbox-proxy
EXPO_PUBLIC_VERCEL_DEPLOYMENT_URL=https://votre-url.vercel.app/api/deploy-to-vercel
```

**Puis REDÉMARREZ l'app !**

---

## Erreur 404 "Not Found"

**Symptôme :**
```
ERROR Backend response: The page could not be found
```

**Causes possibles :**
1. Les fichiers API n'existent pas sur le backend déployé
2. L'URL dans `.env` est incorrecte

**Solutions :**

### Vérifier que les APIs existent :
Ouvrez dans votre navigateur :
```
https://votre-url.vercel.app/api/codesandbox-proxy
```

Vous devriez voir : `{"error":"Method not allowed"}` ✅

Si vous voyez "404 Not Found" ❌, redéployez le backend :
```bash
vercel deploy --prod
```

### Vérifier que `.env` contient la bonne URL :
```bash
cat .env
```

L'URL doit correspondre à celle de votre dashboard Vercel.

---

## Erreur "VERCEL_TOKEN not set"

**Symptôme :**
```
ERROR Server configuration error: VERCEL_TOKEN not set
```

**Solution :**
1. Créez un token : https://vercel.com/account/tokens
2. Allez sur Vercel Dashboard → Votre projet → **Settings** → **Environment Variables**
3. Ajoutez :
   - Name : `VERCEL_TOKEN`
   - Value : [votre token]
   - Environments : Cochez **Production**, **Preview**, **Development**
4. **Redéployez** : `vercel deploy --prod`

---

## Checklist de Déploiement

Avant de tester dans l'app, vérifiez :

- [ ] Backend déployé avec `vercel deploy --prod`
- [ ] `VERCEL_TOKEN` ajouté dans Vercel Dashboard
- [ ] Deployment Protection **désactivée** (Settings → Deployment Protection → None)
- [ ] Fichier `.env` créé localement avec les bonnes URLs
- [ ] URLs dans `.env` incluent `/api/codesandbox-proxy` et `/api/deploy-to-vercel`
- [ ] App mobile redémarrée après modification de `.env`

---

## Test Rapide

Pour vérifier que tout fonctionne :

1. **Backend accessible :**
   ```bash
   curl https://votre-url.vercel.app/api/codesandbox-proxy
   ```
   Devrait retourner : `{"error":"Method not allowed"}`

2. **App lit le bon .env :**
   Lancez l'app, générez un projet, testez "Deploy & Test"
   Regardez les logs :
   ```
   LOG Using deployment API: https://votre-url.vercel.app/api/deploy-to-vercel
   ```

   ✅ Bon : URL complète avec `/api/deploy-to-vercel`
   ❌ Mauvais : URL se termine par `/` sans le chemin API

---

## Besoin d'aide ?

Consultez `VERCEL_SETUP_GUIDE.md` pour le guide complet de configuration.
