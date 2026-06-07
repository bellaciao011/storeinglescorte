import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Timer, Gift, Zap } from "lucide-react";

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

  // loading state
  const [loadingStep, setLoadingStep] = useState(-1);
  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    if (phase !== "loading") return;
    let step = 0;
    setLoadingStep(0);

    // progress bar animation
    const startTime = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / LOADING_TOTAL_MS) * 100, 100);
      setLoadingProgress(pct);
      if (pct >= 100) clearInterval(tick);
    }, 50);

    // step checker animation
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
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col items-center justify-start px-4 py-8">

      {/* Logo */}
      <div className="mb-6">
        <img src="/assets/eci-logo.png" alt="El Corte Inglés" className="h-10 w-auto object-contain" />
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-[20px] shadow-[0_8px_40px_rgba(0,0,0,0.10)] overflow-hidden">

        <AnimatePresence mode="wait">

          {/* ─────────────── INTRO ─────────────── */}
          {phase === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="px-6 py-7 flex flex-col"
            >
              <div className="text-center mb-5">
                <span className="text-3xl">🎉</span>
                <h1 className="text-lg font-black text-gray-900 mt-2 leading-snug">
                  Campaña Especial de Clientes
                  <br />
                  <span className="text-[#0B8A43]">El Corte Inglés</span>
                </h1>
              </div>

              <p className="text-sm text-gray-500 text-center leading-relaxed mb-5">
                Responde 5 preguntas rápidas y descubre si calificas para recibir{" "}
                <strong className="text-[#0B8A43]">hasta un 80% de descuento</strong> en
                productos seleccionados.
              </p>

              <p className="text-xs text-gray-400 text-center mb-5">
                Miles de clientes ya están participando en esta campaña promocional exclusiva.
              </p>

              {/* Perks */}
              <div className="flex flex-col gap-2.5 mb-6">
                {[
                  { icon: <Gift className="w-4 h-4 text-[#0B8A43]" />, text: "Participación gratuita" },
                  { icon: <Zap className="w-4 h-4 text-[#0B8A43]" />, text: "Descuentos exclusivos" },
                  { icon: <Check className="w-4 h-4 text-[#0B8A43]" />, text: "Selección inmediata al finalizar" },
                ].map((p, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#E8F8EF] flex items-center justify-center flex-shrink-0">
                      {p.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{p.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 justify-center mb-6">
                <Timer className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400">Tiempo estimado: menos de 1 minuto.</span>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={startQuiz}
                className="w-full py-4 rounded-xl font-black text-sm text-white tracking-wider uppercase"
                style={{ background: "linear-gradient(135deg, #0B8A43, #23B05C)" }}
              >
                Comenzar ahora
              </motion.button>
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
              className="px-6 py-5"
            >
              {/* Benefit strip */}
              <div className="bg-[#E8F8EF] rounded-xl px-3 py-2 mb-4 text-center">
                <span className="text-[11px] font-black text-[#0B8A43] tracking-wide">
                  🎁 Hasta un 80% de descuento en productos seleccionados
                </span>
              </div>

              {/* Progress */}
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] text-gray-400 font-medium">
                  Pregunta {current + 1} de {questions.length}
                </span>
                <span className="text-[11px] font-bold text-[#0B8A43]">
                  {Math.round(((current + 1) / questions.length) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #0B8A43, #23B05C)" }}
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
                        ? { background: "#E8F8EF", border: "2px solid #0B8A43", color: "#0B8A43" }
                        : { background: "#fff", border: "2px solid #E5E5E5", color: "#374151" }
                    }
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-black transition-all"
                        style={
                          selected === idx
                            ? { background: "#0B8A43", color: "#fff" }
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
              className="px-6 py-8 flex flex-col items-center"
            >
              <p className="text-xs font-black text-[#0B8A43] uppercase tracking-widest mb-1">
                Un momento
              </p>
              <h3 className="text-base font-black text-gray-900 mb-6 text-center">
                ⏳ Analizando respuestas...
              </h3>

              {/* Fat progress bar */}
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-7">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #0B8A43, #23B05C)" }}
                  animate={{ width: `${loadingProgress}%` }}
                  transition={{ ease: "linear", duration: 0.1 }}
                />
              </div>

              {/* Steps */}
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
                            ? { background: "#0B8A43" }
                            : active
                            ? { background: "#E8F8EF", border: "2px solid #0B8A43" }
                            : { background: "#E5E5E5" }
                        }
                      >
                        {done && <Check className="w-3 h-3 text-white" />}
                        {active && (
                          <motion.div
                            className="w-2 h-2 rounded-full bg-[#0B8A43]"
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
              className="px-6 py-8 flex flex-col items-center text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 20 }}
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: "linear-gradient(135deg, #0B8A43, #23B05C)" }}
              >
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </motion.div>

              <p className="text-[10px] font-black text-[#0B8A43] uppercase tracking-widest mb-1">
                ¡Resultado listo!
              </p>
              <h2 className="text-2xl font-black text-gray-900 mb-2">
                🎉 ¡Enhorabuena!
              </h2>
              <p className="text-sm font-bold text-gray-800 mb-3">
                Tus respuestas han sido aceptadas.
              </p>
              <p className="text-sm text-gray-500 leading-relaxed mb-3">
                Según nuestro sistema, has sido{" "}
                <strong className="text-gray-800">preseleccionado</strong> para participar en la
                campaña promocional actual de El Corte Inglés.
              </p>
              <p className="text-sm text-gray-500 leading-relaxed mb-5">
                Ahora puedes comprobar si hay{" "}
                <strong className="text-[#0B8A43]">descuentos disponibles</strong> para tu
                perfil y consultar los productos participantes.
              </p>

              {/* Warning */}
              <div className="w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-left">
                <p className="text-xs text-amber-700 leading-relaxed">
                  ⚠️ La disponibilidad puede variar según la demanda y el stock promocional.
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={goToStore}
                className="w-full py-4 rounded-xl font-black text-sm text-white tracking-wide uppercase"
                style={{ background: "linear-gradient(135deg, #0B8A43, #23B05C)" }}
              >
                Comprobar descuentos disponibles
              </motion.button>

              <p className="text-[10px] text-gray-300 mt-4">
                Oferta sujeta a disponibilidad · El Corte Inglés
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <p className="text-[10px] text-gray-400 mt-6 text-center">
        Encuesta oficial · El Corte Inglés · Datos protegidos
      </p>
    </div>
  );
}
