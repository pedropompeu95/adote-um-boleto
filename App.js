import * as Sentry from "@sentry/react-native";
import AppNavigator from "./src/navigation/AppNavigator";

Sentry.init({
  // Substitua pelo seu DSN em: https://sentry.io → Settings → Projects → Client Keys
  // Crie conta gratuita → novo projeto "React Native" → copie o DSN
  dsn: "COLE_SEU_SENTRY_DSN_AQUI",
  debug: false,
  tracesSampleRate: 0.2,
  // Desativado enquanto o DSN não for configurado
  enabled: !("COLE_SEU_SENTRY_DSN_AQUI".startsWith("COLE")),
});

function App() {
  return <AppNavigator />;
}

export default Sentry.wrap(App);