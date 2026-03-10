/**
 * Wrapper de analytics que falha silenciosamente.
 * Firebase Analytics funciona nativamente após configurar google-services.json
 * (Android) e GoogleService-Info.plist (iOS) no build do EAS.
 *
 * Para habilitar no build de produção:
 *   1. Baixe os arquivos de configuração no Firebase Console
 *   2. Adicione em app.json: { "expo": { "android": { "googleServicesFile": "..." } } }
 */
import { getApp } from "firebase/app";

let _analytics = null;

async function getAnalyticsInstance() {
  if (_analytics !== null) return _analytics;
  try {
    const { getAnalytics, isSupported } = await import("firebase/analytics");
    const supported = await isSupported();
    _analytics = supported ? getAnalytics(getApp()) : false;
  } catch {
    _analytics = false;
  }
  return _analytics;
}

export async function logEvento(nome, params = {}) {
  try {
    const a = await getAnalyticsInstance();
    if (!a) return;
    const { logEvent } = await import("firebase/analytics");
    logEvent(a, nome, params);
  } catch (_) {}
}
