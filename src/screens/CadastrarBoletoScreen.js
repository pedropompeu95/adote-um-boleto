import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, Image, ActivityIndicator
} from "react-native";
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import { db, storage, auth } from "../config/firebase";
import { mapFirebaseError } from "../utils/firebaseErrors";
import { logEvento } from "../utils/analytics";

const TIPOS = ["Luz", "Água", "Gás", "Internet", "Outro"];

function mascaraData(texto) {
  const nums = texto.replace(/\D/g, "");
  if (nums.length <= 2) return nums;
  if (nums.length <= 4) return `${nums.slice(0, 2)}/${nums.slice(2)}`;
  return `${nums.slice(0, 2)}/${nums.slice(2, 4)}/${nums.slice(4, 8)}`;
}

function dataValida(vencimento) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(vencimento)) return false;
  const [dia, mes, ano] = vencimento.split("/").map(Number);
  const data = new Date(ano, mes - 1, dia);
  return (
    data.getFullYear() === ano &&
    data.getMonth() === mes - 1 &&
    data.getDate() === dia
  );
}

// Boleto bancário: 47 dígitos | Concessionária/arrecadação: 48 dígitos
function validarCodigoBoleto(codigo) {
  const nums = codigo.replace(/\D/g, "");
  return nums.length >= 44 && nums.length <= 48;
}

// Formata em grupos de 10 para leitura (ex: NNNNNNNNNN NNNNNNNNNN ...)
function mascaraBoleto(texto) {
  const nums = texto.replace(/\D/g, "").slice(0, 48);
  return nums.replace(/(\d{10})(?=\d)/g, "$1 ");
}

