import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

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

export default function BoletoCard({ boleto, onPress }) {
  const progresso = boleto.valorTotal > 0
    ? boleto.valorArrecadado / boleto.valorTotal
    : 0;
  const percentual = Math.min(Math.round(progresso * 100), 100);

  const pago = boleto.status === "pago";
  const vencido = !pago && isVencido(boleto.vencimento);

  const corBarra = pago ? "#4caf50" : vencido ? "#ff9800" : "#e94560";
  const borderColor = vencido ? "#ff980044" : pago ? "#4caf5044" : "#2a2a3e";

  return (
    <TouchableOpacity style={[styles.card, { borderColor }]} onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.tipo}>{getTipoEmoji(boleto.tipo)} {boleto.tipo}</Text>
        <View style={styles.badgesRow}>
          {vencido && (
            <View style={styles.badgeVencido}>
              <Text style={styles.badgeVencidoText}>Vencido</Text>
            </View>
          )}
          {pago && (
            <View style={styles.badgePago}>
              <Text style={styles.badgePagoText}>Pago ✓</Text>
            </View>
          )}
          <Text style={styles.valor}>R$ {boleto.valorTotal?.toFixed(2)}</Text>
        </View>
      </View>

      <Text style={styles.descricao} numberOfLines={2}>{boleto.descricao}</Text>

      <View style={styles.progressoBg}>
        <View style={[styles.progressoFill, { width: `${percentual}%`, backgroundColor: corBarra }]} />
      </View>

      <View style={styles.row}>
        <Text style={styles.meta}>
          R$ {boleto.valorArrecadado?.toFixed(2)} arrecadados
        </Text>
        <Text style={[styles.percentual, { color: corBarra }]}>{percentual}%</Text>
      </View>

      <View style={styles.rodape}>
        <Text style={[styles.vencimento, vencido && styles.vencimentoAtrasado]}>
          {vencido ? "⚠️ Venceu em: " : "Vence em: "}{boleto.vencimento}
        </Text>
        {boleto.numDoacoes > 0 && (
          <Text style={styles.doacoes}>
            👤 {boleto.numDoacoes} {boleto.numDoacoes === 1 ? "pessoa ajudou" : "pessoas ajudaram"}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function getTipoEmoji(tipo) {
  const map = { "Luz": "⚡", "Água": "💧", "Gás": "🔥", "Internet": "📡", "Outro": "📄" };
  return map[tipo] || "📄";
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1e1e2e",
    borderRadius: 14, padding: 16,
    marginBottom: 12, borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  badgesRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
  },
  tipo: { color: "#aaa", fontSize: 13, fontWeight: "600" },
  valor: { color: "#e94560", fontSize: 18, fontWeight: "bold" },
  descricao: { color: "#ccc", fontSize: 14, marginBottom: 10 },
  progressoBg: {
    height: 6, backgroundColor: "#333",
    borderRadius: 4, marginBottom: 6,
  },
  progressoFill: { height: 6, borderRadius: 4 },
  meta: { color: "#888", fontSize: 12 },
  percentual: { fontSize: 12, fontWeight: "bold" },
  rodape: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  vencimento: { color: "#555", fontSize: 11 },
  vencimentoAtrasado: { color: "#ff9800" },
  doacoes: { color: "#555", fontSize: 11 },
  badgeVencido: {
    backgroundColor: "#ff980022", borderWidth: 1,
    borderColor: "#ff9800", borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  badgeVencidoText: { color: "#ff9800", fontSize: 10, fontWeight: "bold" },
  badgePago: {
    backgroundColor: "#4caf5022", borderWidth: 1,
    borderColor: "#4caf50", borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  badgePagoText: { color: "#4caf50", fontSize: 10, fontWeight: "bold" },
});
