import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Timer, Zap, Trophy } from "lucide-react";

const questions = [
  {
    id: 1,
    question: "¿Con qué frecuencia compras en El Corte Inglés?",
    options: [
      "Varias veces al mes",
      "Una vez al mes",
      "Solo en temporadas especiales",
      "Hace tiempo que no voy",
    ],
  },
  {
    id: 2,
    question: "¿Qué sección sueles visitar primero?",
    options: [
      "Moda y complementos",
      "Perfumería y belleza",
      "Tecnología y hogar",
      "Supermercado y alimentación",
    ],
  },
  {
    id: 3,
    question: "¿Qué tan importante es para ti encontrar descuentos exclusivos?",
    options: [
      "Siempre los busco",
      "Me gustan si valen la pena",
      "Depende del producto",
      "No suelo prestar atención",
    ],
  },
  {
    id: 4,
    question: "Si recibieras un beneficio especial hoy, ¿qué te interesaría más?",
    options: [
      "Ahorrar en mis compras",
      "Acceder a promociones privadas",
      "Conseguir grandes descuentos",
      "Participar en campañas exclusivas",
    ],
  },
  {
    id: 5,
    question: "¿Te gustaría participar en futuras campañas promocionales de El Corte Inglés?",
    options: [
      "Sí, por supuesto",
      "Claro que sí",
      "Me interesa saber más",
      "Depende de las condiciones",
    ],
  },
];

const loadingSteps = [
  "Verificando participación",
  "Comprobando disponibilidad",
  "Validando perfil de cliente",
  "Buscando promociones compatibles",
  "Generando resultado",
];

const LOADING_TOTAL_MS = 5000;
const STEP_DELAY_MS = LOADING_TOTAL_MS / loadingSteps.length;

type Phase = "intro" | "quiz" | "loading" | "result";

