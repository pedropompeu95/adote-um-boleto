import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, ScrollView, Image, Clipboard, Share, ActivityIndicator
} from "react-native";
import {
  doc, runTransaction, addDoc, collection, serverTimestamp,
  getDoc, updateDoc,
} from "firebase/firestore";
import { db, auth } from "../config/firebase";
import { mapFirebaseError } from "../utils/firebaseErrors";
import { notificarDonoBoleto } from "../utils/notifications";
import { logEvento } from "../utils/analytics";

export default function BoletoDetailScreen({ route, navigation }) {
  // Suporta navegação normal ({ boleto }) e deep links ({ boletoId })
  const [boleto, setBoleto] = useState(route.params?.boleto || null);
  const [loadingBoleto, setLoadingBoleto] = useState(!route.params?.boleto);
  const [valor, setValor] = useState("");
  const [loading, setLoading] = useState(false);

  const isOwner = auth.currentUser?.uid === boleto?.beneficiarioId;

  // Carrega boleto pelo ID quando vem de deep link
  useEffect(() => {
    if (boleto) return;
    const boletoId = route.params?.boletoId;
    if (!boletoId) { navigation.goBack(); return; }
    getDoc(doc(db, "boletos", boletoId)).then((snap) => {
      if (snap.exists()) {
        setBoleto({ id: snap.id, ...snap.data() });
      } else {
        Alert.alert("Boleto não encontrado", "Este link pode ter expirado.");
        navigation.goBack();
      }
    }).catch(() => {
      Alert.alert("Erro", "Não foi possível carregar o boleto.");
      navigation.goBack();
    }).finally(() => setLoadingBoleto(false));
  }, []);

  if (loadingBoleto) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  const progresso = (boleto?.valorArrecadado || 0) / (boleto?.valorTotal || 1);
  const percentual = Math.min(Math.round(progresso * 100), 100);
  const restante = (boleto?.valorTotal || 0) - (boleto?.valorArrecadado || 0);

  const MOTIVOS_DENUNCIA = [
    "Informações falsas ou enganosas",
    "Boleto suspeito / possível fraude",
    "Conteúdo inadequado",
    "Outro motivo",
  ];

  function handleDenunciar() {
    Alert.alert(
      "⚠️ Denunciar boleto",
      "Qual o motivo da denúncia?",
      [
        ...MOTIVOS_DENUNCIA.map((motivo) => ({
          text: motivo,
          onPress: () => confirmarDenuncia(motivo),
        })),
        { text: "Cancelar", style: "cancel" },
      ]
    );
  }

  async function handleCompartilhar() {
    try {
      const msg =
        `💙 Adote um Boleto\n\n` +
        `Conta de ${boleto.tipo} — R$ ${boleto.valorTotal?.toFixed(2)}\n` +
        `Já arrecadado: R$ ${boleto.valorArrecadado?.toFixed(2)} (${percentual}%)\n\n` +
        `Se puder ajudar com qualquer valor, abra o app "Adote um Boleto" e busque este boleto:\n` +
        `adoteumboleto://boleto/${boleto.id}`;
      await Share.share({ message: msg, title: "Adote um Boleto" });
      logEvento("boleto_compartilhado", { tipo: boleto.tipo });
    } catch (_) {}
  }

  async function handleConfirmarRecebimento() {
    Alert.alert(
      "Confirmar recebimento",
      "Confirmar que você recebeu as doações e o boleto foi pago?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "boletos", boleto.id), { status: "pago" });
              Alert.alert("✅ Confirmado!", "Obrigado por manter o app atualizado.");
              navigation.goBack();
            } catch (e) {
              Alert.alert("Erro", mapFirebaseError(e));
            }
          },
        },
      ]
    );
  }

  async function confirmarDenuncia(motivo) {
    try {
      await addDoc(collection(db, "denuncias"), {
        boletoId: boleto.id,
        denuncianteId: auth.currentUser?.uid,
        motivo,
        criadoEm: serverTimestamp(),
      });
      Alert.alert("Denúncia enviada", "Obrigado por contribuir com a segurança da plataforma.");
    } catch (e) {
      Alert.alert("Erro", "Não foi possível enviar a denúncia.");
    }
  }

  async function handleDoacaoSimulada() {
    const v = parseFloat(valor.replace(",", "."));
    if (!v || v <= 0) {
      Alert.alert("Atenção", "Digite um valor válido.");
      return;
    }
    if (v > restante) {
      Alert.alert("Atenção", `O valor máximo é R$ ${restante.toFixed(2)}`);
      return;
    }

    setLoading(true);
    try {
      const boletoRef = doc(db, "boletos", boleto.id);
      const doacaoRef = doc(collection(db, "doacoes"));

      await runTransaction(db, async (transaction) => {
        const boletoSnap = await transaction.get(boletoRef);
        if (!boletoSnap.exists()) throw new Error("Boleto não encontrado.");

        const atual = boletoSnap.data();
        const novoTotal = (atual.valorArrecadado || 0) + v;
        const update = {
          valorArrecadado: novoTotal,
          numDoacoes: (atual.numDoacoes || 0) + 1,
        };
        if (novoTotal >= atual.valorTotal) {
          update.status = "pago";
        }

        transaction.update(boletoRef, update);
        transaction.set(doacaoRef, {
          boletoId: boleto.id,
          boletoDescricao: boleto.descricao,
          boletoTipo: boleto.tipo,
          doadorId: auth.currentUser?.uid || "anonimo",
          valor: v,
          criadoEm: serverTimestamp(),
        });
      });

      // Notifica o dono do boleto em background (não bloqueia)
      notificarDonoBoleto(boleto.beneficiarioId, v);

      logEvento("doacao_realizada", { valor: v, tipo: boleto.tipo });
      Alert.alert("✅ Doação registrada!", `Você contribuiu com R$ ${v.toFixed(2)}. Obrigado!`);
      navigation.goBack();
    } catch (e) {
      Alert.alert("Erro ao registrar doação", mapFirebaseError(e));
    }
    setLoading(false);
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.voltarText}>← Voltar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleCompartilhar} style={styles.shareBtn}>
          <Text style={styles.shareText}>Compartilhar 🔗</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.tipo}>{boleto.tipo}</Text>
        <Text style={styles.descricao}>{boleto.descricao}</Text>

        <View style={styles.valorRow}>
          <Text style={styles.label}>Valor total</Text>
          <Text style={styles.valorTotal}>R$ {boleto.valorTotal?.toFixed(2)}</Text>
        </View>
        <View style={styles.valorRow}>
          <Text style={styles.label}>Já arrecadado</Text>
          <Text style={styles.valorArrecadado}>R$ {boleto.valorArrecadado?.toFixed(2)}</Text>
        </View>
        <View style={styles.valorRow}>
          <Text style={styles.label}>Ainda faltam</Text>
          <Text style={styles.valorRestante}>R$ {restante.toFixed(2)}</Text>
        </View>

        <View style={styles.progressoBg}>
          <View style={[styles.progressoFill, { width: `${percentual}%` }]} />
        </View>
        <Text style={styles.percentualText}>{percentual}% financiado</Text>

        <Text style={styles.vencimento}>📅 Vencimento: {boleto.vencimento}</Text>

        {boleto.codigoBoleto ? (
          <TouchableOpacity
            style={styles.codigoBox}
            onPress={() => {
              Clipboard.setString(boleto.codigoBoleto);
              Alert.alert("Copiado!", "Linha digitável copiada para a área de transferência.");
            }}
          >
            <Text style={styles.codigoLabel}>📋 Linha digitável (toque para copiar)</Text>
            <Text style={styles.codigoValor} numberOfLines={2}>
              {boleto.codigoBoleto.replace(/(\d{10})(?=\d)/g, "$1 ")}
            </Text>
          </TouchableOpacity>
        ) : null}

        {boleto.imagemUrl ? (
          <Image source={{ uri: boleto.imagemUrl }} style={styles.imagem} resizeMode="contain" />
        ) : null}
      </View>

      {isOwner ? (
        // Vista do dono do boleto
        <View style={styles.doacaoBox}>
          <Text style={styles.doacaoTitulo}>📋 Seu boleto</Text>
          <Text style={styles.doacaoSubtitulo}>
            {boleto.status === "pago"
              ? "Este boleto foi marcado como pago. Obrigado a todos que ajudaram!"
              : boleto.valorArrecadado > 0
              ? `Você recebeu R$ ${boleto.valorArrecadado?.toFixed(2)} em doações. Se já pagou o boleto, confirme abaixo.`
              : "Compartilhe este boleto para que mais pessoas possam ajudar."}
          </Text>
          {boleto.status !== "pago" && boleto.status !== "cancelado" && boleto.valorArrecadado > 0 && (
            <TouchableOpacity style={styles.confirmarBtn} onPress={handleConfirmarRecebimento}>
              <Text style={styles.confirmarText}>✅ Confirmar que recebi e paguei</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        // Vista do doador
        <View style={styles.doacaoBox}>
          <Text style={styles.doacaoTitulo}>💙 Quero ajudar</Text>
          <Text style={styles.doacaoSubtitulo}>
            Qualquer valor ajuda. Você pode contribuir com o que puder.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Digite o valor (ex: 10,00)"
            placeholderTextColor="#888"
            value={valor}
            onChangeText={setValor}
            keyboardType="decimal-pad"
          />

          <View style={styles.sugestoesRow}>
            {["10", "25", "50"].map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.sugestao}
                onPress={() => setValor(s)}
              >
                <Text style={styles.sugestaoText}>R$ {s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleDoacaoSimulada}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Registrando..." : "Confirmar Doação"}
            </Text>
          </TouchableOpacity>

        </View>
      )}

      {!isOwner && (
        <TouchableOpacity style={styles.denunciarBtn} onPress={handleDenunciar}>
          <Text style={styles.denunciarText}>⚑ Denunciar este boleto</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  loadingContainer: { flex: 1, backgroundColor: "#0f0f1a", justifyContent: "center", alignItems: "center" },
  topBar: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", padding: 16, paddingTop: 50,
  },
  voltarText: { color: "#e94560", fontSize: 15 },
  shareBtn: { padding: 8 },
  shareText: { color: "#7c83fd", fontSize: 13, fontWeight: "600" },
  confirmarBtn: {
    backgroundColor: "#1a3a1a", borderRadius: 10,
    padding: 14, alignItems: "center", marginTop: 8,
    borderWidth: 1, borderColor: "#4caf50",
  },
  confirmarText: { color: "#4caf50", fontWeight: "bold", fontSize: 14 },
  card: {
    backgroundColor: "#1e1e2e", margin: 16,
    borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: "#2a2a3e",
  },
  tipo: {
    color: "#e94560", fontSize: 13,
    fontWeight: "600", marginBottom: 6,
  },
  descricao: { color: "#fff", fontSize: 17, fontWeight: "bold", marginBottom: 16 },
  valorRow: {
    flexDirection: "row", justifyContent: "space-between",
    marginBottom: 6,
  },
  label: { color: "#888", fontSize: 14 },
  valorTotal: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  valorArrecadado: { color: "#4caf50", fontSize: 14, fontWeight: "bold" },
  valorRestante: { color: "#e94560", fontSize: 14, fontWeight: "bold" },
  progressoBg: {
    height: 8, backgroundColor: "#333",
    borderRadius: 4, marginVertical: 12,
  },
  progressoFill: {
    height: 8, backgroundColor: "#e94560", borderRadius: 4,
  },
  percentualText: { color: "#888", fontSize: 12, textAlign: "right" },
  vencimento: { color: "#666", fontSize: 13, marginTop: 8 },
  codigoBox: {
    marginTop: 12, backgroundColor: "#0f0f1a",
    borderRadius: 8, padding: 12,
    borderWidth: 1, borderColor: "#333",
  },
  codigoLabel: { color: "#555", fontSize: 11, marginBottom: 6 },
  codigoValor: {
    color: "#aaa", fontSize: 12,
    fontFamily: "monospace", letterSpacing: 0.5,
  },
  imagem: {
    width: "100%", height: 200,
    borderRadius: 8, marginTop: 12,
  },
  doacaoBox: {
    margin: 16, backgroundColor: "#1e1e2e",
    borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: "#2a2a3e",
  },
  doacaoTitulo: {
    color: "#fff", fontSize: 18,
    fontWeight: "bold", marginBottom: 4,
  },
  doacaoSubtitulo: { color: "#888", fontSize: 13, marginBottom: 16 },
  input: {
    backgroundColor: "#0f0f1a", color: "#fff",
    borderRadius: 10, padding: 14,
    marginBottom: 12, fontSize: 16,
    borderWidth: 1, borderColor: "#333",
  },
  sugestoesRow: {
    flexDirection: "row", gap: 10, marginBottom: 16,
  },
  sugestao: {
    flex: 1, padding: 10, borderRadius: 8,
    borderWidth: 1, borderColor: "#333",
    alignItems: "center", backgroundColor: "#0f0f1a",
  },
  sugestaoText: { color: "#e94560", fontWeight: "bold" },
  button: {
    backgroundColor: "#e94560", borderRadius: 10,
    padding: 16, alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  denunciarBtn: {
    margin: 16, marginTop: 4, padding: 12,
    alignItems: "center",
  },
  denunciarText: { color: "#444", fontSize: 12 },
});