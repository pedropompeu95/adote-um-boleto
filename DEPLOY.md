# Guia de Deploy — Adote um Boleto

## Pré-requisitos

- Node.js 18+ instalado
- Firebase CLI: `npm install -g firebase-tools`
- EAS CLI: `npm install -g eas-cli`
- Conta Firebase com projeto criado
- Conta Expo (gratuita) em https://expo.dev

---

## 1. Configurar Firebase CLI

```bash
firebase login
firebase use --add   # selecione seu projeto Firebase
```

---

## 2. Deploy das Firestore Security Rules

### 2.1 Inicializar Firebase no projeto (apenas na primeira vez)

```bash
cd AdoteBoleto
firebase init firestore
```
- Escolha o projeto correto
- Aceite o nome padrão `firestore.rules` quando perguntado
- Aceite `firestore.indexes.json` quando perguntado

### 2.2 Deploy das regras

```bash
firebase deploy --only firestore:rules
```

Saída esperada:
```
✔  firestore: released rules firestore.rules to cloud.firestore
```

### 2.3 Verificar no console

Acesse: https://console.firebase.google.com
→ Seu projeto → Firestore Database → Rules

---

## 3. Deploy dos Índices do Firestore

O arquivo `firestore.indexes.json` define os índices compostos necessários para as queries do app.

### Índices necessários

Crie o arquivo `firestore.indexes.json` na raiz do projeto com o seguinte conteúdo:

```json
{
  "indexes": [
    {
      "collectionGroup": "boletos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "beneficiarioId", "order": "ASCENDING" },
        { "fieldPath": "status",         "order": "ASCENDING" },
        { "fieldPath": "criadoEm",       "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "doacoes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "doadorId",  "order": "ASCENDING" },
        { "fieldPath": "criadoEm", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Deploy dos índices:

```bash
firebase deploy --only firestore:indexes
```

> **Nota:** A criação dos índices leva alguns minutos no painel do Firebase.
> Se o app lançar erros de "missing index", o console do Firebase exibe um link direto para criar o índice necessário.

### Deploy completo (regras + índices de uma vez)

```bash
firebase deploy --only firestore
```

---

## 4. Deploy do Firebase Storage Rules (opcional)

Se você tiver regras de Storage, crie `storage.rules`:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /boletos/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.resource.size < 5 * 1024 * 1024  // máx 5 MB
        && request.resource.contentType.matches('image/.*');
    }
  }
}
```

Deploy:
```bash
firebase deploy --only storage
```

---

## 5. Build com EAS

### 5.1 Login no EAS

```bash
eas login
```

### 5.2 Build Android (APK para teste interno)

```bash
eas build --profile preview --platform android
```

- O APK ficará disponível para download no dashboard do Expo
- Link: https://expo.dev → Projects → Seu projeto → Builds

### 5.3 Build Android (AAB para Play Store)

```bash
eas build --profile production --platform android
```

### 5.4 Build iOS (simulador)

```bash
eas build --profile development --platform ios
```

### 5.5 Build iOS (App Store)

```bash
eas build --profile production --platform ios
```

> Requer conta Apple Developer ($99/ano) e certificados configurados.

---

## 6. Publicar no Google Play

### 6.1 Primeira publicação (manual)

1. Acesse https://play.google.com/console
2. Crie o app → Internal Testing
3. Faça upload do `.aab` gerado pelo EAS
4. Preencha: Descrição, Screenshots, Ícone, Classificação etária
5. Envie para revisão

### 6.2 Publicações futuras (automatizado)

Configure a Google Service Account e adicione o caminho em `eas.json`:

```json
"submit": {
  "production": {
    "android": {
      "serviceAccountKeyPath": "./google-service-account.json",
      "track": "internal"
    }
  }
}
```

Depois use:
```bash
eas submit --platform android --latest
```

---

## 7. Publicar na App Store

### 7.1 Pré-requisito

- Conta Apple Developer ativa
- App criado no App Store Connect (https://appstoreconnect.apple.com)
- Preencha `eas.json` com seus IDs:

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "seu@email.com",
      "ascAppId": "1234567890",
      "appleTeamId": "ABCDEF1234"
    }
  }
}
```

### 7.2 Submit

```bash
eas submit --platform ios --latest
```

---

## 8. OTA Updates (sem novo build)

Para atualizações de JS sem resubmeter para as lojas:

```bash
eas update --branch production --message "Descrição da atualização"
```

> Requer plano EAS pago ou o plano gratuito limitado (30 updates/mês).

---

## 9. Checklist de lançamento

- [ ] `firestore.rules` implantado
- [ ] Índices do Firestore criados
- [ ] Storage rules implantado
- [ ] Ícone e splash customizados (`assets/`)
- [ ] `app.json` com dados de produção (bundleId, package, version)
- [ ] Variáveis de ambiente do Firebase em `src/config/firebase.js`
- [ ] Build de produção gerado e testado em dispositivo real
- [ ] Screenshots capturadas (ver `store-screenshots/GUIA.md`)
- [ ] Descrição, categoria e palavras-chave preenchidas nas lojas
- [ ] Política de Privacidade publicada em URL pública (exigido pelas lojas)
- [ ] Termos de Uso publicados em URL pública

---

## 10. URL pública para Política de Privacidade

As lojas exigem uma URL pública para a Política de Privacidade.
Opções gratuitas:

1. **GitHub Pages:** publique um HTML simples no seu repositório
2. **Google Sites:** crie uma página em sites.google.com
3. **Notion:** publique uma página pública do Notion

Exemplo de URL: `https://seuusuario.github.io/adoteumboleto/privacidade`

Configure no:
- Play Store: Google Play Console → Política de privacidade
- App Store: App Store Connect → App Information → Privacy Policy URL
