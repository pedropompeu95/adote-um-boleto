import React, { useRef, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Dimensions,
} from "react-native";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../config/firebase";
import { logEvento } from "../utils/analytics";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    emoji: "💙",
    titulo: "Bem-vindo ao\nAdote um Boleto",
    descricao:
      "Uma plataforma de solidariedade onde qualquer pessoa pode pedir ajuda para pagar suas contas básicas — e qualquer um pode contribuir com o que puder.",
  },
  {
    id: "2",
    emoji: "🤝",
    titulo: "Como funciona?",
    descricao:
      "1. Cadastre seu boleto (luz, água, gás…)\n2. Ele aparece no feed para os doadores\n3. As pessoas contribuem com qualquer valor\n4. Quando a meta é atingida, o boleto é marcado como pago.",
  },
  {
    id: "3",
    emoji: "🔒",
    titulo: "Seus dados\nestão protegidos",
    descricao:
      "Apenas o tipo e o valor do boleto ficam visíveis no feed. Seus dados pessoais — nome, email e informações da conta — nunca são exibidos publicamente.",
  },
];

export default function OnboardingScreen({ onConcluir }) {
  const [indice, setIndice] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const ref = useRef(null);

  function irParaProximo() {
    if (indice < SLIDES.length - 1) {
      ref.current?.scrollToIndex({ index: indice + 1, animated: true });
    }
  }

  async function concluir() {
    setSalvando(true);
    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        await updateDoc(doc(db, "usuarios", uid), { onboardingConcluido: true });
      }
    } catch (_) {
      // Silencia: se falhar, o onboarding será exibido novamente no próximo login
    }
    logEvento("onboarding_concluido");
    onConcluir();
  }

  const ultimo = indice === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.pularBtn}
        onPress={concluir}
        disabled={ultimo || salvando}
      >
        {!ultimo && <Text style={styles.pularText}>Pular</Text>}
      </TouchableOpacity>

      <FlatList
        ref={ref}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndice(newIndex);
        }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.titulo}>{item.titulo}</Text>
            <Text style={styles.descricao}>{item.descricao}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === indice && styles.dotAtivo]}
          />
        ))}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={ultimo ? concluir : irParaProximo}
        disabled={salvando}
      >
        <Text style={styles.buttonText}>
          {ultimo ? (salvando ? "Carregando..." : "Começar") : "Próximo →"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: "#0f0f1a",
    paddingBottom: 40,
  },
  pularBtn: {
    alignSelf: "flex-end",
    padding: 20, paddingTop: 50,
    minHeight: 70,
  },
  pularText: { color: "#555", fontSize: 14 },
  slide: {
    width,
    paddingHorizontal: 32,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    paddingBottom: 40,
  },
  emoji: { fontSize: 72, marginBottom: 24 },
  titulo: {
    fontSize: 28, fontWeight: "bold",
    color: "#fff", textAlign: "center",
    marginBottom: 20, lineHeight: 36,
  },
  descricao: {
    color: "#888", fontSize: 15,
    textAlign: "center", lineHeight: 24,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 32, gap: 8,
  },
  dot: {
    width: 8, height: 8,
    borderRadius: 4, backgroundColor: "#333",
  },
  dotAtivo: { backgroundColor: "#e94560", width: 24 },
  button: {
    backgroundColor: "#e94560", borderRadius: 10,
    padding: 16, marginHorizontal: 24,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
