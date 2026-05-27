"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaChallenge, setMfaChallenge] = useState<any>(null);
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // If already at aal2, go to admin
        const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (mfaData?.currentLevel === 'aal2') {
          router.push("/admin");
          return;
        }

        // If at aal1 but MFA is enrolled, prepare for verification
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totpFactor = factors?.all.find(f => f.factor_type === 'totp' && f.status === 'verified');
        if (totpFactor) {
          // Store only the factor ID, challengeAndVerify will handle the rest
          setMfaChallenge({ factor_id: totpFactor.id });
        } else {
          router.push("/admin");
        }
      }
    };
    checkUser();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Email ou mot de passe incorrect");
      return;
    }

    if (data.session) {
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) {
        setError(factorsError.message);
        return;
      }

      const totpFactor = factors.all.find(f => f.factor_type === 'totp' && f.status === 'verified');
      
      if (totpFactor) {
        setMfaChallenge({ factor_id: totpFactor.id });
      } else {
        router.push("/admin");
      }
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!mfaChallenge?.factor_id) {
      setError("Erreur : Facteur de sécurité introuvable");
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: mfaChallenge.factor_id,
      code: totpCode.replace(/\s/g, '')
    });

    if (verifyError) {
      console.error("MFA Verify Error:", verifyError);
      setError("Code invalide ou expiré");
    } else {
      router.push("/admin");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/40 border border-text-black/10 p-8 rounded-sm shadow-xl shadow-shadow-red/10 relative"
      >
        <Link href="/" className="absolute -top-12 left-0 text-text-black/50 hover:text-primary-red flex items-center gap-2 text-sm uppercase tracking-widest font-medium transition-colors">
          <ArrowLeft size={16} /> Retour au site
        </Link>
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl text-primary-red mb-2 tracking-tighter">CAILLAT</h1>
          <p className="text-text-black/50 text-sm uppercase tracking-widest">Accès Administration</p>
        </div>

        {!mfaChallenge ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-widest text-text-black/70 mb-2 font-medium">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border border-text-black/20 rounded-sm px-4 py-3 focus:outline-none focus:border-primary-red transition-colors"
                placeholder="votre@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-text-black/70 mb-2 font-medium">Mot de passe</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border border-text-black/20 rounded-sm px-4 py-3 focus:outline-none focus:border-primary-red transition-colors"
                required
              />
            </div>

            {error && (
              <p className="text-primary-red text-sm font-medium">{error}</p>
            )}

            <button 
              type="submit"
              className="w-full bg-text-black text-white py-4 rounded-sm hover:bg-soft-black transition-all font-medium flex items-center justify-center gap-2 group"
            >
              <Lock size={16} className="group-hover:rotate-12 transition-transform" />
              Se connecter
            </button>
          </form>
        ) : (
          <form onSubmit={handleMfaVerify} className="space-y-6">
            <div className="text-center space-y-2 mb-4">
              <p className="text-sm text-text-black/60">Double authentification requise</p>
              <p className="text-xs opacity-40 italic">Entrez le code à 6 chiffres de votre application d'authentification.</p>
            </div>
            <div>
                <input 
                  type="text" 
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\s/g, ''))}
                  className="w-full bg-transparent border border-text-black/20 rounded-sm px-4 py-4 text-center text-3xl tracking-[0.5em] font-serif focus:outline-none focus:border-primary-red transition-colors"
                  placeholder="000000"
                  maxLength={6}
                  required
                  autoFocus
                />
            </div>

            {error && (
              <p className="text-primary-red text-sm font-medium text-center">{error}</p>
            )}

            <button 
              type="submit"
              className="w-full bg-text-black text-white py-4 rounded-sm hover:bg-soft-black transition-all font-medium flex items-center justify-center gap-2 group"
            >
              Vérifier le code
            </button>
            <button 
              type="button" 
              onClick={() => setMfaChallenge(null)}
              className="w-full text-xs uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
            >
              Retour à la connexion
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