export default function CadastrarBoletoScreen() {
  const [descricao, setDescricao] = useState("");
  const [valorTotal, setValorTotal] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [tipo, setTipo] = useState("Luz");
  const [codigoBoleto, setCodigoBoleto] = useState("");
  const [imagem, setImagem] = useState(null);
  const [loading, setLoading] = useState(false);

  async function escolherImagem() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão necessária", "Precisamos acessar sua galeria.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) {
      setImagem(result.assets[0].uri);
    }
  }

  async function handleCadastrar() {
    if (!descricao || !valorTotal || !vencimento || !codigoBoleto) {
      Alert.alert("Atenção", "Preencha todos os campos obrigatórios.");
      return;
    }

    if (!validarCodigoBoleto(codigoBoleto)) {
      Alert.alert(
        "Código inválido",
        "A linha digitável deve ter entre 44 e 48 dígitos. Copie o código diretamente do seu banco ou da conta impressa."
      );
      return;
    }

    const valor = parseFloat(valorTotal.replace(",", "."));
    if (isNaN(valor) || valor <= 0) {
      Alert.alert("Atenção", "Digite um valor válido.");
      return;
    }

    if (!dataValida(vencimento)) {
      Alert.alert("Atenção", "Data inválida. Use o formato DD/MM/AAAA.");
      return;
    }

    setLoading(true);
    try {
      // Verifica limite de 3 boletos ativos
      const qAtivos = query(
        collection(db, "boletos"),
        where("beneficiarioId", "==", auth.currentUser.uid),
        where("status", "==", "ativo")
      );
      const snapAtivos = await getDocs(qAtivos);
      if (snapAtivos.size >= 3) {
        Alert.alert(
          "Limite atingido",
          "Você já tem 3 boletos ativos. Cancele ou aguarde o pagamento de um deles antes de cadastrar outro."
        );
        setLoading(false);
        return;
      }

      let imagemUrl = null;

      if (imagem) {
        const response = await fetch(imagem);
        const blob = await response.blob();
        const storageRef = ref(storage, `boletos/${Date.now()}.jpg`);
        await uploadBytes(storageRef, blob);
        imagemUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, "boletos"), {
        descricao,
        valorTotal: valor,
        valorArrecadado: 0,
        vencimento,
        tipo,
        codigoBoleto: codigoBoleto.replace(/\D/g, ""), // armazena só dígitos
        imagemUrl,
        beneficiarioId: auth.currentUser?.uid,
        criadoEm: serverTimestamp(),
        status: "ativo",
      });

      logEvento("boleto_cadastrado", { tipo });
      Alert.alert("✅ Sucesso!", "Seu boleto foi cadastrado e já aparece no feed.");
      setDescricao(""); setValorTotal(""); setVencimento(""); setCodigoBoleto(""); setImagem(null);
    } catch (e) {
      Alert.alert("Erro ao cadastrar", mapFirebaseError(e));
      console.error(e);
    }
    setLoading(false);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.titulo}>📋 Cadastrar Boleto</Text>
      <Text style={styles.subtitulo}>
        Seus dados pessoais ficam protegidos. Apenas o tipo e valor são exibidos.
      </Text>

      <Text style={styles.label}>Tipo de conta *</Text>
      <View style={styles.tiposRow}>
        {TIPOS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tipoBtn, tipo === t && styles.tipoBtnAtivo]}
            onPress={() => setTipo(t)}
          >
            <Text style={[styles.tipoBtnText, tipo === t && styles.tipoBtnTextAtivo]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Descrição *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Conta de luz referente ao mês de Janeiro"
        placeholderTextColor="#888"
        value={descricao}
        onChangeText={setDescricao}
        multiline
      />

      <Text style={styles.label}>Linha digitável do boleto *</Text>
      <TextInput
        style={styles.input}
        placeholder="Cole ou digite os números do boleto"
        placeholderTextColor="#888"
        value={codigoBoleto}
        onChangeText={(t) => setCodigoBoleto(mascaraBoleto(t))}
        keyboardType="numeric"
        maxLength={58}
      />
      <Text style={styles.dica}>
        Você encontra este código no boleto impresso ou no app do seu banco.
        {codigoBoleto.replace(/\D/g, "").length > 0
          ? `  (${codigoBoleto.replace(/\D/g, "").length} dígitos)`
          : ""}
      </Text>

      <Text style={styles.label}>Valor total (R$) *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: 120,00"
        placeholderTextColor="#888"
        value={valorTotal}
        onChangeText={setValorTotal}
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Data de vencimento *</Text>
      <TextInput
        style={styles.input}
        placeholder="DD/MM/AAAA"
        placeholderTextColor="#888"
        value={vencimento}
        onChangeText={(t) => setVencimento(mascaraData(t))}
        keyboardType="numeric"
        maxLength={10}
      />

      <Text style={styles.label}>Foto do boleto (opcional)</Text>
      <TouchableOpacity style={styles.uploadBtn} onPress={escolherImagem}>
        <Text style={styles.uploadBtnText}>
          {imagem ? "✅ Imagem selecionada" : "📷 Escolher imagem"}
        </Text>
      </TouchableOpacity>
      {imagem && (
        <Image source={{ uri: imagem }} style={styles.preview} resizeMode="contain" />
      )}

      <TouchableOpacity style={styles.button} onPress={handleCadastrar} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Cadastrar Boleto</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a", padding: 16 },
  titulo: {
    fontSize: 22, fontWeight: "bold",
    color: "#fff", marginTop: 50, marginBottom: 6,
  },
  subtitulo: { color: "#888", fontSize: 13, marginBottom: 24 },
  label: { color: "#aaa", fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: "#1e1e2e", color: "#fff",
    borderRadius: 10, padding: 14, fontSize: 15,
    borderWidth: 1, borderColor: "#333",
  },
  tiposRow: {
    flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8,
  },
  tipoBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
    borderColor: "#333", backgroundColor: "#1e1e2e",
  },
  tipoBtnAtivo: { borderColor: "#e94560", backgroundColor: "#2a1a1f" },
  tipoBtnText: { color: "#888", fontSize: 13 },
  tipoBtnTextAtivo: { color: "#e94560", fontWeight: "bold" },
  uploadBtn: {
    backgroundColor: "#1e1e2e", borderRadius: 10,
    padding: 14, alignItems: "center",
    borderWidth: 1, borderColor: "#333", borderStyle: "dashed",
  },
  dica: { color: "#555", fontSize: 11, marginTop: 4, lineHeight: 16 },
  uploadBtnText: { color: "#888", fontSize: 14 },
  preview: {
    width: "100%", height: 180,
    borderRadius: 10, marginTop: 10,
  },
  button: {
    backgroundColor: "#e94560", borderRadius: 10,
    padding: 16, alignItems: "center", marginTop: 24,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});