export default function Quiz() {
  const [, setLocation] = useLocation();
  const [phase, setPhase] = useState<Phase>("intro");
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const [loadingStep, setLoadingStep] = useState(-1);
  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    if (phase !== "loading") return;
    let step = 0;
    setLoadingStep(0);

    const startTime = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / LOADING_TOTAL_MS) * 100, 100);
      setLoadingProgress(pct);
      if (pct >= 100) clearInterval(tick);
    }, 50);

    const advance = () => {
      setCheckedSteps((prev) => [...prev, step]);
      step++;
      if (step < loadingSteps.length) {
        setLoadingStep(step);
        setTimeout(advance, STEP_DELAY_MS);
      } else {
        setTimeout(() => setPhase("result"), 500);
      }
    };
    setTimeout(advance, STEP_DELAY_MS);

    return () => clearInterval(tick);
  }, [phase]);

  const startQuiz = () => setPhase("quiz");

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setTimeout(() => {
      if (current < questions.length - 1) {
        setCurrent((c) => c + 1);
        setSelected(null);
      } else {
        setPhase("loading");
        setLoadingStep(-1);
        setCheckedSteps([]);
        setLoadingProgress(0);
      }
    }, 480);
  };

  const goToStore = () => {
    sessionStorage.setItem("quiz_done", "1");
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 py-3 bg-white">

      {/* Logo */}
      <div className="mb-3">
        <img src="/assets/eci-logo.png" alt="El Corte Inglés" className="h-8 w-auto object-contain" />
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-[20px] overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.4)]">

        <AnimatePresence mode="wait">

          {/* ─────────────── INTRO ─────────────── */}
          {phase === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              {/* Hero rojo con patrón */}
              <div
                className="relative px-6 pt-5 pb-4 flex flex-col items-center text-center overflow-hidden"
                style={{ background: "linear-gradient(160deg, #C8102E 0%, #A50020 60%, #8B001A 100%)" }}
              >
                <svg className="absolute inset-0 w-full h-full opacity-[0.12]" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
                  <defs>
                    <pattern id="tri" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                      <polygon points="20,0 40,40 0,40" fill="none" stroke="#fff" strokeWidth="0.8" />
                      <polygon points="0,0 20,40 40,0" fill="none" stroke="#fff" strokeWidth="0.8" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#tri)" />
                </svg>

                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
                  className="flex gap-2 mb-2 relative z-10"
                >
                  {[0, 1].map((i) => (
                    <motion.svg key={i} width="28" height="28" viewBox="0 0 24 24" fill="#F5C518"
                      initial={{ rotate: -20, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      transition={{ delay: 0.2 + i * 0.12, type: "spring", stiffness: 280 }}
                      style={{ filter: "drop-shadow(0 2px 6px rgba(245,197,24,0.7))" }}
                    >
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                    </motion.svg>
                  ))}
                </motion.div>

                <p className="text-[10px] font-semibold text-red-200 tracking-[0.15em] uppercase mb-0.5 relative z-10">
                  Siempre con vosotros
                </p>
                <h1 className="text-xl font-black text-white leading-tight mb-1 relative z-10">
                  ¡ENHORABUENA CAMPEONES!
                </h1>
                <p className="text-xs text-red-100 font-semibold relative z-10">
                  España · Campeones del Mundo 2026 🏆
                </p>
              </div>

              {/* Cuerpo blanco */}
              <div className="bg-white px-5 py-4 flex flex-col">
                <div className="text-center mb-3">
                  <h2 className="text-sm font-black text-gray-900 leading-snug mb-1">
                    Campaña Especial · <span className="text-[#C8102E]">El Corte Inglés</span>
                  </h2>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Por el título mundial de la <strong className="text-gray-800">Selección Española</strong>,
                    {" "}<strong className="text-[#C8102E]">hasta un 95% de descuento</strong> en productos seleccionados.
                  </p>
                </div>

                {/* Perks */}
                <div className="flex flex-col gap-1.5 mb-3">
                  {[
                    { icon: <Trophy className="w-3.5 h-3.5 text-[#C8102E]" />, text: "Campaña especial por el Título Mundial" },
                    { icon: <Zap className="w-3.5 h-3.5 text-[#C8102E]" />, text: "Hasta 95% de descuento en productos" },
                    { icon: <Check className="w-3.5 h-3.5 text-[#C8102E]" />, text: "Solo 5 preguntas rápidas para participar" },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#FEE8EB" }}>
                        {p.icon}
                      </div>
                      <span className="text-xs font-medium text-gray-700">{p.text}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 justify-center mb-3">
                  <Timer className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[11px] text-gray-400">Menos de 1 minuto.</span>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={startQuiz}
                  className="w-full py-3 rounded-xl font-black text-sm text-white tracking-wider uppercase"
                  style={{ background: "linear-gradient(135deg, #C8102E, #A50020)" }}
                >
                  COMENZAR AHORA
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ─────────────── QUIZ ─────────────── */}
          {phase === "quiz" && (
            <motion.div
              key={`q-${current}`}
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -32 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="px-6 py-5 bg-white"
            >
              {/* Benefit strip */}
              <div className="rounded-xl px-3 py-2 mb-4 text-center flex items-center justify-center gap-1.5"
                style={{ background: "#FEE8EB" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#C8102E">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
                <span className="text-[11px] font-black tracking-wide" style={{ color: "#C8102E" }}>
                  Hasta un 95% de descuento · Campaña FIFA World Cup 2026™
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#C8102E">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
              </div>

              {/* Progress */}
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] text-gray-400 font-medium">
                  Pregunta {current + 1} de {questions.length}
                </span>
                <span className="text-[11px] font-bold" style={{ color: "#C8102E" }}>
                  {Math.round(((current + 1) / questions.length) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #C8102E, #E8304A)" }}
                  initial={false}
                  animate={{ width: `${((current + 1) / questions.length) * 100}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>

              <h2 className="text-base font-black text-gray-900 mb-5 leading-snug">
                {questions[current].question}
              </h2>

              <div className="flex flex-col gap-2.5">
                {questions[current].options.map((opt, idx) => (
                  <motion.button
                    key={idx}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(idx)}
                    className="w-full text-left px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200"
                    style={
                      selected === idx
                        ? { background: "#FEE8EB", border: "2px solid #C8102E", color: "#C8102E" }
                        : { background: "#fff", border: "2px solid #E5E5E5", color: "#374151" }
                    }
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-black transition-all"
                        style={
                          selected === idx
                            ? { background: "#C8102E", color: "#fff" }
                            : { background: "#F3F4F6", color: "#9CA3AF" }
                        }
                      >
                        {selected === idx ? <Check className="w-3 h-3" /> : String.fromCharCode(65 + idx)}
                      </span>
                      {opt}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─────────────── LOADING ─────────────── */}
          {phase === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-6 py-8 flex flex-col items-center bg-white"
            >
              <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "#C8102E" }}>
                Un momento
              </p>
              <h3 className="text-base font-black text-gray-900 mb-6 text-center">
                ⏳ Analizando respuestas...
              </h3>

              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-7">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #C8102E, #E8304A)" }}
                  animate={{ width: `${loadingProgress}%` }}
                  transition={{ ease: "linear", duration: 0.1 }}
                />
              </div>

              <div className="w-full flex flex-col gap-3">
                {loadingSteps.map((step, idx) => {
                  const done = checkedSteps.includes(idx);
                  const active = loadingStep === idx && !done;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: loadingStep >= idx ? 1 : 0.3 }}
                      className="flex items-center gap-3"
                    >
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                        style={
                          done
                            ? { background: "#C8102E" }
                            : active
                            ? { background: "#FEE8EB", border: "2px solid #C8102E" }
                            : { background: "#E5E5E5" }
                        }
                      >
                        {done && <Check className="w-3 h-3 text-white" />}
                        {active && (
                          <motion.div
                            className="w-2 h-2 rounded-full"
                            style={{ background: "#C8102E" }}
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                          />
                        )}
                      </div>
                      <span
                        className="text-sm font-medium transition-colors duration-300"
                        style={{ color: loadingStep >= idx ? "#111827" : "#9CA3AF" }}
                      >
                        {step}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ─────────────── RESULT ─────────────── */}
          {phase === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Hero resultado */}
              <div
                className="relative px-6 pt-7 pb-6 flex flex-col items-center text-center overflow-hidden"
                style={{ background: "linear-gradient(160deg, #C8102E 0%, #A50020 100%)" }}
              >
                <svg className="absolute inset-0 w-full h-full opacity-[0.10]" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
                  <defs>
                    <pattern id="tri2" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                      <polygon points="20,0 40,40 0,40" fill="none" stroke="#fff" strokeWidth="0.8" />
                      <polygon points="0,0 20,40 40,0" fill="none" stroke="#fff" strokeWidth="0.8" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#tri2)" />
                </svg>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 20 }}
                  className="flex gap-3 mb-3 relative z-10"
                >
                  {[0, 1].map((i) => (
                    <svg key={i} width="32" height="32" viewBox="0 0 24 24" fill="#F5C518"
                      style={{ filter: "drop-shadow(0 2px 8px rgba(245,197,24,0.7))" }}>
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                    </svg>
                  ))}
                </motion.div>
                <p className="text-[10px] font-black text-red-200 uppercase tracking-widest mb-1 relative z-10">
                  ¡Resultado listo!
                </p>
                <h2 className="text-2xl font-black text-white mb-1 relative z-10">
                  ¡Enhorabuena!
                </h2>
                <p className="text-sm text-red-100 font-medium relative z-10">
                  Has sido preseleccionado
                </p>
              </div>

              {/* Cuerpo */}
              <div className="bg-white px-6 py-6 flex flex-col">
                <p className="text-sm font-bold text-gray-800 mb-3 text-center">
                  Tus respuestas han sido aceptadas.
                </p>
                <p className="text-sm text-gray-500 leading-relaxed mb-3 text-center">
                  Según nuestro sistema, has sido{" "}
                  <strong className="text-gray-800">preseleccionado</strong> para participar en la
                  campaña conmemorativa del Título Mundial de la Selección Española.
                </p>
                <p className="text-sm text-gray-500 leading-relaxed mb-5 text-center">
                  Comprueba ahora los{" "}
                  <strong style={{ color: "#C8102E" }}>descuentos de hasta 95%</strong> disponibles
                  para tu perfil y consulta los productos participantes.
                </p>

                <div className="rounded-xl px-4 py-3 mb-6 text-left border"
                  style={{ background: "#FFF8E1", borderColor: "#F5C518" }}>
                  <p className="text-xs leading-relaxed" style={{ color: "#92600A" }}>
                    ⚠️ La disponibilidad puede variar según la demanda y el stock promocional.
                  </p>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={goToStore}
                  className="w-full py-4 rounded-xl font-black text-sm text-white tracking-wide uppercase"
                  style={{ background: "linear-gradient(135deg, #C8102E, #A50020)" }}
                >
                  Comprobar descuentos disponibles
                </motion.button>

                <p className="text-[10px] text-gray-300 mt-4 text-center">
                  Oferta sujeta a disponibilidad · El Corte Inglés
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <p className="text-[10px] text-gray-500 mt-6 text-center">
        Encuesta oficial · El Corte Inglés · Datos protegidos
      </p>
    </div>
  );
}
