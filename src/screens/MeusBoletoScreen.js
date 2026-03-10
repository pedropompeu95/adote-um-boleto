import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity, Alert,
} from "react-native";
import {
  collection, query, where, onSnapshot,
  doc, updateDoc,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";

function isVencido(vencimento) {
  if (!vencimento) return false;
  const partes = vencimento.split("/");
  if (partes.length !== 3) return false;
  const [dia, mes, ano] = partes;
  const data = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return data < hoje;
}

function getStatusInfo(boleto) {
  if (boleto.status === "pago") return { label: "Pago", cor: "#4caf50" };
  if (boleto.status === "cancelado") return { label: "Cancelado", cor: "#555" };
  if (isVencido(boleto.vencimento)) return { label: "Vencido", cor: "#ff9800" };
  return { label: "Ativo", cor: "#e94560" };
}

export default function MeusBoletoScreen({ navigation }) {
  const [boletos, setBoletos] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "boletos"),
      where("beneficiarioId", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.criadoEm?.toMillis?.() || 0) - (a.criadoEm?.toMillis?.() || 0));
      setBoletos(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  async function handleConfirmarRecebimento(boleto) {
    Alert.alert(
      "Confirmar recebimento",
      `Confirmar que você recebeu as doações de R$ ${boleto.valorArrecadado?.toFixed(2)} e pagou o boleto?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "boletos", boleto.id), { status: "pago" });
            } catch (e) {
              Alert.alert("Erro", "Não foi possível confirmar.");
            }
          },
        },
      ]
    );
  }

  async function handleCancelar(boleto) {
    Alert.alert(
      "Cancelar boleto",
      "Deseja cancelar este boleto? Ele será removido do feed.",
      [
        { text: "Não", style: "cancel" },
        {
          text: "Sim, cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "boletos", boleto.id), { status: "cancelado" });
            } catch (e) {
              Alert.alert("Erro", "Não foi possível cancelar o boleto.");
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>📋 Meus Boletos</Text>

      {boletos.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.vazio}>Você ainda não cadastrou nenhum boleto.</Text>
        </View>
      ) : (
        <FlatList
          data={boletos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => {
            const { label, cor } = getStatusInfo(item);
            const progresso = item.valorTotal > 0
              ? item.valorArrecadado / item.valorTotal
              : 0;
            const percentual = Math.min(Math.round(progresso * 100), 100);

            return (
              <TouchableOpacity
                style={[styles.card, item.status === "cancelado" && styles.cardCancelado]}
                onPress={() =>
                  item.status !== "cancelado" &&
                  navigation.navigate("BoletoDetail", { boleto: item })
                }
                activeOpacity={item.status === "cancelado" ? 1 : 0.7}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTipo}>{item.tipo}</Text>
                  <View style={[styles.badge, { backgroundColor: cor + "22", borderColor: cor }]}>
                    <Text style={[styles.badgeText, { color: cor }]}>{label}</Text>
                  </View>
                </View>

                <Text style={styles.cardDescricao} numberOfLines={2}>
                  {item.descricao}
                </Text>

                <View style={styles.progressoBg}>
                  <View style={[styles.progressoFill, { width: `${percentual}%`, backgroundColor: cor }]} />
                </View>

                <View style={styles.valoresRow}>
                  <Text style={styles.valorLabel}>
                    R$ {item.valorArrecadado?.toFixed(2)} / R$ {item.valorTotal?.toFixed(2)}
                  </Text>
                  <Text style={[styles.percentualText, { color: cor }]}>{percentual}%</Text>
                </View>

                <Text style={styles.vencimento}>Vence em: {item.vencimento}</Text>

                {item.status === "ativo" && (
                  <View style={styles.acoesRow}>
                    <TouchableOpacity
                      style={styles.editarBtn}
                      onPress={() => navigation.navigate("EditBoleto", { boleto: item })}
                    >
                      <Text style={styles.editarText}>✏️ Editar</Text>
                    </TouchableOpacity>
                    {item.valorArrecadado > 0 ? (
                      <TouchableOpacity
                        style={styles.confirmarBtn}
                        onPress={() => handleConfirmarRecebimento(item)}
                      >
                        <Text style={styles.confirmarText}>✅ Recebi</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.cancelarBtn}
                        onPress={() => handleCancelar(item)}
                      >
                        <Text style={styles.cancelarText}>Cancelar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a", padding: 16 },
  titulo: {
    fontSize: 22, fontWeight: "bold",
    color: "#fff", marginTop: 50, marginBottom: 16,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  vazio: { color: "#888", fontSize: 15 },
  card: {
    backgroundColor: "#1e1e2e", borderRadius: 14,
    padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: "#2a2a3e",
  },
  cardCancelado: { opacity: 0.5 },
  cardHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 6,
  },
  cardTipo: { color: "#aaa", fontSize: 13, fontWeight: "600" },
  badge: {
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: "bold" },
  cardDescricao: { color: "#ccc", fontSize: 14, marginBottom: 10 },
  progressoBg: {
    height: 6, backgroundColor: "#333",
    borderRadius: 4, marginBottom: 6,
  },
  progressoFill: { height: 6, borderRadius: 4 },
  valoresRow: {
    flexDirection: "row", justifyContent: "space-between", marginBottom: 4,
  },
  valorLabel: { color: "#888", fontSize: 12 },
  percentualText: { fontSize: 12, fontWeight: "bold" },
  vencimento: { color: "#555", fontSize: 11, marginTop: 4 },
  acoesRow: {
    flexDirection: "row", gap: 8, marginTop: 12,
  },
  editarBtn: {
    flex: 1, padding: 10, borderRadius: 8,
    borderWidth: 1, borderColor: "#e94560",
    alignItems: "center",
  },
  editarText: { color: "#e94560", fontSize: 13, fontWeight: "bold" },
  cancelarBtn: {
    flex: 1, padding: 10, borderRadius: 8,
    borderWidth: 1, borderColor: "#444",
    alignItems: "center",
  },
  cancelarText: { color: "#888", fontSize: 13 },
  confirmarBtn: {
    flex: 1, padding: 10, borderRadius: 8,
    borderWidth: 1, borderColor: "#4caf50",
    alignItems: "center", backgroundColor: "#0d1f0d",
  },
  confirmarText: { color: "#4caf50", fontSize: 13, fontWeight: "bold" },
});
