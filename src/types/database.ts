/**
 * Types generes depuis le schema Supabase.
 *
 * Placeholder pour l'etape 1 (aucune table n'existe encore). A partir de
 * l'etape 2, remplacer ce fichier par `npm run supabase:types` une fois les
 * migrations appliquees.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
