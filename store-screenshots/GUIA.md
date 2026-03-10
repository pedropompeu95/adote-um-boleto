# Guia de Screenshots para Lojas

## Especificações por loja

### Google Play Store
- Mínimo 2, máximo 8 screenshots
- Formato: JPG ou PNG, sem transparência
- Tamanho recomendado: **1080 × 1920 px** (9:16, portrait)
- Também aceita: 1080 × 2340, 1080 × 2400 (telas modernas)

### Apple App Store
- **Obrigatório:** iPhone 6.9" (1320 × 2868 px) — iPhone 16 Pro Max
- **Obrigatório:** iPhone 6.5" (1242 × 2688 px) — iPhone 11 Pro Max
- Opcional: 5.5" (1242 × 2208 px)
- Formato: JPG ou PNG

---

## Telas a capturar (ordem sugerida)

| # | Tela | O que mostrar | Legenda sugerida |
|---|------|---------------|------------------|
| 1 | **Feed** | Lista de boletos com valores, tipos e progress bar | "Veja boletos que precisam de ajuda" |
| 2 | **Boleto Detail** | Detalhe de um boleto com botão "Quero Ajudar!" e barra de progresso | "Doe o valor que puder, quando puder" |
| 3 | **Cadastrar Boleto** | Formulário preenchido com tipo Luz, descrição e valor | "Cadastre seu boleto em segundos" |
| 4 | **Onboarding (slide 1)** | Slide "Solidariedade Real" com ícone 💙 | "Conectamos quem precisa com quem quer ajudar" |
| 5 | **Perfil / Histórico** | Lista de doações realizadas | "Acompanhe seu impacto" |
| 6 | **Login** | Tela inicial com logo | "Simples, seguro, solidário" |

---

## Como capturar no Android (EAS Preview Build)

1. Faça o build preview:
   ```bash
   eas build --profile preview --platform android
   ```
2. Instale o APK no emulador Android Studio ou dispositivo físico
3. Navegue até cada tela e use:
   - **Emulador Android Studio:** `Ctrl+S` ou botão de câmera no painel lateral
   - **Dispositivo físico:** Botão Power + Volume Baixo
4. Os screenshots ficam em `~/Pictures/Screenshots/` (Android) ou `~/Desktop/` (emulador)

## Como capturar no iOS (simulador Xcode)

1. Faça o build para simulador:
   ```bash
   eas build --profile development --platform ios
   ```
2. Abra o simulador iPhone 15 Pro Max
3. Navegue até cada tela e use `Cmd+S` ou `File > Save Screen`
4. Os PNGs serão salvos na área de trabalho

---

## Dicas para screenshots de qualidade

- Use dados de exemplo realistas (ex: "Conta de Luz - Janeiro R$ 187,50")
- Certifique-se que a barra de progresso mostra progresso parcial (mais visual)
- Evite mostrar informações pessoais reais
- Prefira tema escuro (que é o padrão do app)
- Para o Play Store: **não adicione** bordas de dispositivo — o Google exibe em frame próprio
- Para o App Store: você pode adicionar frames com ferramentas como [Previewed.app](https://previewed.app) ou [AppMockUp](https://app-mockup.com)

---

## Textos de metadados para as lojas

### Título
`Adote um Boleto`

### Subtítulo (App Store)
`Solidariedade em contas básicas`

### Descrição curta (Play Store, 80 chars)
`Ajude a pagar contas básicas de pessoas que precisam.`

### Descrição completa
```
O Adote um Boleto conecta pessoas que precisam pagar contas básicas (luz, água, gás, internet) com pessoas dispostas a ajudar.

Como funciona:
• Cadastre um boleto de conta básica que está difícil de pagar
• Outros usuários podem contribuir com qualquer valor
• Quando o total é arrecadado, o status muda para "pago"
• Seus dados pessoais nunca são exibidos publicamente

Para doadores:
• Veja boletos que precisam de ajuda no feed
• Contribua com o valor que puder
• Acompanhe seu histórico de doações

Privacidade e segurança:
• Apenas o tipo e valor do boleto são exibidos publicamente
• Verificação de e-mail obrigatória
• Dados protegidos pela LGPD

Gratuito, sem taxas, sem intermediação financeira.
```

### Categoria
- Play Store: `Social` ou `Finanças`
- App Store: `Lifestyle` ou `Finance`

### Palavras-chave (App Store, separadas por vírgula)
`boleto,solidariedade,doação,ajuda,conta,luz,água,gás,internet,contribuição`
