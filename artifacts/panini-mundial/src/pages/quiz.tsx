import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, CheckCircle } from "lucide-react";

const questions = [
  {
    id: 1,
    question: "¿Con qué frecuencia visitas El Corte Inglés?",
    options: [
      "Cada semana",
      "Una vez al mes",
      "Solo en épocas especiales (Navidad, rebajas…)",
      "Raramente / nunca he ido",
    ],
  },
  {
    id: 2,
    question: "¿Qué sección visitas más cuando estás allí?",
    options: [
      "Moda y ropa",
      "Perfumes y belleza",
      "Alimentación y supermercado",
      "Tecnología y electrónica",
    ],
  },
  {
    id: 3,
    question: "¿Sabías que dentro de El Corte Inglés puedes comprar un viaje a otro país?",
    options: [
      "¡Sí lo sabía, y lo he usado!",
      "¡No lo sabía, qué locura!",
      "Lo sabía pero nunca lo he usado",
      "Pensaba que era solo ropa",
    ],
  },
  {
    id: 4,
    question: "¿Cuánto sueles gastar en una visita a El Corte Inglés?",
    options: [
      "Menos de €50",
      "Entre €50 y €150",
      "Entre €150 y €300",
      "Más de €300, ¡salgo arruinado! 😅",
    ],
  },
  {
    id: 5,
    question: "¿Qué sientes cuando entras en El Corte Inglés?",
    options: [
      "¡Felicidad total, me encanta ese lugar!",
      "Ansiedad, es demasiado grande",
      "Ganas de comprarlo todo",
      "Mi cartera llora antes de entrar 😅",
    ],
  },
];

export default function Quiz() {
  const [, setLocation] = useLocation();
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setTimeout(() => {
      if (current < questions.length - 1) {
        setCurrent((c) => c + 1);
        setSelected(null);
      } else {
        setDone(true);
      }
    }, 420);
  };

  const goToStore = () => {
    sessionStorage.setItem("quiz_done", "1");
    setLocation("/");
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#007A3D] flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 400, damping: 20 }}
            className="w-16 h-16 bg-[#007A3D] rounded-full flex items-center justify-center mx-auto mb-5"
          >
            <CheckCircle className="w-9 h-9 text-white" />
          </motion.div>
          <h2 className="text-2xl font-black text-gray-900 mb-3 leading-tight">
            ¡Eres un verdadero fan de El Corte Inglés! 🏆
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Gracias por participar. Hemos preparado una{" "}
            <strong className="text-[#007A3D]">oferta exclusiva</strong> especialmente
            para ti. ¡No te la pierdas!
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={goToStore}
            className="w-full bg-[#007A3D] hover:bg-[#005A2B] text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 text-base transition-colors"
          >
            Ver mi oferta exclusiva <ChevronRight className="w-5 h-5" />
          </motion.button>
          <p className="text-[10px] text-gray-300 mt-4">
            Oferta por tiempo limitado · El Corte Inglés
          </p>
        </motion.div>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="min-h-screen bg-[#007A3D] flex flex-col">
      <div className="px-5 pt-8 pb-2">
        <div className="flex justify-center mb-6">
          <div className="bg-white px-5 py-2.5 rounded-xl shadow-md">
            <span className="text-[#007A3D] font-black text-lg tracking-tight leading-none">
              El Corte Inglés
            </span>
          </div>
        </div>

        <div className="max-w-sm mx-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/70 text-xs font-medium">
              Pregunta {current + 1} de {questions.length}
            </span>
            <span className="text-white/70 text-xs font-medium">
              {Math.round(((current + 1) / questions.length) * 100)}%
            </span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={false}
              animate={{ width: `${((current + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col px-5 max-w-sm mx-auto w-full pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -48 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
          >
            <h2 className="text-white font-black text-xl mb-6 leading-snug mt-6">
              {q.question}
            </h2>

            <div className="flex flex-col gap-3">
              {q.options.map((opt, idx) => (
                <motion.button
                  key={idx}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSelect(idx)}
                  className={`w-full text-left px-4 py-4 rounded-2xl font-semibold text-sm transition-all ${
                    selected === idx
                      ? "bg-white text-[#007A3D] shadow-lg"
                      : "bg-white/15 text-white hover:bg-white/25 border border-white/20"
                  }`}
                >
                  <span className="inline-flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-[10px] font-black ${
                        selected === idx
                          ? "border-[#007A3D] text-[#007A3D]"
                          : "border-white/60 text-white/80"
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {opt}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="pb-6 text-center">
        <p className="text-white/30 text-[10px]">
          Encuesta de opinión · El Corte Inglés
        </p>
      </div>
    </div>
  );
}
