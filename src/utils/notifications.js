import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";

// Configura como as notificações são exibidas quando o app está em foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Solicita permissão e registra o push token do usuário no Firestore.
 * Chamado após login com email verificado.
 */
export async function registrarPushToken(uid) {
  try {
    // Push notifications não funcionam no emulador web nem em ambientes sem dispositivo físico
    if (Platform.OS === "web") return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return;

    // Canal Android (obrigatório para Android 8+)
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Adote um Boleto",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const pushToken = tokenData.data;

    // Salva no Firestore para que outros possam notificar este usuário
    await updateDoc(doc(db, "usuarios", uid), { pushToken });
  } catch (_) {
    // Silencia: push token é opcional, não deve impedir o uso do app
  }
}

/**
 * Helper interno — busca o pushToken de um usuário e envia uma mensagem.
 */
async function enviarPush(beneficiarioId, titulo, corpo, dados = {}) {
  const snap = await getDoc(doc(db, "usuarios", beneficiarioId));
  const pushToken = snap.data()?.pushToken;
  if (!pushToken || !pushToken.startsWith("ExponentPushToken")) return;

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
      to: pushToken,
      title: titulo,
      body: corpo,
      sound: "default",
      data: dados,
    }),
  });
}

/**
 * Envia notificação push para o dono do boleto via Expo Push Service.
 * Chamado pelo cliente do doador após uma doação bem-sucedida.
 */
export async function notificarDonoBoleto(beneficiarioId, valor) {
  try {
    if (Platform.OS === "web") return;
    await enviarPush(
      beneficiarioId,
      "💙 Nova doação recebida!",
      `Você recebeu uma contribuição de R$ ${valor.toFixed(2)} no seu boleto.`
    );
  } catch (_) {
    // Silencia: falha de notificação não deve afetar o fluxo de doação
  }
}

/**
 * Envia notificação especial quando o boleto atinge 100% da meta.
 * Chamado quando novoTotal >= valorTotal na transação de doação.
 */
export async function notificarMeta100(beneficiarioId) {
  try {
    if (Platform.OS === "web") return;
    await enviarPush(
      beneficiarioId,
      "🎉 Meta atingida!",
      "Seu boleto foi totalmente financiado! Abra o app para confirmar o recebimento.",
      { tipo: "meta100" }
    );
  } catch (_) {
    // Silencia: não deve afetar o fluxo de doação
  }
}
