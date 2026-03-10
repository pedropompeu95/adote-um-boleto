import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { onIdTokenChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { registrarPushToken } from "../utils/notifications";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import EsqueciSenhaScreen from "../screens/EsqueciSenhaScreen";
import FeedScreen from "../screens/FeedScreen";
import BoletoDetailScreen from "../screens/BoletoDetailScreen";
import CadastrarBoletoScreen from "../screens/CadastrarBoletoScreen";
import PerfilScreen from "../screens/PerfilScreen";
import MeusBoletoScreen from "../screens/MeusBoletoScreen";
import EditBoletoScreen from "../screens/EditBoletoScreen";
import EmailVerificationScreen from "../screens/EmailVerificationScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import TermosScreen from "../screens/TermosScreen";
import PrivacidadeScreen from "../screens/PrivacidadeScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function FeedStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Feed" component={FeedScreen} />
      <Stack.Screen name="BoletoDetail" component={BoletoDetailScreen} />
    </Stack.Navigator>
  );
}

function MeusBoletosStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MeusBoletos" component={MeusBoletoScreen} />
      <Stack.Screen name="BoletoDetail" component={BoletoDetailScreen} />
      <Stack.Screen name="EditBoleto" component={EditBoletoScreen} />
    </Stack.Navigator>
  );
}

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "#1a1a2e" },
        tabBarActiveTintColor: "#e94560",
        tabBarInactiveTintColor: "#888",
      }}
    >
      <Tab.Screen
        name="Início"
        component={FeedStack}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 18 }}>🏠</Text> }}
      />
      <Tab.Screen
        name="Cadastrar"
        component={CadastrarBoletoScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 18 }}>➕</Text> }}
      />
      <Tab.Screen
        name="Meus Boletos"
        component={MeusBoletosStack}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 18 }}>📋</Text> }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilStack}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 18 }}>👤</Text> }}
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="EsqueciSenha" component={EsqueciSenhaScreen} />
      <Stack.Screen name="Termos" component={TermosScreen} />
      <Stack.Screen name="Privacidade" component={PrivacidadeScreen} />
    </Stack.Navigator>
  );
}

function PerfilStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PerfilMain" component={PerfilScreen} />
      <Stack.Screen name="Termos" component={TermosScreen} />
      <Stack.Screen name="Privacidade" component={PrivacidadeScreen} />
    </Stack.Navigator>
  );
}

// Deep link config: adoteumboleto://boleto/{id} → abre BoletoDetail
const linking = {
  prefixes: ["adoteumboleto://", "https://adoteumboleto.com"],
  config: {
    screens: {
      "Início": {
        screens: {
          Feed: "",
          BoletoDetail: "boleto/:boletoId",
        },
      },
    },
  },
};

export default function AppNavigator() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // null = ainda carregando; true/false = resultado do Firestore
  const [onboardingDone, setOnboardingDone] = useState(null);

  useEffect(() => {
    // onIdTokenChanged dispara também após auth.currentUser.reload() + getIdToken(true),
    // permitindo detectar a verificação de email em tempo real.
    const unsubscribe = onIdTokenChanged(auth, (u) => {
      setUser(u);
      if (!u || !u.emailVerified) {
        setOnboardingDone(null);
        setLoading(false);
      }
      // Para usuários verificados, checaremos o onboarding no próximo useEffect
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user || !user.emailVerified) return;
    setLoading(true);
    getDoc(doc(db, "usuarios", user.uid)).then((snap) => {
      setOnboardingDone(snap.data()?.onboardingConcluido === true);
      setLoading(false);
    }).catch(() => {
      setOnboardingDone(false);
      setLoading(false);
    });
    // Registra push token em background (não bloqueia o carregamento)
    registrarPushToken(user.uid);
  }, [user?.uid, user?.emailVerified]);

  const LoadingView = (
    <View style={{ flex: 1, backgroundColor: "#0f0f1a", justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#e94560" />
    </View>
  );

  if (loading) return LoadingView;

  function renderConteudo() {
    if (!user) return <AuthStack />;
    if (!user.emailVerified) return <EmailVerificationScreen />;
    if (onboardingDone === null) return LoadingView;
    if (!onboardingDone) {
      return <OnboardingScreen onConcluir={() => setOnboardingDone(true)} />;
    }
    return <AppTabs />;
  }

  return (
    <NavigationContainer linking={linking}>
      {renderConteudo()}
    </NavigationContainer>
  );
}
