// Sentry não é suportado no bundler web — apenas em builds nativos (iOS/Android)
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return <AppNavigator />;
}
