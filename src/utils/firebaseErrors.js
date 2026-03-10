const ERROR_MAP = {
  // Auth
  "auth/invalid-credential":     "Email ou senha incorretos.",
  "auth/user-not-found":         "Email não encontrado.",
  "auth/wrong-password":         "Senha incorreta.",
  "auth/invalid-email":          "Email inválido.",
  "auth/email-already-in-use":   "Este email já está cadastrado.",
  "auth/weak-password":          "A senha deve ter pelo menos 6 caracteres.",
  "auth/too-many-requests":      "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  "auth/network-request-failed": "Sem conexão. Verifique sua internet.",
  "auth/user-disabled":          "Esta conta foi desativada.",
  // Firestore / Storage
  "permission-denied":           "Sem permissão para realizar esta ação.",
  "unavailable":                 "Serviço indisponível. Tente novamente mais tarde.",
  "not-found":                   "Documento não encontrado.",
  "storage/unauthorized":        "Sem permissão para enviar a imagem.",
  "storage/canceled":            "Upload cancelado.",
  "storage/unknown":             "Erro ao enviar imagem.",
};

export function mapFirebaseError(error) {
  const code = error?.code || "";
  return ERROR_MAP[code] || "Ocorreu um erro inesperado. Tente novamente.";
}
