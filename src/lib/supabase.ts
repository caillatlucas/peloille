import { createClient } from '@supabase/supabase-js';

// Récupération des variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isConfigured = supabaseUrl && supabaseAnonKey &&
  supabaseUrl !== 'https://votre-projet.supabase.co' &&
  supabaseAnonKey !== 'votre-cle-anonyme';

if (!isConfigured) {
  if (typeof window !== 'undefined') {
    console.error(
      "❌ Supabase non configuré !\n" +
      "Les variables d'environnement sont manquantes ou utilisent des valeurs par défaut.\n" +
      "Vérifiez :\n" +
      "1. Votre fichier .env.local (local)\n" +
      "2. Vos secrets GitHub Actions (production)"
    );
  }
}

// On utilise les valeurs réelles ou des chaines vides pour éviter de planter le build, 
// mais isConfigured permet de savoir si on peut réellement faire des requêtes.
export const supabase = createClient(
  supabaseUrl || 'https://votre-projet.supabase.co',
  supabaseAnonKey || 'votre-cle-anonyme'
);
