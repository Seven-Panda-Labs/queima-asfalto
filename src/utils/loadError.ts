import i18n from '../i18n'

/**
 * O que a Firestore devolve é para quem depura: «evaluation error at L323:22
 * for 'list'», nomes de índices, códigos internos. Nada disso é para ler no
 * ecrã, e alguns desses textos expõem a forma das regras de segurança.
 *
 * Devolve a mensagem traduzida para mostrar e manda a original para a consola,
 * onde continua a um passo de distância enquanto se depura.
 */
export function reportLoadError(cause: unknown, messageKey: string, context: string): string {
  console.error(`${context}:`, cause)
  return i18n.t(messageKey)
}
