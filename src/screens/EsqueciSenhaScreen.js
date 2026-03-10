import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../config/firebase";
import { mapFirebaseError } from "../utils/firebaseErrors";

export default function EsqueciSenhaScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleEnviar() {
    if (!email) {
      Alert.alert("Atenção", "Digite seu email.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setEnviado(true);
    } catch (e) {
      Alert.alert("Erro ao enviar", mapFirebaseError(e));
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>🔑 Recuperar senha</Text>
      <Text style={styles.subtitulo}>
        Enviaremos um link de redefinição para o seu email.
      </Text>

      {enviado ? (
        <View style={styles.sucessoBox}>
          <Text style={styles.sucessoText}>
            ✅ Email enviado! Verifique sua caixa de entrada.
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.link}>Voltar para o login</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.button} onPress={handleEnviar} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Enviar link</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.link}>← Voltar</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: "#0f0f1a",
    justifyContent: "center", padding: 24,
  },
  titulo: {
    fontSize: 24, fontWeight: "bold",
    color: "#fff", textAlign: "center", marginBottom: 8,
  },
  subtitulo: {
    color: "#888", textAlign: "center",
    marginBottom: 32, fontSize: 14,
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
  sucessoBox: { alignItems: "center" },
  sucessoText: {
    color: "#4caf50", fontSize: 15,
    textAlign: "center", marginBottom: 20,
  },
});
