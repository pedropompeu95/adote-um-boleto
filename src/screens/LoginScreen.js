import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase";
import { mapFirebaseError } from "../utils/firebaseErrors";
import { logEvento } from "../utils/analytics";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !senha) {
      Alert.alert("Atenção", "Preencha todos os campos.");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      logEvento("login", { method: "email" });
    } catch (e) {
      Alert.alert("Erro ao entrar", mapFirebaseError(e));
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>💙 Adote um Boleto</Text>
      <Text style={styles.subtitle}>Ajude quem precisa, de forma segura</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        placeholderTextColor="#888"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={styles.link}>Não tem conta? Cadastre-se</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("EsqueciSenha")}>
        <Text style={styles.linkFraco}>Esqueci minha senha</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: "#0f0f1a",
    justifyContent: "center", padding: 24,
  },
  logo: {
    fontSize: 28, fontWeight: "bold",
    color: "#fff", textAlign: "center", marginBottom: 8,
  },
  subtitle: {
    color: "#888", textAlign: "center",
    marginBottom: 40, fontSize: 14,
  },
  input: {
    backgroundColor: "#1e1e2e", color: "#fff",
    borderRadius: 10, padding: 14,
    marginBottom: 12, fontSize: 15,
    borderWidth: 1, borderColor: "#333",
  },
  button: {
    backgroundColor: "#e94560", borderRadius: 10,
    padding: 16, alignItems: "center", marginTop: 8,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  link: {
    color: "#e94560", textAlign: "center",
    marginTop: 20, fontSize: 14,
  },
  linkFraco: {
    color: "#555", textAlign: "center",
    marginTop: 12, fontSize: 13,
  },
});