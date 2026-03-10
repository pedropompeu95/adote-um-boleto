import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, Alert,
} from "react-native";
import { signOut } from "firebase/auth";
import {
  collection, query, where, onSnapshot,
  doc, getDoc,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";

export default function PerfilScreen({ navigation }) {
  const [nome, setNome] = useState("");
  const [doacoes, setDoacoes] = useState([]);
  const [boletoMap, setBoletoMap] = useState({});
  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;
  const mounted = useRef(true);

  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!user) return;

    // Busca o nome do usuário no Firestore
    getDoc(doc(db, "usuarios", user.uid)).then((snap) => {
      if (mounted.current && snap.exists()) setNome(snap.data().nome || "");
    });

    const q = query(
      collection(db, "doacoes"),
      where("doadorId", "==", user.uid)
    );

    const unsub = onSnapshot(q, async (snap) => {
      if (!mounted.current) return;
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.criadoEm?.toMillis?.() || 0) - (a.criadoEm?.toMillis?.() || 0));
      setDoacoes(data);
      setLoading(false);

      // Busca detalhes dos boletos que não têm descrição salva
      const idsUnicos = [
        ...new Set(data.filter((d) => !d.boletoDescricao).map((d) => d.boletoId)),
      ];
      if (idsUnicos.length > 0) {
        const map = {};
        await Promise.all(
          idsUnicos.map(async (id) => {
            const bSnap = await getDoc(doc(db, "boletos", id));
            if (bSnap.exists()) map[id] = bSnap.data();
          })
        );
        if (mounted.current) setBoletoMap((prev) => ({ ...prev, ...map }));
      }
    });

    return unsub;
  }, []);

  const totalDoado = doacoes.reduce((acc, d) => acc + (d.valor || 0), 0);

  function getInfoBoleto(doacao) {
    if (doacao.boletoDescricao) {
      return { descricao: doacao.boletoDescricao, tipo: doacao.boletoTipo };
    }
    const boleto = boletoMap[doacao.boletoId];
    if (boleto) return { descricao: boleto.descricao, tipo: boleto.tipo };
    return { descricao: "Boleto não encontrado", tipo: null };
  }

  async function handleLogout() {
    Alert.alert("Sair", "Deseja realmente sair?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", onPress: () => signOut(auth) },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>👤 Meu Perfil</Text>

      <View style={styles.card}>
        {nome ? <Text style={styles.nome}>{nome}</Text> : null}
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValor}>{doacoes.length}</Text>
            <Text style={styles.statLabel}>Doações</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValor}>R$ {totalDoado.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total doado</Text>
          </View>
        </View>
      </View>

      <Text style={styles.secaoTitulo}>Histórico de doações</Text>

      {loading ? (
        <ActivityIndicator color="#e94560" style={{ marginTop: 20 }} />
      ) : doacoes.length === 0 ? (
        <Text style={styles.vazio}>Você ainda não fez nenhuma doação.</Text>
      ) : (
        <FlatList
          data={doacoes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const { descricao, tipo } = getInfoBoleto(item);
            return (
              <View style={styles.doacaoItem}>
                <View style={styles.doacaoInfo}>
                  {tipo ? (
                    <Text style={styles.doacaoTipo}>{tipo}</Text>
                  ) : null}
                  <Text style={styles.doacaoDescricao} numberOfLines={1}>
                    {descricao}
                  </Text>
                  <Text style={styles.doacaoData}>
                    {item.criadoEm?.toDate
                      ? item.criadoEm.toDate().toLocaleDateString("pt-BR")
                      : "—"}
                  </Text>
                </View>
                <Text style={styles.doacaoValor}>
                  R$ {item.valor?.toFixed(2)}
                </Text>
              </View>
            );
          }}
        />
      )}

      <View style={styles.sobreBox}>
        <TouchableOpacity onPress={() => navigation.navigate("Termos")}>
          <Text style={styles.sobreLink}>Termos de Uso</Text>
        </TouchableOpacity>
        <Text style={styles.sobreSep}>·</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Privacidade")}>
          <Text style={styles.sobreLink}>Política de Privacidade</Text>
        </TouchableOpacity>
        <Text style={styles.sobreVersao}>v1.0.0</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a", padding: 16 },
  titulo: {
    fontSize: 22, fontWeight: "bold",
    color: "#fff", marginTop: 50, marginBottom: 16,
  },
  card: {
    backgroundColor: "#1e1e2e", borderRadius: 14,
    padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: "#2a2a3e",
  },
  nome: {
    color: "#fff", fontSize: 18,
    fontWeight: "bold", marginBottom: 2,
  },
  email: { color: "#666", fontSize: 13, marginBottom: 16 },
  statsRow: { flexDirection: "row", justifyContent: "space-around" },
  stat: { alignItems: "center" },
  statValor: { color: "#e94560", fontSize: 20, fontWeight: "bold" },
  statLabel: { color: "#888", fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "#333" },
  secaoTitulo: {
    color: "#fff", fontSize: 15,
    fontWeight: "bold", marginBottom: 12,
  },
  vazio: { color: "#888", fontSize: 14 },
  doacaoItem: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1e1e2e", borderRadius: 10,
    padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: "#2a2a3e",
  },
  doacaoInfo: { flex: 1, marginRight: 12 },
  doacaoTipo: {
    color: "#e94560", fontSize: 10,
    fontWeight: "bold", marginBottom: 2,
    textTransform: "uppercase",
  },
  doacaoDescricao: { color: "#ccc", fontSize: 13, marginBottom: 2 },
  doacaoData: { color: "#555", fontSize: 11 },
  doacaoValor: { color: "#4caf50", fontWeight: "bold", fontSize: 15 },
  sobreBox: {
    flexDirection: "row", alignItems: "center",
    flexWrap: "wrap", marginBottom: 12, gap: 6,
  },
  sobreLink: { color: "#7c83fd", fontSize: 12, textDecorationLine: "underline" },
  sobreSep: { color: "#444", fontSize: 12 },
  sobreVersao: { color: "#333", fontSize: 11, marginLeft: "auto" },
  logoutBtn: {
    marginTop: "auto", padding: 16,
    borderRadius: 10, borderWidth: 1,
    borderColor: "#e94560", alignItems: "center",
  },
  logoutText: { color: "#e94560", fontWeight: "bold", fontSize: 15 },
});
