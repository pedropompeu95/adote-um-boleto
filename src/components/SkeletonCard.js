import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

export default function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.row}>
        <View style={[styles.line, { width: 80, height: 13 }]} />
        <View style={[styles.line, { width: 60, height: 18 }]} />
      </View>
      <View style={[styles.line, { width: "90%", height: 14, marginBottom: 4 }]} />
      <View style={[styles.line, { width: "60%", height: 14, marginBottom: 12 }]} />
      <View style={[styles.line, { width: "100%", height: 6, borderRadius: 4, marginBottom: 8 }]} />
      <View style={styles.row}>
        <View style={[styles.line, { width: 110, height: 12 }]} />
        <View style={[styles.line, { width: 30, height: 12 }]} />
      </View>
      <View style={[styles.line, { width: 100, height: 11, marginTop: 8 }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1e1e2e",
    borderRadius: 14, padding: 16,
    marginBottom: 12, borderWidth: 1,
    borderColor: "#2a2a3e",
  },
  row: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 10,
  },
  line: {
    backgroundColor: "#333", borderRadius: 6,
  },
});
