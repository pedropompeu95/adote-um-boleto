import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  ScrollView, TouchableOpacity, RefreshControl, TextInput,
} from "react-native";
import {
  collection, query, orderBy, limit,
  startAfter, getDocs,
} from "firebase/firestore";
import { db } from "../config/firebase";
import BoletoCard from "../components/BoletoCard";
import SkeletonCard from "../components/SkeletonCard";

const TIPOS = ["Todos", "Luz", "Água", "Gás", "Internet", "Outro"];
const STATUS = [
  { label: "Ativos",   value: "ativo"   },
  { label: "Vencidos", value: "vencido" },
  { label: "Pagos",    value: "pago"    },
  { label: "Todos",    value: "todos"   },
];
const PAGE_SIZE = 15;

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

export default function FeedScreen({ navigation }) {
  const [allBoletos, setAllBoletos]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [lastDoc, setLastDoc]           = useState(null);
  const [hasMore, setHasMore]           = useState(true);
  const [filtroTipo, setFiltroTipo]     = useState("Todos");
  const [filtroStatus, setFiltroStatus] = useState("ativo");
  const [busca, setBusca]               = useState("");

  const buscaLower = busca.toLowerCase().trim();

  function parseDateBR(vencimento) {
    if (!vencimento) return Infinity;
    const partes = vencimento.split("/");
    if (partes.length !== 3) return Infinity;
    const [dia, mes, ano] = partes;
    return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia)).getTime();
  }

  const boletosFiltrados = allBoletos.filter((b) => {
    if (b.status === "cancelado") return false;
    const vencido = isVencido(b.vencimento) && b.status === "ativo";
    if (filtroStatus === "ativo"   && (b.status !== "ativo" || vencido)) return false;
    if (filtroStatus === "vencido" && !vencido) return false;
    if (filtroStatus === "pago"    && b.status !== "pago") return false;
    if (filtroTipo !== "Todos"     && b.tipo !== filtroTipo) return false;
    if (buscaLower && !(b.descricao || "").toLowerCase().includes(buscaLower) &&
        !(b.tipo || "").toLowerCase().includes(buscaLower)) return false;
    return true;
  }).sort((a, b) => {
    // Ativos e vencidos: mais urgente (vencimento mais próximo/recente) aparece primeiro
    if (filtroStatus === "ativo" || filtroStatus === "vencido") {
      return parseDateBR(a.vencimento) - parseDateBR(b.vencimento);
    }
    return 0;
  });

  const carregar = useCallback(async (reset = false, cursor = null) => {
    const q = (reset || !cursor)
      ? query(collection(db, "boletos"), orderBy("criadoEm", "desc"), limit(PAGE_SIZE))
      : query(collection(db, "boletos"), orderBy("criadoEm", "desc"), startAfter(cursor), limit(PAGE_SIZE));

    const snap = await getDocs(q);
    const novos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const ultimo = snap.docs[snap.docs.length - 1] || null;

    if (reset) {
      setAllBoletos(novos);
    } else {
      setAllBoletos((prev) => {
        const ids = new Set(prev.map((b) => b.id));
        return [...prev, ...novos.filter((b) => !ids.has(b.id))];
      });
    }
    setLastDoc(ultimo);
    setHasMore(snap.docs.length === PAGE_SIZE);
  }, []);

  useEffect(() => {
    carregar(true).finally(() => setLoading(false));
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await carregar(true);
    setRefreshing(false);
  }

  async function handleLoadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await carregar(false, lastDoc);
    setLoadingMore(false);
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>💙 Boletos para Adotar</Text>
        {[1, 2, 3, 4, 5].map((k) => <SkeletonCard key={k} />)}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>💙 Boletos para Adotar</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Buscar por descrição ou tipo..."
        placeholderTextColor="#555"
        value={busca}
        onChangeText={setBusca}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />

      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.filtroRow} contentContainerStyle={{ gap: 8 }}
      >
        {STATUS.map((s) => (
          <TouchableOpacity
            key={s.value}
            style={[styles.chip, filtroStatus === s.value && styles.chipAtivo]}
            onPress={() => setFiltroStatus(s.value)}
          >
            <Text style={[styles.chipText, filtroStatus === s.value && styles.chipTextAtivo]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.filtroRow} contentContainerStyle={{ gap: 8 }}
      >
        {TIPOS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.chipTipo, filtroTipo === t && styles.chipTipoAtivo]}
            onPress={() => setFiltroTipo(t)}
          >
            <Text style={[styles.chipTipoText, filtroTipo === t && styles.chipTipoTextAtivo]}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={boletosFiltrados}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#e94560"
            colors={["#e94560"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.vazio}>Nenhum boleto encontrado.</Text>
            {hasMore && (
              <Text style={styles.vazioHint}>
                Toque em "Carregar mais" para buscar mais resultados.
              </Text>
            )}
          </View>
        }
        ListFooterComponent={
          hasMore ? (
            <TouchableOpacity
              style={styles.loadMoreBtn}
              onPress={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore
                ? <ActivityIndicator color="#e94560" size="small" />
                : <Text style={styles.loadMoreText}>Carregar mais</Text>
              }
            </TouchableOpacity>
          ) : allBoletos.length > 0 ? (
            <Text style={styles.fimLista}>Todos os boletos carregados.</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <BoletoCard
            boleto={item}
            onPress={() => navigation.navigate("BoletoDetail", { boleto: item })}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a", padding: 16 },
  header: {
    fontSize: 22, fontWeight: "bold",
    color: "#fff", marginBottom: 12, marginTop: 50,
  },
  filtroRow: { marginBottom: 8, flexGrow: 0 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
    borderColor: "#333", backgroundColor: "#1e1e2e",
  },
  chipAtivo: { borderColor: "#e94560", backgroundColor: "#2a1a1f" },
  chipText: { color: "#888", fontSize: 13 },
  chipTextAtivo: { color: "#e94560", fontWeight: "bold" },
  chipTipo: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
    borderColor: "#2a2a3e", backgroundColor: "#1a1a2e",
  },
  chipTipoAtivo: { borderColor: "#7c83fd", backgroundColor: "#1e1e3a" },
  chipTipoText: { color: "#666", fontSize: 12 },
  chipTipoTextAtivo: { color: "#7c83fd", fontWeight: "bold" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyBox: { alignItems: "center", paddingTop: 40 },
  vazio: { color: "#888", fontSize: 15 },
  vazioHint: { color: "#555", fontSize: 12, marginTop: 6, textAlign: "center" },
  loadMoreBtn: {
    margin: 16, padding: 14, borderRadius: 10,
    borderWidth: 1, borderColor: "#333",
    alignItems: "center", backgroundColor: "#1e1e2e",
  },
  loadMoreText: { color: "#e94560", fontWeight: "bold", fontSize: 14 },
  fimLista: { color: "#444", fontSize: 12, textAlign: "center", marginVertical: 16 },
  searchInput: {
    backgroundColor: "#1e1e2e", color: "#fff",
    borderRadius: 10, padding: 12, fontSize: 14,
    borderWidth: 1, borderColor: "#333",
    marginBottom: 10,
  },
});
