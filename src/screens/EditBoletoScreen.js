import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, ActivityIndicator,
} from "react-native";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { mapFirebaseError } from "../utils/firebaseErrors";

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

export default function EditBoletoScreen({ route, navigation }) {
  const { boleto } = route.params;

  const [descricao, setDescricao] = useState(boleto.descricao || "");
  const [valorTotal, setValorTotal] = useState(
    boleto.valorTotal ? String(boleto.valorTotal).replace(".", ",") : ""
  );
  const [vencimento, setVencimento] = useState(boleto.vencimento || "");
  const [tipo, setTipo] = useState(boleto.tipo || "Outro");
  const [loading, setLoading] = useState(false);

  const temDoacoes = (boleto.valorArrecadado || 0) > 0;

  async function handleSalvar() {
    if (!descricao || !valorTotal || !vencimento) {
      Alert.alert("Atenção", "Preencha todos os campos obrigatórios.");
      return;
    }

    const valor = parseFloat(valorTotal.replace(",", "."));
    if (isNaN(valor) || valor <= 0) {
      Alert.alert("Atenção", "Digite um valor válido.");
      return;
    }

    if (temDoacoes && valor < boleto.valorArrecadado) {
      Alert.alert(
        "Atenção",
        `O valor total não pode ser menor que o já arrecadado (R$ ${boleto.valorArrecadado.toFixed(2)}).`
      );
      return;
    }

    if (!dataValida(vencimento)) {
      Alert.alert("Atenção", "Data inválida. Use o formato DD/MM/AAAA.");
      return;
    }

    setLoading(true);
    try {
      const update = {
        descricao,
        vencimento,
        tipo,
        atualizadoEm: serverTimestamp(),
      };

      if (!temDoacoes) {
        update.valorTotal = valor;
      }

      await updateDoc(doc(db, "boletos", boleto.id), update);
      Alert.alert("✅ Atualizado!", "Seu boleto foi atualizado com sucesso.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Erro ao salvar", mapFirebaseError(e));
    }
    setLoading(false);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <TouchableOpacity style={styles.voltar} onPress={() => navigation.goBack()}>
        <Text style={styles.voltarText}>← Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.titulo}>✏️ Editar Boleto</Text>

      {temDoacoes && (
        <View style={styles.avisoBox}>
          <Text style={styles.avisoText}>
            ℹ️ Este boleto já recebeu doações. O valor total não pode ser alterado.
          </Text>
        </View>
      )}

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

      <Text style={styles.label}>
        Valor total (R$) *{temDoacoes ? " — bloqueado" : ""}
      </Text>
      <TextInput
        style={[styles.input, temDoacoes && styles.inputBloqueado]}
        placeholder="Ex: 120,00"
        placeholderTextColor="#888"
        value={valorTotal}
        onChangeText={setValorTotal}
        keyboardType="decimal-pad"
        editable={!temDoacoes}
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

      <TouchableOpacity style={styles.button} onPress={handleSalvar} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Salvar alterações</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a", padding: 16 },
  voltar: { paddingTop: 50, paddingBottom: 8 },
  voltarText: { color: "#e94560", fontSize: 15 },
  titulo: {
    fontSize: 22, fontWeight: "bold",
    color: "#fff", marginBottom: 6, marginTop: 8,
  },
  avisoBox: {
    backgroundColor: "#1a1a2e", borderRadius: 10,
    padding: 12, marginBottom: 8, marginTop: 8,
    borderWidth: 1, borderColor: "#2a2a5e",
  },
  avisoText: { color: "#7c83fd", fontSize: 13 },
  label: { color: "#aaa", fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: "#1e1e2e", color: "#fff",
    borderRadius: 10, padding: 14, fontSize: 15,
    borderWidth: 1, borderColor: "#333",
  },
  inputBloqueado: {
    opacity: 0.5, borderColor: "#222",
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
  button: {
    backgroundColor: "#e94560", borderRadius: 10,
    padding: 16, alignItems: "center", marginTop: 24,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
