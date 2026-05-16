import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ShieldCheck, Loader2, Lock, Star, Package } from "lucide-react";

const steps = [
  { id: 1, label: "Verificando usuario real...", duration: 2200 },
  { id: 2, label: "Validando acceso exclusivo...", duration: 1800 },
  { id: 3, label: "Preparando descuentos y productos...", duration: 2000 },
];

export default function Presell() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  const params = window.location.search;

  useEffect(() => {
    function runStep(idx: number) {
      if (idx >= steps.length) { setDone(true); return; }
      setCurrentStep(idx);
      setTimeout(() => {
        setCompletedSteps(prev => [...prev, idx]);
        runStep(idx + 1);
      }, steps[idx].duration);
    }
    runStep(0);
  }, []);

  const progress = done
    ? 100
    : completedSteps.length === 0
    ? 12
    : Math.round((completedSteps.length / steps.length) * 100);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header bar */}
      <div className="w-full bg-[#6b0f1a] text-white py-3 px-4 flex items-center justify-center">
        <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-4 py-1.5">
          <Lock className="w-3 h-3 text-yellow-300" />
          <span className="text-xs font-semibold text-white tracking-wide">Área de Acceso Restringido</span>
        </div>
      </div>

      {/* Sub-bar */}
      <div className="w-full bg-[#3d0710] text-white/90 py-1.5 px-4 flex justify-center gap-6 text-xs font-medium">
        <span className="flex items-center gap-1.5 text-orange-300 font-bold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-400"></span>
          </span>
          Validación en curso
        </span>
        <span className="text-white/40">|</span>
        <span className="flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-green-400" />
          <span className="text-green-300 font-bold">Stock limitado</span>
        </span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">

        <div className="text-center mb-8">
          <span className="inline-block bg-[#6b0f1a] text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">
            FIFA World Cup 2026
          </span>
          <h1 className="text-2xl font-black text-gray-900 leading-tight">
            Verificando tu<br />acceso exclusivo
          </h1>
          <p className="text-gray-500 text-sm mt-2">Por favor espera mientras validamos tu perfil</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        >
          {!done ? (
            <>
              <div className="space-y-3 mb-6">
                {steps.map((step, idx) => {
                  const isCompleted = completedSteps.includes(idx);
                  const isActive = currentStep === idx && !isCompleted;

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: idx <= currentStep ? 1 : 0.35, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-all duration-500 ${
                        isCompleted
                          ? "bg-green-50 border-green-200"
                          : isActive
                          ? "bg-[#6b0f1a]/5 border-[#6b0f1a]/20"
                          : "bg-gray-50 border-gray-100"
                      }`}
                    >
                      <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center">
                        {isCompleted ? (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                          </motion.div>
                        ) : isActive ? (
                          <Loader2 className="w-5 h-5 text-[#6b0f1a] animate-spin" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                        )}
                      </div>
                      <span className={`text-sm font-semibold ${isCompleted ? "text-green-700" : isActive ? "text-[#6b0f1a]" : "text-gray-400"}`}>
                        {step.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              <div className="space-y-2">
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#6b0f1a] rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Verificando perfil...</span>
                  <span className="font-bold text-[#6b0f1a]">{progress}%</span>
                </div>
              </div>
            </>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-20 h-20 rounded-full bg-green-100 border-2 border-green-300 flex items-center justify-center mx-auto mb-5"
                >
                  <ShieldCheck className="w-10 h-10 text-green-600" />
                </motion.div>

                <h2 className="text-xl font-black text-gray-900 mb-2">¡Acceso Confirmado!</h2>
                <p className="text-gray-500 text-sm mb-6">
                  Identificamos tu perfil y reservamos tus descuentos exclusivos de preventa.
                </p>

                <div className="space-y-2 mb-7 text-left">
                  {["✅ Envío gratis a México", "✅ Precios de preventa desbloqueados", "✅ Stock reservado por 15 minutos"].map((perk, i) => (
                    <motion.p
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="text-sm text-green-700 font-medium"
                    >
                      {perk}
                    </motion.p>
                  ))}
                </div>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  onClick={() => setLocation(`/${params}`)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-black text-lg py-4 rounded-xl shadow-sm active:scale-[0.98] transition-all"
                >
                  🛒 Ir a la Tienda
                </motion.button>

                <p className="text-gray-400 text-xs mt-4 flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3" /> Compra 100% segura · Pago protegido
                </p>
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-1 text-yellow-500 mb-1">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
          </div>
          <p className="text-gray-400 text-xs">+2,200 familias mexicanas ya hicieron su pedido</p>
        </div>

      </div>
    </div>
  );
}
