#!/usr/bin/env node
/**
 * Configura o Sentry DSN no App.js automaticamente.
 *
 * Uso:
 *   node scripts/configurar-sentry.js "https://abc123@o123.ingest.sentry.io/456789"
 *
 * Como obter o DSN:
 *   1. Acesse https://sentry.io e crie uma conta gratuita
 *   2. Crie um novo projeto → plataforma: "React Native"
 *   3. Vá em Settings → Projects → [seu projeto] → Client Keys (DSN)
 *   4. Copie o DSN e rode este script
 */

const fs   = require("fs");
const path = require("path");

const dsn = process.argv[2];

if (!dsn) {
  console.error("❌ Uso: node scripts/configurar-sentry.js \"SEU_DSN_AQUI\"");
  console.error('   Exemplo: node scripts/configurar-sentry.js "https://abc@o123.ingest.sentry.io/456"');
  process.exit(1);
}

if (!dsn.startsWith("https://") || !dsn.includes("sentry.io")) {
  console.error("❌ DSN inválido. Deve começar com https:// e conter sentry.io");
  process.exit(1);
}

const appJsPath = path.join(__dirname, "..", "App.js");
let content = fs.readFileSync(appJsPath, "utf8");

// Substitui o placeholder pelo DSN real e remove a flag enabled condicional
content = content
  .replace(
    /dsn: "COLE_SEU_SENTRY_DSN_AQUI",/,
    `dsn: "${dsn}",`
  )
  .replace(
    /\/\/ Desativado enquanto o DSN não for configurado\n  enabled: !\("COLE_SEU_SENTRY_DSN_AQUI"\.startsWith\("COLE"\)\),/,
    `enabled: true,`
  );

fs.writeFileSync(appJsPath, content, "utf8");
console.log("✅ Sentry configurado com sucesso em App.js!");
console.log("   DSN:", dsn);
console.log("\n📌 Próximo passo: rode um novo build para ativar o crash reporting:");
console.log("   eas build --platform android --profile preview");
