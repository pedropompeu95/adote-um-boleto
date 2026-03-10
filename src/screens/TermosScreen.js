import React from "react";
import { ScrollView, Text, StyleSheet, TouchableOpacity, View } from "react-native";

export default function TermosScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      <TouchableOpacity style={styles.voltar} onPress={() => navigation.goBack()}>
        <Text style={styles.voltarText}>← Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.titulo}>Termos de Uso</Text>
      <Text style={styles.versao}>Versão 1.0 — Março de 2026</Text>

      <Secao titulo="1. Sobre o serviço">
        O aplicativo "Adote um Boleto" é uma plataforma de solidariedade que permite que pessoas
        cadastrem boletos de contas básicas (luz, água, gás, internet) para receber contribuições
        voluntárias de outros usuários. O app não processa pagamentos financeiros diretamente —
        toda transação financeira ocorre fora da plataforma.
      </Secao>

      <Secao titulo="2. Elegibilidade">
        Para usar o app, você deve ter ao menos 18 anos de idade ou ser representado por um
        responsável legal. Ao criar uma conta, você declara que as informações fornecidas são
        verdadeiras e atualizadas.
      </Secao>

      <Secao titulo="3. Responsabilidades do usuário">
        Você é responsável por:{"\n"}
        • Cadastrar apenas boletos legítimos e de sua titularidade;{"\n"}
        • Não usar a plataforma para fins fraudulentos ou enganosos;{"\n"}
        • Manter sua senha em sigilo;{"\n"}
        • Reportar imediatamente boletos suspeitos usando o botão "Denunciar".
      </Secao>

      <Secao titulo="4. Limitação de responsabilidade">
        O "Adote um Boleto" não se responsabiliza por:{"\n"}
        • Veracidade das informações cadastradas pelos usuários;{"\n"}
        • Pagamentos realizados fora da plataforma;{"\n"}
        • Danos decorrentes do uso inadequado do serviço.{"\n\n"}
        Denúncias de conteúdo fraudulento serão analisadas e podem resultar na suspensão da conta.
      </Secao>

      <Secao titulo="5. Cancelamento">
        Você pode cancelar sua conta a qualquer momento pelo app. Os dados serão mantidos por
        até 90 dias após o cancelamento conforme exigido pela legislação brasileira.
      </Secao>

      <Secao titulo="6. Alterações">
        Podemos atualizar estes Termos periodicamente. Você será notificado sobre mudanças
        significativas. O uso continuado do app após as alterações constitui aceitação dos novos Termos.
      </Secao>

      <Secao titulo="7. Contato">
        Dúvidas sobre estes Termos:{"\n"}
        contato@adoteumboleto.com.br
      </Secao>
    </ScrollView>
  );
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
