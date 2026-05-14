import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ShieldCheck, Loader2, Lock, Star } from "lucide-react";

const steps = [
  { id: 1, label: "A verificar utilizador real...", duration: 2200 },
  { id: 2, label: "A validar acesso exclusivo...", duration: 1800 },
  { id: 3, label: "A preparar descontos e produtos...", duration: 2000 },
];

export default function Presell() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  // Forward all URL params to the store
  const params = window.location.search;

  useEffect(() => {
    let stepIdx = 0;

    function runStep(idx: number) {
      if (idx >= steps.length) {
        setDone(true);
        return;
      }
      setCurrentStep(idx);
      setTimeout(() => {
        setCompletedSteps(prev => [...prev, idx]);
        runStep(idx + 1);
      }, steps[idx].duration);
    }

    runStep(stepIdx);
  }, []);

  const progress = done
    ? 100
    : completedSteps.length === 0
    ? 12
    : Math.round((completedSteps.length / steps.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] to-[#0d1f3c] flex flex-col items-center justify-between px-4 py-8">

      {/* Top badge */}
      <div className="flex flex-col items-center gap-3 w-full max-w-sm">
        <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-white text-xs font-semibold tracking-wide">
          <Lock className="w-3 h-3 text-green-400" />
          Área de acesso restrito
        </div>

        {/* Logo */}
        <div className="mt-3 text-center">
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="text-2xl font-black text-white tracking-tight">PANINI</span>
            <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-[#0a1628] text-xs font-black px-2 py-0.5 rounded-md tracking-widest">FIFA WC26</span>
          </div>
          <p className="text-white/50 text-xs">Edição Oficial Portugal</p>
        </div>
      </div>

      {/* Main card */}
      <div className="w-full max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 shadow-2xl"
        >
          {!done ? (
            <>
              <p className="text-white/70 text-xs text-center uppercase tracking-widest font-semibold mb-6">
                Sistema a processar o teu acesso
              </p>

              {/* Steps */}
              <div className="space-y-4 mb-8">
                {steps.map((step, idx) => {
                  const isCompleted = completedSteps.includes(idx);
                  const isActive = currentStep === idx && !isCompleted;

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-500 ${
                        isCompleted
                          ? "bg-green-500/15 border border-green-500/30"
                          : isActive
                          ? "bg-white/10 border border-white/20"
                          : "bg-white/3 border border-white/5 opacity-40"
                      }`}
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
                        {isCompleted ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                          >
                            <CheckCircle2 className="w-7 h-7 text-green-400" />
                          </motion.div>
                        ) : isActive ? (
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-white/20" />
                        )}
                      </div>
                      <span className={`text-sm font-semibold ${isCompleted ? "text-green-300" : isActive ? "text-white" : "text-white/40"}`}>
                        {step.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
                <div className="flex justify-between text-xs text-white/40">
                  <span>A verificar...</span>
                  <span>{progress}%</span>
                </div>
              </div>
            </>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                {/* Success icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-400/40 flex items-center justify-center mx-auto mb-5"
                >
                  <ShieldCheck className="w-10 h-10 text-green-400" />
                </motion.div>

                <h2 className="text-xl font-black text-white mb-2">Acesso Confirmado!</h2>
                <p className="text-white/60 text-sm mb-6">
                  Identificámos o teu perfil e reservámos os teus descontos exclusivos de pré-venda.
                </p>

                {/* Perks */}
                <div className="space-y-2 mb-7 text-left">
                  {[
                    "✅ Portes grátis para Portugal",
                    "✅ Preços de pré-venda desbloqueados",
                    "✅ Stock reservado por 15 minutos",
                  ].map((perk, i) => (
                    <motion.p
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="text-sm text-green-300 font-medium"
                    >
                      {perk}
                    </motion.p>
                  ))}
                </div>

                {/* CTA */}
                <motion.button
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  onClick={() => setLocation(`/${params}`)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-black text-lg py-4 rounded-2xl shadow-lg shadow-green-900/40 active:scale-[0.98] transition-all"
                >
                  🛒 Ir para a Loja
                </motion.button>

                <p className="text-white/30 text-xs mt-4 flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3" /> Compra 100% segura · Pagamento protegido
                </p>
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>
      </div>

      {/* Bottom social proof */}
      <div className="w-full max-w-sm text-center">
        <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1">
          {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
        </div>
        <p className="text-white/40 text-xs">
          +2.200 famílias portuguesas já fizeram a sua encomenda
        </p>
      </div>

    </div>
  );
}
