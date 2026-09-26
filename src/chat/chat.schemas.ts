import { z } from 'zod';

export const sendMessageSchema = z.object({
  // L'identite de l'auteur est fournie par l'appelant et n'est pas encore verifiee : dans la
  // cible, elle vient du jeton d'acces presente a la connexion.
  authorType: z.enum(['customer', 'advisor']),
  authorId: z.string().min(1).max(100),
  body: z.string().min(1).max(4000),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const historyQuerySchema = z.object({
  afterSeq: z.coerce.number().int().min(0).optional(),
});

export type HistoryQuery = z.infer<typeof historyQuerySchema>;
