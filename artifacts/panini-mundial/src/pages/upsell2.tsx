import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { AlertTriangle, Lock, Loader2, AlertCircle } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "");

const AMOUNT = 45;

type CustomerData = {
  name: string;
  email: string;
  phone: string;
  mbwayPhone: string;
  address: string;
};

function pad(n: number) { return String(n).padStart(2, "0"); }
function formatDate(d: Date) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

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
        return_url: `${window.location.origin}/upsell2?return=1&orderId=${orderId}`,
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
          className="flex-1 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-black text-base py-4 rounded-xl flex items-center justify-center gap-2"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando…</>
            : `Emitir Factura — $${total}`
          }
        </button>
      </div>
    </div>
  );
}

export default function Upsell2() {
  const [, setLocation] = useLocation();
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [error, setError] = useState<string>("");
  const [done, setDone] = useState(false);
  const [invoiceNum] = useState(() => `FT 2026/${Math.floor(Math.random() * 90000 + 10000)}`);
  const today = formatDate(new Date());

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
      setTimeout(() => setLocation("/"), 2000);
    }
  }, []);

  const handleCreateIntent = async () => {
    if (!customer) return;
    setCreatingIntent(true);
    setError("");

    try {
      const res = await fetch("/api/payment/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: AMOUNT,
          customerEmail: customer.email,
          customerName: customer.name,
          customerPhone: customer.phone,
          productName: "Emisión de Factura Comercial",
          orderType: "upsell2",
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
          <h2 className="text-xl font-black text-gray-900 mb-2">¡Factura emitida!</h2>
          <p className="text-gray-500 text-sm mb-2">Tu pedido está siendo procesado.</p>
          <p className="text-gray-400 text-xs animate-pulse mt-3">Redirigiendo…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf8] pb-12">
      <div className="w-full bg-[#6b0f1a] text-white py-3 px-4 flex items-center justify-center mb-6">
        <div className="bg-white rounded-md px-2 py-1">
          <img src="/assets/logo-panini-oficial.png" alt="Panini" className="h-7 w-auto object-contain" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4">

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-300 rounded-2xl p-4 mb-5 flex gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="font-black text-amber-800 text-sm mb-1">Emisión de Factura obligatoria</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              Por disposición de las autoridades aduanales mexicanas, todos los productos importados deben tener la factura emitida antes de la liberación de la entrega. El monto cobrado corresponde a los gastos administrativos de emisión.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-5"
        >
          <div className="px-5 pt-5 pb-4 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <img src="/assets/logo-panini-oficial.png" alt="Panini" className="h-8 w-auto object-contain mb-1" />
                <p className="text-xs text-gray-400">México</p>
              </div>
              <div className="text-right">
                <p className="font-black text-gray-900 text-base tracking-wider">FACTURA</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{invoiceNum}</p>
              </div>
            </div>
          </div>

          <div className="px-5 py-4 border-b border-gray-100 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Emisor</p>
              <p className="text-xs font-bold text-gray-800">Panini México S.A. de C.V.</p>
              <p className="text-xs text-gray-500">RFC: PMX260101AAA</p>
              <p className="text-xs text-gray-500">Av. Insurgentes Sur 1647</p>
              <p className="text-xs text-gray-500">03900 Ciudad de México</p>
              <p className="text-xs text-gray-500">+52 55 1234 5678</p>
            </div>
            <div className="text-right">
              <div className="mb-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Fecha de emisión</p>
                <p className="text-xs font-bold text-gray-800">{today}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Vencimiento</p>
                <p className="text-xs font-black text-red-600">Pago inmediato</p>
              </div>
            </div>
          </div>

          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Destinatario / Comprador</p>
            <p className="text-sm font-bold text-gray-900">{customer?.name ?? "—"}</p>
            <p className="text-xs text-gray-500 mt-0.5">{customer?.address ?? "—"}</p>
            {customer?.email && <p className="text-xs text-gray-500">{customer.email}</p>}
            {customer?.phone && <p className="text-xs text-gray-500">{customer.phone}</p>}
          </div>

          <div className="px-5 py-4 border-b border-gray-100">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 mb-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Descripción</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cant.</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Precio</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</p>
            </div>
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 py-2 border-t border-gray-100">
              <p className="text-xs text-gray-700 leading-relaxed">Gastos de emisión de factura comercial — Pedido en línea</p>
              <p className="text-xs text-gray-700 text-center pt-0.5">1</p>
              <p className="text-xs text-gray-700 pt-0.5">$45</p>
              <p className="text-xs font-bold text-gray-900 pt-0.5">$45</p>
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Subtotal</span><span>$45.00</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mb-3">
              <span>IVA (0%)</span><span>$0.00</span>
            </div>
            <div className="flex justify-between font-black text-base border-t border-gray-100 pt-3">
              <span className="text-gray-900">TOTAL</span>
              <span className="text-[#6b0f1a]">$45.00</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4"
        >
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Método de pago</p>

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
              className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-black text-base py-4 rounded-xl flex items-center justify-center gap-2"
            >
              {creatingIntent
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparando…</>
                : "Continuar con el pago →"
              }
            </button>
          ) : (
            <Elements
              key={clientSecret}
              stripe={stripePromise}
              options={{ clientSecret, locale: "es" }}
            >
              <StripePaymentForm
                total={AMOUNT}
                orderId={orderId!}
                onSuccess={() => {
                  setDone(true);
                  setTimeout(() => setLocation("/"), 2000);
                }}
                onError={(msg) => setError(msg)}
                onBack={() => { setClientSecret(null); setOrderId(null); }}
              />
            </Elements>
          )}
        </motion.div>

        <div className="text-center">
          <button
            onClick={() => setLocation("/")}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            No, gracias — continuar sin emitir factura
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5 flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5" />
          Pago seguro vía Stripe
        </p>
      </div>
    </div>
  );
}
