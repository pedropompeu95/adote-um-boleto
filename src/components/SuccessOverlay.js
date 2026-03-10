import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

/**
 * Overlay animado de sucesso exibido após uma doação confirmada.
 * Faz scale-in do círculo + check, aguarda 1.8s e chama onDismiss com fade-out.
 */
export default function SuccessOverlay({ valor, onDismiss }) {
  const scale   = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const checkOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Fade-in do fundo + scale do círculo
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(scale,   { toValue: 1, tension: 55, friction: 6, useNativeDriver: true }),
    ]).start(() => {
      // 2. Aparece o check após o círculo
      Animated.timing(checkOp, { toValue: 1, duration: 200, useNativeDriver: true }).start();

      // 3. Após 1.8s, fade-out e chama onDismiss
      setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 350, useNativeDriver: true })
          .start(() => onDismiss?.());
      }, 1800);
    });
  }, []);

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <Animated.View style={[styles.circulo, { transform: [{ scale }] }]}>
        <Animated.Text style={[styles.check, { opacity: checkOp }]}>✓</Animated.Text>
      </Animated.View>
      <Text style={styles.titulo}>Obrigado! 💙</Text>
      <Text style={styles.subtitulo}>
        Você contribuiu com{"\n"}
        <Text style={styles.valor}>R$ {valor}</Text>
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0f0f1aee",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  circulo: {
    width: 120, height: 120,
    borderRadius: 60,
    backgroundColor: "#e94560",
    justifyContent: "center", alignItems: "center",
    marginBottom: 24,
    shadowColor: "#e94560",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  check: {
    color: "#fff",
    fontSize: 56,
    fontWeight: "bold",
    lineHeight: 64,
  },
  titulo: {
    color: "#fff", fontSize: 26,
    fontWeight: "bold", marginBottom: 8,
  },
  subtitulo: {
    color: "#888", fontSize: 16,
    textAlign: "center", lineHeight: 26,
  },
  valor: {
    color: "#4caf50", fontWeight: "bold", fontSize: 22,
  },
});
