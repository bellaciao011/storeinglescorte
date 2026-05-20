import { motion } from "framer-motion";
import { CheckCircle, Mail, Package, MessageCircle } from "lucide-react";
import { Header } from "@/components/Header";

export default function Confirma() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md text-center"
        >
          {/* Icono de éxito */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="flex justify-center mb-6"
          >
            <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-14 h-14 text-green-400" />
            </div>
          </motion.div>

          {/* Título */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold mb-3 text-gray-900"
          >
            ¡Compra confirmada!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-500 text-lg mb-10"
          >
            Gracias por tu pedido. En breve recibirás la confirmación por correo electrónico con todos los detalles y el seguimiento de tu envío.
          </motion.p>

          {/* Pasos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-50 rounded-2xl border border-gray-200 divide-y divide-gray-200 mb-8 text-left"
          >
            <div className="flex items-start gap-4 p-5">
              <div className="mt-0.5 w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Confirmación por email</p>
                <p className="text-sm text-gray-500 mt-0.5">Recibirás un correo con el resumen de tu compra y número de seguimiento.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5">
              <div className="mt-0.5 w-9 h-9 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 text-yellow-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Preparando tu kit</p>
                <p className="text-sm text-gray-500 mt-0.5">Tu pedido se empacará y enviará en un plazo de 1–2 días hábiles.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5">
              <div className="mt-0.5 w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">¿Tienes dudas?</p>
                <p className="text-sm text-gray-500 mt-0.5">Escríbenos por WhatsApp y te ayudamos en minutos.</p>
              </div>
            </div>
          </motion.div>

          {/* Botón volver */}
          <motion.a
            href="/"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="inline-block text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            ← Volver al inicio
          </motion.a>
        </motion.div>
      </main>
    </div>
  );
}
