import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView
} from "react-native";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { mapFirebaseError } from "../utils/firebaseErrors";
import { logEvento } from "../utils/analytics";

export default function RegisterScreen({ navigation }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!nome || !email || !senha) {
      Alert.alert("Atenção", "Preencha todos os campos.");
      return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, senha);
      await setDoc(doc(db, "usuarios", cred.user.uid), {
        nome, email,
        criadoEm: serverTimestamp(),
      });
      await sendEmailVerification(cred.user);
      logEvento("sign_up", { method: "email" });
    } catch (e) {
      Alert.alert("Erro ao criar conta", mapFirebaseError(e));
    }
    setLoading(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.logo}>💙 Adote um Boleto</Text>
      <Text style={styles.subtitulo}>
        Cadastre-se para ajudar ou ser ajudado
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Nome completo"
        placeholderTextColor="#888"
        value={nome}
        onChangeText={setNome}
      />
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

      <View style={styles.termoRow}>
        <Text style={styles.termoTexto}>Ao criar a conta, você concorda com os </Text>
        <TouchableOpacity onPress={() => navigation.navigate("Termos")}>
          <Text style={styles.termoLink}>Termos de Uso</Text>
        </TouchableOpacity>
        <Text style={styles.termoTexto}> e a </Text>
        <TouchableOpacity onPress={() => navigation.navigate("Privacidade")}>
          <Text style={styles.termoLink}>Política de Privacidade</Text>
        </TouchableOpacity>
        <Text style={styles.termoTexto}> (LGPD).</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Criar conta</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.link}>Já tem conta? Entrar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, backgroundColor: "#0f0f1a",
    justifyContent: "center", padding: 24,
  },
  logo: {
    fontSize: 28, fontWeight: "bold",
    color: "#fff", textAlign: "center", marginBottom: 8,
  },
  subtitulo: {
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
  termoRow: {
    flexDirection: "row", flexWrap: "wrap",
    marginBottom: 12, marginTop: 4,
  },
  termoTexto: { color: "#555", fontSize: 12 },
  termoLink: { color: "#7c83fd", fontSize: 12, textDecorationLine: "underline" },
});