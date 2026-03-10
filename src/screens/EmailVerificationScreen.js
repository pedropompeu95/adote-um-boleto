import React, { useState } from "react";
import {
  View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { sendEmailVerification, signOut, reload, getIdToken } from "firebase/auth";
import { auth } from "../config/firebase";

export default function EmailVerificationScreen() {
  const [loading, setLoading] = useState(false);
  const [reenviado, setReenviado] = useState(false);

  async function handleReenviar() {
    setLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setReenviado(true);
    } catch (e) {
      Alert.alert("Erro", "Não foi possível reenviar o email. Tente novamente.");
    }
    setLoading(false);
  }

  async function handleJaVerifiquei() {
    setLoading(true);
    try {
      await reload(auth.currentUser);
      if (auth.currentUser.emailVerified) {
        // Força atualização do token para onIdTokenChanged disparar no AppNavigator
        await getIdToken(auth.currentUser, true);
      } else {
        Alert.alert(
          "Email ainda não verificado",
          "Verifique sua caixa de entrada (ou spam) e clique no link enviado."
        );
      }
    } catch (e) {
      Alert.alert("Erro", "Não foi possível verificar. Tente novamente.");
    }
    setLoading(false);
  }

  async function handleSair() {
    await signOut(auth);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icone}>📧</Text>
      <Text style={styles.titulo}>Verifique seu email</Text>
      <Text style={styles.subtitulo}>
        Enviamos um link de confirmação para{"\n"}
        <Text style={styles.email}>{auth.currentUser?.email}</Text>
      </Text>
      <Text style={styles.instrucao}>
        Abra o email e clique no link para ativar sua conta. Verifique também a pasta de spam.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={handleJaVerifiquei}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Já verifiquei ✓</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.buttonSecundario, reenviado && styles.buttonDesabilitado]}
        onPress={handleReenviar}
        disabled={loading || reenviado}
      >
        <Text style={styles.buttonSecundarioText}>
          {reenviado ? "Email reenviado ✓" : "Reenviar email"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSair}>
        <Text style={styles.link}>← Sair e usar outra conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: "#0f0f1a",
    justifyContent: "center", padding: 24, alignItems: "center",
  },
  icone: { fontSize: 60, marginBottom: 16 },
  titulo: {
    fontSize: 24, fontWeight: "bold",
    color: "#fff", textAlign: "center", marginBottom: 8,
  },
  subtitulo: {
    color: "#888", textAlign: "center",
    fontSize: 14, marginBottom: 8, lineHeight: 22,
  },
  email: { color: "#e94560", fontWeight: "bold" },
  instrucao: {
    color: "#555", textAlign: "center",
    fontSize: 13, marginBottom: 32, lineHeight: 20,
  },
  button: {
    backgroundColor: "#e94560", borderRadius: 10,
    padding: 16, alignItems: "center",
    marginBottom: 12, width: "100%",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  buttonSecundario: {
    borderRadius: 10, padding: 14,
    alignItems: "center", marginBottom: 24, width: "100%",
    borderWidth: 1, borderColor: "#333",
  },
  buttonDesabilitado: { borderColor: "#4caf50" },
  buttonSecundarioText: { color: "#aaa", fontSize: 15 },
  link: {
    color: "#555", textAlign: "center",
    fontSize: 13, marginTop: 8,
  },
});
