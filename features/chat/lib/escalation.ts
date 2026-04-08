const ESCALATION_PATTERNS = [
  /email\s+(us|contact)/i,
  /contact@onsiteclub\.ca/i,
  /can't help with that/i,
  /unable to (assist|help)/i,
];

export function shouldShowEscalation(assistantMessage: string): boolean {
  return ESCALATION_PATTERNS.some((pattern) => pattern.test(assistantMessage));
}

export function getEscalationMessage(language: 'en' | 'fr' | 'pt'): string {
  const messages = {
    en: "Need more help? Email us at contact@onsiteclub.ca and we'll get back to you within 24 hours.",
    fr: "Besoin de plus d'aide? Ecrivez-nous a contact@onsiteclub.ca et nous vous repondrons dans les 24 heures.",
    pt: 'Precisa de mais ajuda? Envie um email para contact@onsiteclub.ca e responderemos em 24 horas.',
  };
  return messages[language];
}
