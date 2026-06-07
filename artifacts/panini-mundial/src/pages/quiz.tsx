import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

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
      "Siempre los busco antes de comprar",
      "Me gustan si realmente valen la pena",
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
      "Conseguir productos con grandes descuentos",
      "Participar en campañas exclusivas",
    ],
  },
  {
    id: 5,
    question: "¿Te gustaría ser uno de los clientes seleccionados para nuestra próxima campaña promocional?",
    options: [
      "Sí, por supuesto",
      "Claro, me interesa",
      "Quiero saber más",
      "Depende de las condiciones",
    ],
  },
];

const loadingSteps = [
  "Verificando respuestas...",
  "Analizando perfil...",
  "Comprobando disponibilidad...",
];

export default function Quiz() {
  const [, setLocation] = useLocation();
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<"quiz" | "loading" | "result">("quiz");
  const [loadingStep, setLoadingStep] = useState(0);
  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (phase !== "loading") return;
    let step = 0;
    const advance = () => {
      setCheckedSteps((prev) => [...prev, step]);
      step++;
      if (step < loadingSteps.length) {
        setTimeout(() => {
          setLoadingStep(step);
          setTimeout(advance, 900);
        }, 150);
      } else {
        setTimeout(() => setPhase("result"), 600);
      }
    };
    setTimeout(advance, 700);
  }, [phase]);

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setTimeout(() => {
      if (current < questions.length - 1) {
        setCurrent((c) => c + 1);
        setSelected(null);
      } else {
        setPhase("loading");
        setLoadingStep(0);
        setCheckedSteps([]);
      }
    }, 480);
  };

  const goToStore = () => {
    sessionStorage.setItem("quiz_done", "1");
    setLocation("/");
  };

  const progress = ((current + (phase !== "quiz" ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col items-center justify-start px-4 py-8">

      {/* Logo */}
      <div className="mb-6">
        <div
          className="px-5 py-2 rounded-xl"
          style={{ background: "linear-gradient(135deg, #0B8A43, #23B05C)" }}
        >
          <span className="text-white font-black text-base tracking-tight leading-none">
            El Corte Inglés
          </span>
        </div>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm bg-white rounded-[20px] shadow-[0_8px_40px_rgba(0,0,0,0.10)] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <p className="text-[10px] font-black text-[#0B8A43] uppercase tracking-[2px] mb-1">
            Encuesta Oficial de Clientes
          </p>
          <p className="text-xs text-gray-400 leading-relaxed">
            Responde 5 preguntas rápidas y descubre si calificas para nuestra campaña especial de ahorro.
          </p>
        </div>

        <AnimatePresence mode="wait">

          {/* ── Quiz Phase ── */}
          {phase === "quiz" && (
            <motion.div
              key={`q-${current}`}
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -32 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="px-6 py-5"
            >
              {/* Progress */}
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] text-gray-400 font-medium">
                  Pregunta {current + 1} de {questions.length}
                </span>
                <span className="text-[11px] font-bold text-[#0B8A43]">
                  {Math.round(((current + 1) / questions.length) * 100)}%
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-5">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #0B8A43, #23B05C)" }}
                  initial={false}
                  animate={{ width: `${((current + 1) / questions.length) * 100}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>

              {/* Question */}
              <h2 className="text-base font-black text-gray-900 mb-5 leading-snug">
                {questions[current].question}
              </h2>

              {/* Options */}
              <div className="flex flex-col gap-2.5">
                {questions[current].options.map((opt, idx) => (
                  <motion.button
                    key={idx}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(idx)}
                    className="w-full text-left px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200"
                    style={
                      selected === idx
                        ? {
                            background: "#E8F8EF",
                            border: "2px solid #0B8A43",
                            color: "#0B8A43",
                          }
                        : {
                            background: "#fff",
                            border: "2px solid #E5E5E5",
                            color: "#374151",
                          }
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
                        {selected === idx ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          String.fromCharCode(65 + idx)
                        )}
                      </span>
                      {opt}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Loading Phase ── */}
          {phase === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-6 py-10 flex flex-col items-center"
            >
              {/* Spinner */}
              <div className="relative w-14 h-14 mb-8">
                <motion.div
                  className="absolute inset-0 rounded-full border-[3px] border-gray-100"
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#0B8A43]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                />
              </div>

              <div className="w-full flex flex-col gap-3">
                {loadingSteps.map((step, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: loadingStep >= idx ? 1 : 0.3 }}
                    className="flex items-center gap-3"
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                      style={
                        checkedSteps.includes(idx)
                          ? { background: "#0B8A43" }
                          : { background: "#E5E5E5" }
                      }
                    >
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span
                      className="text-sm font-medium transition-colors duration-300"
                      style={{ color: loadingStep >= idx ? "#111827" : "#9CA3AF" }}
                    >
                      {step}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Result Phase ── */}
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
                className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                style={{ background: "linear-gradient(135deg, #0B8A43, #23B05C)" }}
              >
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </motion.div>

              <h2 className="text-2xl font-black text-gray-900 mb-3">
                ¡Enhorabuena!
              </h2>

              <p className="text-sm text-gray-500 leading-relaxed mb-2">
                Según tus respuestas, has sido{" "}
                <strong className="text-gray-800">preseleccionado</strong> para participar en
                nuestra campaña promocional de clientes.
              </p>
              <p className="text-sm text-gray-500 leading-relaxed mb-7">
                Durante un tiempo limitado, algunos participantes podrán acceder a{" "}
                <strong className="text-gray-800">beneficios especiales</strong> y descuentos
                exclusivos en productos seleccionados.
              </p>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={goToStore}
                className="w-full py-4 rounded-xl font-black text-sm text-white tracking-wider uppercase transition-all"
                style={{ background: "linear-gradient(135deg, #0B8A43, #23B05C)" }}
              >
                Comprobar Disponibilidad
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
