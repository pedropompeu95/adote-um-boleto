import React from "react";
import { ScrollView, Text, StyleSheet, TouchableOpacity, View } from "react-native";

export default function PrivacidadeScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      <TouchableOpacity style={styles.voltar} onPress={() => navigation.goBack()}>
        <Text style={styles.voltarText}>← Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.titulo}>Política de Privacidade</Text>
      <Text style={styles.versao}>Versão 1.0 — Março de 2026 · LGPD (Lei 13.709/2018)</Text>

      <Secao titulo="1. Dados que coletamos">
        <Bold>Conta:</Bold> nome completo e endereço de e-mail, fornecidos no cadastro.{"\n\n"}
        <Bold>Boletos:</Bold> tipo de conta (luz, água etc.), descrição, valor, vencimento e
        linha digitável. Estes dados são necessários para o funcionamento do serviço.{"\n\n"}
        <Bold>Doações:</Bold> valor doado e data, vinculados ao seu identificador de usuário.{"\n\n"}
        <Bold>Dispositivo:</Bold> token de notificação push (opcional, apenas se você autorizar).
      </Secao>

      <Secao titulo="2. Como usamos seus dados">
        • Exibir boletos no feed para potenciais doadores;{"\n"}
        • Registrar e exibir seu histórico de doações;{"\n"}
        • Enviar notificações quando alguém contribuir com seu boleto;{"\n"}
        • Prevenir fraudes e abusos na plataforma.
      </Secao>

      <Secao titulo="3. O que NÃO exibimos publicamente">
        Seu nome, e-mail e dados pessoais <Bold>nunca</Bold> são exibidos no feed.
        Apenas o tipo e valor do boleto ficam visíveis para outros usuários.
      </Secao>

      <Secao titulo="4. Compartilhamento de dados">
        Não vendemos nem compartilhamos seus dados com terceiros para fins de marketing.
        Podemos compartilhar dados:{"\n"}
        • Com autoridades legais, quando exigido por lei;{"\n"}
        • Com provedores de infraestrutura (Firebase/Google) para operação do serviço.{"\n\n"}
        O Firebase é operado pelo Google LLC e está em conformidade com o GDPR e a LGPD.
      </Secao>

      <Secao titulo="5. Seus direitos (LGPD)">
        Você tem direito a:{"\n"}
        • <Bold>Acesso</Bold>: solicitar cópia dos seus dados;{"\n"}
        • <Bold>Correção</Bold>: atualizar informações incorretas;{"\n"}
        • <Bold>Exclusão</Bold>: solicitar a remoção da sua conta e dados;{"\n"}
        • <Bold>Portabilidade</Bold>: receber seus dados em formato estruturado;{"\n"}
        • <Bold>Revogação</Bold>: retirar consentimento a qualquer momento.{"\n\n"}
        Para exercer seus direitos: privacidade@adoteumboleto.com.br
      </Secao>

      <Secao titulo="6. Retenção de dados">
        Dados de conta: mantidos enquanto a conta estiver ativa.{"\n"}
        Após exclusão da conta: removidos em até 90 dias, exceto quando a retenção for
        exigida por lei ou para prevenção de fraudes.
      </Secao>

      <Secao titulo="7. Segurança">
        Utilizamos Firebase Authentication e Firestore com regras de segurança para
        garantir que cada usuário acesse apenas seus próprios dados. Dados em trânsito
        são protegidos por TLS/HTTPS.
      </Secao>

      <Secao titulo="8. Contato">
        Encarregado de Proteção de Dados (DPO):{"\n"}
        privacidade@adoteumboleto.com.br
      </Secao>
    </ScrollView>
  );
}

function Bold({ children }) {
  return <Text style={{ fontWeight: "bold", color: "#ccc" }}>{children}</Text>;
}

function Secao({ titulo, children }) {
  return (
    <View style={styles.secao}>
      <Text style={styles.secaoTitulo}>{titulo}</Text>
      <Text style={styles.secaoTexto}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a", padding: 16 },
  voltar: { paddingTop: 50, paddingBottom: 8 },
  voltarText: { color: "#e94560", fontSize: 15 },
  titulo: {
    fontSize: 24, fontWeight: "bold",
    color: "#fff", marginBottom: 4, marginTop: 8,
  },
  versao: { color: "#555", fontSize: 12, marginBottom: 24 },
  secao: { marginBottom: 20 },
  secaoTitulo: {
    color: "#e94560", fontSize: 14,
    fontWeight: "bold", marginBottom: 8,
  },
  secaoTexto: { color: "#aaa", fontSize: 14, lineHeight: 22 },
});
