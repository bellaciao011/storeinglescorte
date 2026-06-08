import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  CheckCircle2, ShieldCheck, Truck, Lock,
  CreditCard, CheckCircle, Loader2, AlertCircle, ChevronDown, ChevronUp,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Header } from "@/components/Header";
import { kits } from "@/lib/kits";
import { readUtms } from "@/lib/utm";
import { apiUrl } from "@/lib/api";
import { CART_STORAGE_KEY, type CartItem } from "@/lib/CartContext";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "");

const SHIPPING_OPTIONS = [
  { id: "standard", label: "Envío estándar",   days: "8–15 días hábiles", price: 0 },
  { id: "express",  label: "Envío express",     days: "3–5 días hábiles",  price: 4.99 },
  { id: "priority", label: "Envío prioritario", days: "1–2 días hábiles",  price: 9.99 },
];

function StripePaymentForm({
  total,
  orderId,
  onSuccess,
  onError,
  validateDelivery,
}: {
  total: number;
  orderId: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
  validateDelivery: () => string | null;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    const deliveryErr = validateDelivery();
    if (deliveryErr) {
      onError(deliveryErr);
      document.getElementById("entrega-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (!stripe || !elements) return;
    setLoading(true);
    onError("");

    const { error: submitErr } = await elements.submit();
    if (submitErr) {
      onError(submitErr.message ?? "Error en el formulario de pago.");
      setLoading(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout?return=1&orderId=${orderId}`,
      },
      redirect: "if_required",
    });

    if (error) {
      onError(error.message ?? "Pago rechazado. Verifica tus datos e inténtalo de nuevo.");
      setLoading(false);
      return;
    }

    onSuccess();
  };

  return (
    <div>
      <PaymentElement options={{ layout: "tabs", terms: { card: "never" } }} />
      <button
        type="button"
        onClick={handlePay}
        disabled={loading || !stripe || !elements}
        className="mt-5 w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-black text-base py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
      >
        {loading
          ? <><Loader2 className="w-5 h-5 animate-spin" /> Procesando…</>
          : <><Lock className="w-4 h-4" /> Pagar ahora · {total.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</>
        }
      </button>
    </div>
  );
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const isCartMode = searchParams.get("cart") === "1";
  const cartItems: CartItem[] = isCartMode ? (() => {
    try { return JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? "[]"); }
    catch { return []; }
  })() : [];
  const kitId = searchParams.get("kit") || "campeao";
  const kit = kits.find((k) => k.id === kitId) || kits[2];

  const utmParams = readUtms();

  const [error, setError] = useState<string>("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [pollConfirmed, setPollConfirmed] = useState(false);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 4>(1);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState("standard");
  const piAmountRef = useRef<number | null>(null);
  const intentCreatedRef = useRef(false);

  const fmtEUR = (n: number) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

  const [formData, setFormData] = useState({
    email: "",
    nome: "",
    telemovel: "",
    nif: "",
    codigoPostal: "",
    morada: "",
    numero: "",
    andar: "",
    localidade: "",
    distrito: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const cartSubtotal = isCartMode ? cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0) : 0;
  const baseTotal = isCartMode ? cartSubtotal : kit.price;
  const shippingOpt = SHIPPING_OPTIONS.find(o => o.id === selectedShipping) ?? SHIPPING_OPTIONS[0];
  const shippingCost = shippingOpt.price;
  const orderTotal = baseTotal + shippingCost;

  const handleShippingChange = (id: string) => {
    setSelectedShipping(id);
    if (orderId) {
      const opt = SHIPPING_OPTIONS.find(o => o.id === id) ?? SHIPPING_OPTIONS[0];
      const newTotal = baseTotal + opt.price;
      fetch(apiUrl("/api/payment/update-intent"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, amount: newTotal }),
      }).catch(() => {});
    }
  };

  const validateDelivery = (): string | null => {
    if (!formData.codigoPostal || !formData.morada || !formData.numero || !formData.localidade || !formData.distrito) {
      return "Por favor, completa tu dirección de entrega antes de pagar.";
    }
    return null;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnOrderId = params.get("orderId");
    const redirectStatus = params.get("redirect_status");
    if (returnOrderId && redirectStatus === "succeeded") {
      setOrderId(returnOrderId);
      setStep(4);
    }
  }, []);

  // Auto-crear PaymentIntent en cuanto el lead llena identificación
  useEffect(() => {
    if (intentCreatedRef.current) return;
    if (!formData.email || !formData.nome || !formData.telemovel) return;
    if (clientSecret || creatingIntent) return;

    const timer = setTimeout(() => {
      if (intentCreatedRef.current) return;
      intentCreatedRef.current = true;
      handleCreateIntent();
    }, 600);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.email, formData.nome, formData.telemovel]);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (step !== 4 || !orderId) return;

    let attempts = 0;
    const MAX_ATTEMPTS = 60;

    pollingRef.current = setInterval(async () => {
      attempts++;
      try {
        const r = await fetch(apiUrl(`/api/public/payment-status?orderId=${encodeURIComponent(orderId)}`));
        if (r.ok) {
          const data = await r.json() as { status: string; tracking_code?: string };
          if (data.status === "paid") {
            clearInterval(pollingRef.current!);
            if (data.tracking_code) setTrackingCode(data.tracking_code);
            setPollConfirmed(true);
          }
        }
      } catch { }

      if (attempts >= MAX_ATTEMPTS) clearInterval(pollingRef.current!);
    }, 5000);

    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [step, orderId]);

  const handleCreateIntent = async () => {
    if (!formData.email || !formData.nome || !formData.telemovel) return;

    setCreatingIntent(true);
    setError("");

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 15000)
    );

    try {
      const addr = [
        formData.morada,
        formData.numero && `nº ${formData.numero}`,
        formData.andar || null,
        [formData.codigoPostal, formData.localidade].filter(Boolean).join(" "),
      ].filter(Boolean).join(", ");

      const items = isCartMode
        ? cartItems.map(i => ({ id: i.product.id, name: i.product.name, quantity: i.quantity, price: i.product.price }))
        : [{ id: kit.id, name: kit.name, quantity: 1, price: kit.price }];

      const firstItem = isCartMode && cartItems.length > 0 ? cartItems[0].product : kit;

      const res = await Promise.race([
        fetch(apiUrl("/api/payment/create-intent"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: orderTotal,
            customerEmail: formData.email,
            customerName: formData.nome,
            customerPhone: formData.telemovel,
            customerDocument: formData.nif,
            shippingAddress: addr,
            shippingPostalCode: formData.codigoPostal,
            shippingCity: formData.localidade,
            shippingDistrict: formData.distrito,
            kitId: firstItem.id,
            productName: isCartMode ? `Pedido (${cartItems.length} producto${cartItems.length !== 1 ? "s" : ""})` : kit.name,
            quantity: isCartMode ? cartItems.reduce((s, i) => s + i.quantity, 0) : 1,
            items,
            orderType: "main",
            utmParams,
          }),
        }),
        timeout,
      ]);

      const data = await res.json() as { clientSecret?: string; orderId?: string; error?: string };

      if (!res.ok) {
        setError(data.error ?? "Error al iniciar el pago. Inténtalo de nuevo.");
        setCreatingIntent(false);
        return;
      }

      sessionStorage.setItem("pendingOrderId", data.orderId ?? "");
      piAmountRef.current = orderTotal;
      setClientSecret(data.clientSecret ?? null);
      setOrderId(data.orderId ?? null);

      (window as any).fbq?.("track", "InitiateCheckout", {
        value: orderTotal,
        currency: "EUR",
        content_ids: isCartMode ? cartItems.map(i => i.product.id) : [kit.id],
        content_type: "product",
        num_items: isCartMode ? cartItems.reduce((s, i) => s + i.quantity, 0) : 1,
      });

    } catch {
      setError("No fue posible conectar con el servidor de pagos. Verifica tu conexión e inténtalo de nuevo.");
    } finally {
      setCreatingIntent(false);
    }
  };

  if (step === 4) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center">
        <Header />
        <main className="w-full max-w-md mx-auto p-4 py-12 flex-1 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 ${pollConfirmed ? "bg-green-100" : "bg-green-50"}`}
          >
            {pollConfirmed
              ? <CheckCircle className="w-10 h-10 text-green-600" />
              : <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
            }
          </motion.div>

          {pollConfirmed ? (
            <>
              <h1 className="text-2xl font-black text-green-700 mb-2">¡Pedido confirmado!</h1>
              <p className="text-gray-600 text-sm mb-6 max-w-xs leading-relaxed">
                Tu pedido fue recibido con éxito. Recibirás un correo de confirmación en breve.
              </p>

              {trackingCode && (
                <div className="w-full bg-[#7B1C1C]/5 border border-[#7B1C1C]/20 rounded-xl p-4 mb-4 text-center">
                  <p className="text-xs font-bold text-[#7B1C1C]/60 uppercase tracking-widest mb-1">Tu código de rastreo</p>
                  <p className="text-2xl font-black text-[#7B1C1C] font-mono tracking-widest mb-3">{trackingCode}</p>
                  <a
                    href={`/rastreio?codigo=${trackingCode}`}
                    className="inline-block bg-[#7B1C1C] text-white text-sm font-bold px-5 py-2 rounded-lg hover:bg-[#5a0c16] transition-colors"
                  >
                    Rastrear mi pedido →
                  </a>
                </div>
              )}

              <div className="w-full bg-white border border-gray-100 rounded-xl p-4 text-left shadow-sm">
                <h3 className="font-bold text-gray-900 text-sm mb-3 border-b pb-2">Resumen del Pedido</h3>
                <div className="flex justify-between mb-1.5 text-sm">
                  <span className="text-gray-500">Producto</span>
                  <span className="font-medium text-gray-900">
                    {isCartMode ? `${cartItems.length} producto${cartItems.length !== 1 ? "s" : ""}` : kit.name}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total</span>
                  <span className="font-medium text-gray-900">{fmtEUR(orderTotal)}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-black text-gray-900 mb-2">Confirmando el pago…</h1>
              <p className="text-gray-500 text-sm mb-6 max-w-xs">
                Tu pago está siendo procesado. Espera un momento.
              </p>
              <div className="w-full bg-white border border-gray-100 rounded-xl p-4 mb-6 text-left shadow-sm">
                <h3 className="font-bold text-gray-900 text-sm mb-3 border-b pb-2">Resumen del Pedido</h3>
                <div className="flex justify-between mb-1.5 text-sm">
                  <span className="text-gray-500">Producto</span>
                  <span className="font-medium text-gray-900">
                    {isCartMode ? `${cartItems.length} producto${cartItems.length !== 1 ? "s" : ""}` : kit.name}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total</span>
                  <span className="font-medium text-gray-900">{fmtEUR(orderTotal)}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400">Confirmaremos tu pedido por email cuando el pago sea procesado.</p>
            </>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ── Top bar: logo + cart icon ── */}
      <header className="border-b border-gray-200 px-4 py-3 flex items-center justify-between max-w-2xl mx-auto w-full">
        <img src="/assets/eci-logo.png" alt="El Corte Inglés" className="h-8 w-auto object-contain" />
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Lock className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Pago seguro</span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pb-16 pt-4">

        {/* ── Order summary collapsible (mobile) ── */}
        <button
          type="button"
          onClick={() => setSummaryOpen(o => !o)}
          className="w-full flex items-center justify-between py-3 border-b border-gray-200 text-sm font-semibold text-[#0B8A43] mb-4"
        >
          <span className="flex items-center gap-1.5">
            {summaryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Resumen del pedido
          </span>
          <span className="font-black text-gray-900">{fmtEUR(orderTotal)}</span>
        </button>

        {summaryOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 border border-gray-100 rounded-xl overflow-hidden"
          >
            {isCartMode ? (
              <ul className="divide-y divide-gray-100">
                {cartItems.map(({ product, quantity: qty }) => (
                  <li key={product.id} className="flex gap-3 items-center p-3">
                    <div className="relative flex-shrink-0">
                      <img
                        src={product.img}
                        alt={product.shortName}
                        className="w-14 h-14 object-contain rounded-lg border border-gray-100 bg-white p-1"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/assets/kit-basico.png"; }}
                      />
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">{qty}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 line-clamp-2">{product.shortName}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-900 flex-shrink-0">{fmtEUR(product.price * qty)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex gap-3 items-center p-3">
                <div className="relative flex-shrink-0">
                  <img src={kit.img} alt={kit.name} className="w-14 h-14 object-contain rounded-lg border border-gray-100 bg-white p-1" />
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">1</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800">{kit.name}</p>
                </div>
                <span className="text-sm font-bold text-gray-900">{fmtEUR(kit.price)}</span>
              </div>
            )}
            <div className="border-t border-gray-100 px-3 py-2.5 flex items-center justify-between">
              <div className="text-xs text-gray-500 flex items-center gap-1"><Truck className="w-3.5 h-3.5 text-green-500" /> {shippingOpt.label}</div>
              <span className={`text-xs font-bold ${shippingCost === 0 ? "text-green-600" : "text-gray-900"}`}>
                {shippingCost === 0 ? "Gratis" : fmtEUR(shippingCost)}
              </span>
            </div>
            <div className="border-t border-gray-200 px-3 py-2.5 flex items-center justify-between bg-gray-50">
              <span className="text-sm font-bold text-gray-900">Total</span>
              <span className="text-base font-black text-gray-900">{fmtEUR(orderTotal)}</span>
            </div>
          </motion.div>
        )}

        {/* ── Contact ── */}
        <section className="mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-3">Contacto</h2>
          <div className="space-y-3">
            <input
              required type="email" name="email" value={formData.email} onChange={handleChange}
              placeholder="Correo electrónico"
              className="w-full px-4 py-3.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                required type="text" name="nome" value={formData.nome} onChange={handleChange}
                placeholder="Nombre completo"
                className="w-full px-4 py-3.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-sm"
              />
              <input
                required type="tel" name="telemovel" value={formData.telemovel} onChange={handleChange}
                placeholder="Teléfono celular"
                className="w-full px-4 py-3.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-sm"
              />
            </div>
            <input
              type="text" name="nif" value={formData.nif} onChange={handleChange}
              placeholder="RFC (opcional — para factura)"
              maxLength={13}
              className="w-full px-4 py-3.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-sm"
            />
          </div>
        </section>

        {/* ── Entrega ── */}
        <section id="entrega-section" className="mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-3">Entrega</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                required type="text" name="codigoPostal" value={formData.codigoPostal} onChange={handleChange}
                placeholder="Código Postal"
                className="w-full px-4 py-3.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-sm"
              />
              <input
                required type="text" name="localidade" value={formData.localidade} onChange={handleChange}
                placeholder="Colonia"
                className="w-full px-4 py-3.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-sm"
              />
            </div>
            <input
              required type="text" name="morada" value={formData.morada} onChange={handleChange}
              placeholder="Calle"
              className="w-full px-4 py-3.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                required type="text" name="numero" value={formData.numero} onChange={handleChange}
                placeholder="Número ext."
                className="w-full px-4 py-3.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-sm"
              />
              <input
                type="text" name="andar" value={formData.andar} onChange={handleChange}
                placeholder="Depto / Interior (opcional)"
                className="w-full px-4 py-3.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-sm"
              />
            </div>
            <select
              required name="distrito" value={formData.distrito} onChange={handleChange}
              className="w-full px-4 py-3.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-sm bg-white appearance-none cursor-pointer text-gray-700"
            >
              <option value="">Estado / Región</option>
              {["Aguascalientes","Baja California","Baja California Sur","Campeche","Chiapas","Chihuahua","Ciudad de México","Coahuila","Colima","Durango","Estado de México","Guanajuato","Guerrero","Hidalgo","Jalisco","Michoacán","Morelos","Nayarit","Nuevo León","Oaxaca","Puebla","Querétaro","Quintana Roo","San Luis Potosí","Sinaloa","Sonora","Tabasco","Tamaulipas","Tlaxcala","Veracruz","Yucatán","Zacatecas"].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Shipping options */}
          <div className="mt-3 flex flex-col gap-2">
            {SHIPPING_OPTIONS.map((opt) => {
              const active = selectedShipping === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleShippingChange(opt.id)}
                  className="w-full text-left rounded-xl border px-4 py-3 flex items-center justify-between transition-all"
                  style={active
                    ? { borderColor: "#0B8A43", background: "#F0FBF4" }
                    : { borderColor: "#E5E7EB", background: "#fff" }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                      style={active ? { borderColor: "#0B8A43" } : { borderColor: "#D1D5DB" }}
                    >
                      {active && <div className="w-2 h-2 rounded-full bg-[#0B8A43]" />}
                    </div>
                    <Truck className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                      <p className="text-xs text-gray-400">{opt.days}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${opt.price === 0 ? "text-green-600" : "text-gray-900"}`}>
                    {opt.price === 0 ? "Gratis" : fmtEUR(opt.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Pago ── */}
        <section className="mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-1">Pago</h2>
          <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
            <Lock className="w-3 h-3" /> Todas las transacciones son seguras y están cifradas.
          </p>

          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Placeholder enquanto o intent ainda não está pronto */}
          {!clientSecret && (
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex items-center gap-3 min-h-[64px]">
              {creatingIntent ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-400">Preparando pago seguro…</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <span className="text-sm text-gray-400">Completa tu contacto para ver las opciones de pago.</span>
                </>
              )}
            </div>
          )}

          {clientSecret && (
            <Elements key={clientSecret} stripe={stripePromise} options={{ clientSecret, locale: "es" }}>
              <StripePaymentForm
                total={orderTotal}
                orderId={orderId!}
                validateDelivery={validateDelivery}
                onSuccess={() => {
                  (window as any).fbq?.("track", "Purchase", {
                    value: orderTotal,
                    currency: "EUR",
                    content_ids: isCartMode ? cartItems.map(i => i.product.id) : [kit.id],
                    content_type: "product",
                  }, { eventID: `purchase_${orderId}` });
                  setPollConfirmed(true);
                  setStep(4);
                }}
                onError={(msg) => setError(msg)}
              />
            </Elements>
          )}
        </section>

        {/* ── Order total recap ── */}
        <div className="border-t border-gray-200 pt-4 space-y-2 mb-6">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span>{fmtEUR(baseTotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Envío · <span className="text-xs">{shippingOpt.label}</span></span>
            <span className={shippingCost === 0 ? "text-green-600 font-semibold" : "text-gray-900 font-semibold"}>
              {shippingCost === 0 ? "Gratis" : fmtEUR(shippingCost)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="font-bold text-gray-900">Total</span>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">EUR</p>
              <p className="font-black text-gray-900 text-xl">{fmtEUR(orderTotal)}</p>
            </div>
          </div>
        </div>

        {/* ── Footer links ── */}
        <div className="text-center text-[11px] text-gray-400 space-y-2">
          <div className="flex items-center justify-center gap-4">
            <CreditCard className="w-4 h-4" />
            <span className="border border-gray-300 rounded px-2 py-0.5 font-bold text-gray-500">VISA</span>
            <span className="border border-gray-300 rounded px-2 py-0.5 font-bold text-gray-500">MASTERCARD</span>
            <span className="border border-gray-300 rounded px-2 py-0.5 font-bold text-gray-500">AMEX</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Pago seguro</span>
            <span>·</span>
            <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Compra protegida</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Envío gratis</span>
          </div>
          <p>El Corte Inglés · Oferta promocional limitada</p>
        </div>

      </main>
    </div>
  );
}
