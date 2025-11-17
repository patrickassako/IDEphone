# 🔑 Configuration Vercel pour Tool Use

## Problème Actuel

Erreur 401 lors de l'appel à `/api/generate-project`:
```
ERROR ❌ Structured generation failed: [Error: Backend error: 401 - Unknown error]
```

## Solution: Configurer ANTHROPIC_API_KEY

### Étape 1: Obtenir votre clé API Anthropic

1. Allez sur [console.anthropic.com](https://console.anthropic.com)
2. Connectez-vous ou créez un compte
3. Allez dans **Settings** → **API Keys**
4. Créez une nouvelle clé API
5. Copiez la clé (format: `sk-ant-api03-...`)

### Étape 2: Ajouter la clé dans Vercel

1. Allez sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet **idephone**
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez une nouvelle variable:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** `sk-ant-api03-...` (votre clé)
   - **Environments:** Cochez **Production**, **Preview**, **Development**
5. Cliquez sur **Save**

### Étape 3: Re-déployer

Après avoir ajouté la variable d'environnement, vous devez re-déployer:

#### Option A: Via Dashboard Vercel
1. Allez dans **Deployments**
2. Trouvez le dernier déploiement
3. Cliquez sur les 3 points → **Redeploy**

#### Option B: Via Git (Recommandé)
```bash
# Faire un commit vide pour forcer le redéploiement
git commit --allow-empty -m "Trigger redeploy for env vars"
git push origin main
```

### Étape 4: Vérifier

Une fois redéployé, testez à nouveau la génération de projet dans l'app.

Les logs devraient maintenant montrer:
```
🤖 Generating project with Claude Tool Use...
📡 Calling backend: https://idephone.vercel.app/api/generate-project
✅ Generated 12 files using tool use
```

## Variables d'environnement requises

Voici toutes les variables nécessaires pour votre backend:

| Variable | Description | Requis pour |
|----------|-------------|-------------|
| `ANTHROPIC_API_KEY` | Clé API Anthropic | Tool Use (génération structurée) |
| `VERCEL_TOKEN` | Token Vercel | Déploiement automatique |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Secret bypass | Déploiement avec protection |

## Debugging

### Vérifier que la variable est configurée

Dans le terminal Vercel logs:
```
Calling Claude with tool use...
```

Si vous voyez:
```
ANTHROPIC_API_KEY not configured
```

→ La variable n'est pas encore disponible, re-déployez.

### Vérifier le coût

Chaque génération de projet coûte ~$0.05-0.10 en tokens Claude.

Surveillez votre usage sur [console.anthropic.com/settings/usage](https://console.anthropic.com/settings/usage)

## Fallback

Si vous ne voulez pas utiliser Tool Use pour l'instant:
- L'app fonctionne quand même avec le fallback (méthode de parsing)
- Taux de succès: ~60% vs 95% avec Tool Use
- Pas de coûts API

## Questions fréquentes

**Q: Où trouver mes logs Vercel?**
A: Dashboard → Votre projet → Deployments → Cliquez sur un déploiement → Function Logs

**Q: La variable n'est pas prise en compte?**
A: Les variables d'environnement ne sont chargées qu'au moment du build. Vous DEVEZ re-déployer après les avoir ajoutées.

**Q: Ça coûte combien?**
A: Claude Sonnet 4.5 coûte $3/million input tokens et $15/million output tokens. Une génération typique = ~1000 tokens input + ~4000 tokens output = $0.07

---

**Créé le:** 2025-11-17
**Status:** À configurer
