import type { QuickReply } from '../types';

export const QUICK_REPLIES: QuickReply[] = [
  {
    label: { en: 'Shipping info', fr: 'Info livraison', pt: 'Info envio' },
    message: {
      en: 'How much is shipping and how long does it take?',
      fr: 'Combien coute la livraison et combien de temps ca prend?',
      pt: 'Quanto custa o frete e quanto tempo demora?',
    },
  },
  {
    label: { en: 'Size help', fr: 'Guide tailles', pt: 'Guia tamanhos' },
    message: {
      en: 'I need help choosing the right size',
      fr: "J'ai besoin d'aide pour choisir la bonne taille",
      pt: 'Preciso de ajuda para escolher o tamanho certo',
    },
  },
  {
    label: { en: 'Return policy', fr: 'Retours', pt: 'Devoluções' },
    message: {
      en: 'What is your return policy?',
      fr: 'Quelle est votre politique de retour?',
      pt: 'Qual e a politica de devolucao?',
    },
  },
  {
    label: { en: 'Track order', fr: 'Suivre commande', pt: 'Rastrear pedido' },
    message: {
      en: 'How can I track my order?',
      fr: 'Comment puis-je suivre ma commande?',
      pt: 'Como posso rastrear meu pedido?',
    },
  },
  {
    label: { en: 'Products & prices', fr: 'Produits & prix', pt: 'Produtos & precos' },
    message: {
      en: 'What products do you sell and what are the prices?',
      fr: 'Quels produits vendez-vous et quels sont les prix?',
      pt: 'Quais produtos voces vendem e quais sao os precos?',
    },
  },
];
