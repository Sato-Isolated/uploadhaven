# Nouvelle Architecture FilePreview ZK-Friendly

## 🎯 Objectif

Refondre complètement le système de preview de fichiers pour une séparation claire entre :
- **Fichiers normaux** (non-cryptés) - Preview direct
- **Fichiers ZK** (Zero-Knowledge) - Interface de décryptage + preview

## ❌ Problèmes actuels

### Architecture confuse
- `FilePreviewClient` mélange logique normale et ZK
- Hook `useFilePreviewLogic` trop complexe (gère tout)
- Conversion `ClientFileData` → `FilePreviewData` artificielle
- États UI pour ZK hardcodés inline

### API incohérente  
- `/api/preview-file/[shortUrl]` retourne blob crypté ZK (inutile)
- Pas d'endpoint pour métadonnées ZK publiques
- Client tente de fetch blob encrypted via API normale

### UX problématique
- Pas de guidance claire pour fichiers ZK
- Messages d'erreur génériques
- Pas de distinction visuelle ZK vs normal
- Bouton "Decrypt & Preview" sans contexte

## ✅ Nouvelle Architecture

### 1. Composants principaux

```tsx
// Structure des nouveaux composants
src/components/domains/filepreview/
├── FilePreviewRouter.tsx          // Route vers bon type
├── regular/
│   ├── RegularFilePreview.tsx     // Fichiers non-cryptés
│   └── useRegularPreview.ts       // Hook simple
├── zk/
│   ├── ZKFilePreview.tsx          // Interface complète ZK
│   ├── ZKDecryptionInterface.tsx  // UI pour entrer clé
│   ├── ZKPreviewContent.tsx       // Contenu après décryptage
│   └── useZKPreview.ts            // Hook ZK spécialisé
└── shared/
    ├── FileMetadata.tsx           // Affichage métadonnées
    ├── PreviewComponents/         // Image, Video, etc.
    └── types.ts                   // Types partagés
```

### 2. APIs spécialisées

#### `/api/file-info/[shortUrl]` (nouveau)
```typescript
// Métadonnées publiques pour routage
interface FileInfoResponse {
  shortUrl: string;
  isZeroKnowledge: boolean;
  isPasswordProtected: boolean;
  isExpired: boolean;
  // Pour fichiers ZK
  zkMetadata?: {
    contentCategory: string;
    algorithm: string;
    keyHint: 'password' | 'embedded';
  };
  // Pour fichiers normaux
  basicInfo?: {
    originalName: string;
    mimeType: string;
    size: number;
  };
}
```

#### `/api/preview-file/[shortUrl]` (modifié)
- **Seulement pour fichiers non-ZK**
- Retourne le fichier directement
- Erreur 400 si fichier ZK détecté

#### `/api/zk-blob/[shortUrl]` (nouveau)  
- **Seulement pour fichiers ZK**
- Retourne blob crypté pour décryptage client
- Headers avec métadonnées de décryptage

### 3. Flow UX amélioré

#### Pour fichiers normaux
1. `FilePreviewRouter` détecte type via `/api/file-info`
2. Route vers `RegularFilePreview` 
3. Preview direct via `/api/preview-file`

#### Pour fichiers ZK
1. `FilePreviewRouter` détecte ZK via `/api/file-info`
2. Route vers `ZKFilePreview`
3. `ZKDecryptionInterface` gère :
   - Extraction automatique clé URL
   - Interface input clé manuelle
   - Validation et feedback
4. Après décryptage → `ZKPreviewContent` normal

### 4. Code d'exemple

#### FilePreviewRouter.tsx
```tsx
'use client';

export default function FilePreviewRouter() {
  const { shortUrl } = useParams();
  const { data: fileInfo, isLoading } = useFileInfo(shortUrl);
  
  if (isLoading) return <FilePreviewLoadingState />;
  
  if (fileInfo?.isZeroKnowledge) {
    return <ZKFilePreview fileInfo={fileInfo} />;
  }
  
  return <RegularFilePreview fileInfo={fileInfo} />;
}
```

#### ZKFilePreview.tsx
```tsx
'use client';

export default function ZKFilePreview({ fileInfo }) {
  const [decryptionKey, setDecryptionKey] = useState('');
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [decryptedBlob, setDecryptedBlob] = useState(null);
  
  // Interface de décryptage d'abord
  if (!isDecrypted) {
    return (
      <ZKDecryptionInterface 
        fileInfo={fileInfo}
        onDecryptionSuccess={(blob) => {
          setDecryptedBlob(blob);
          setIsDecrypted(true);
        }}
      />
    );
  }
  
  // Preview normal après décryptage
  return <ZKPreviewContent blob={decryptedBlob} fileInfo={fileInfo} />;
}
```

## 🚀 Plan d'implémentation

### Phase 1 : APIs
1. Créer `/api/file-info/[shortUrl]` 
2. Modifier `/api/preview-file/[shortUrl]` (rejet ZK)
3. Créer `/api/zk-blob/[shortUrl]`

### Phase 2 : Composants ZK
1. `ZKDecryptionInterface` - UI clé
2. `ZKFilePreview` - Container principal  
3. `useZKPreview` - Logique décryptage

### Phase 3 : Composants réguliers
1. `RegularFilePreview` - Simple et direct
2. `useRegularPreview` - Hook minimal

### Phase 4 : Routeur
1. `FilePreviewRouter` - Détection et routing
2. Remplacement `FilePreviewClient` ancien

### Phase 5 : Nettoyage
1. Supprimer ancien `FilePreviewClient`
2. Nettoyer `useFilePreviewLogic` complexe
3. Mise à jour imports/exports

## 🎨 Avantages

✅ **Séparation claire** - ZK vs normal complètement séparés  
✅ **UX intuitive** - Interface dédiée pour chaque type  
✅ **Code maintenable** - Logiques indépendantes  
✅ **Performance** - Pas de logique inutile  
✅ **Extensible** - Facile d'ajouter nouveaux types  
✅ **Testable** - Composants isolés  

Cette architecture respecte le principe Zero-Knowledge : jamais de décryptage côté serveur, interface claire pour l'utilisateur, séparation des responsabilités.
