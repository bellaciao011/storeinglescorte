import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  CheckCircle, Loader2, AlertCircle, ShoppingBag, ChevronDown, ChevronUp, Lock, ShieldCheck, Truck,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { kits } from "@/lib/kits";
import { readUtms } from "@/lib/utm";
import { apiUrl } from "@/lib/api";
import { CART_STORAGE_KEY, type CartItem } from "@/lib/CartContext";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "");

const fmtEUR = (n: number) =>
  n.toLocaleString("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });

function StripePaymentForm({
  total,
  orderId,
  onSuccess,
  onError,
  formRef,
}: {
  total: number;
  orderId: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
  formRef: React.RefObject<HTMLFormElement | null>;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    if (!formRef.current?.checkValidity()) {
      formRef.current?.reportValidity();
      return;
    }
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
        className="mt-5 w-full py-4 rounded-xl font-black text-white text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #0B8A43, #23B05C)" }}
      >
        {loading
          ? <><Loader2 className="w-5 h-5 animate-spin" /> Procesando…</>
          : <><Lock className="w-4 h-4" /> Pagar ahora — {fmtEUR(total)}</>
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

  const [step, setStep] = useState(1);
  const [error, setError] = useState<string>("");
  const [quantity] = useState(1);
  const [showSummary, setShowSummary] = useState(false);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [pollConfirmed, setPollConfirmed] = useState(false);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const piAmountRef = useRef<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const cartSubtotal = isCartMode ? cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0) : 0;
  const orderTotal = isCartMode ? cartSubtotal : kit.price * quantity;

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnOrderId = params.get("orderId");
    const redirectStatus = params.get("redirect_status");
    if (returnOrderId && redirectStatus === "succeeded") {
      setOrderId(returnOrderId);
      setStep(4);
    }
  }, []);

  // Create PI automatically once user enters a valid email and amount > 0
  const piCreatedRef = useRef(false);
  useEffect(() => {
    if (piCreatedRef.current || clientSecret || creatingIntent) return;
    if (!formData.email.includes("@") || !formData.email.includes(".")) return;
    if (orderTotal <= 0) return;
    piCreatedRef.current = true;
    handleCreateIntent();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.email, orderTotal]);

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
        : [{ id: kit.id, name: kit.name, quantity, price: kit.price }];

      const firstItem = isCartMode && cartItems.length > 0 ? cartItems[0].product : kit;

      const res = await Promise.race([
        fetch(apiUrl("/api/payment/create"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: orderTotal,
            customerEmail: formData.email,
            customerName: formData.nome || formData.email.split("@")[0] || "Cliente",
            customerPhone: formData.telemovel,
            customerDocument: formData.nif,
            shippingAddress: addr,
            shippingPostalCode: formData.codigoPostal,
            shippingCity: formData.localidade,
            shippingDistrict: formData.distrito,
            kitId: firstItem.id,
            productName: isCartMode
              ? `Pedido (${cartItems.length} producto${cartItems.length !== 1 ? "s" : ""})`
              : kit.name,
            quantity: isCartMode ? cartItems.reduce((s, i) => s + i.quantity, 0) : quantity,
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
      setClientSecret(data.clientSecret ?? null);
      setOrderId(data.orderId ?? null);
    } catch {
      setError("No fue posible conectar con el servidor de pagos. Verifica tu conexión e inténtalo de nuevo.");
    } finally {
      setCreatingIntent(false);
    }
  };

  const handleProceed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current?.checkValidity()) {
      formRef.current?.reportValidity();
      return;
    }
    (window as any).fbq?.("track", "InitiateCheckout", {
      value: orderTotal,
      currency: "MXN",
      content_type: "product",
    });
    await handleCreateIntent();
  };

  const OrderSummaryContent = () => (
    <div>
      {isCartMode ? (
        <ul className="divide-y divide-gray-100">
          {cartItems.map(({ product, quantity: qty }) => (
            <li key={product.id} className="py-3 flex gap-3 items-center">
              <div className="relative flex-shrink-0">
                <img
                  src={product.img}
                  alt={product.shortName}
                  className="w-14 h-14 object-contain rounded-lg border border-gray-200 bg-white p-1"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/assets/kit-basico.png"; }}
                />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {qty}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug">{product.shortName}</p>
                <p className="text-[10px] text-gray-400">{product.shortName}</p>
              </div>
              <span className="text-sm font-bold text-gray-900 flex-shrink-0">{fmtEUR(product.price * qty)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="py-3 flex gap-3 items-center">
          <div className="relative flex-shrink-0">
            <img
              src={kit.img}
              alt={kit.name}
              className="w-14 h-14 object-contain rounded-lg border border-gray-200 bg-white p-1"
              onError={(e) => { (e.target as HTMLImageElement).src = "/assets/kit-basico.png"; }}
            />
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {quantity}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug">{kit.name}</p>
            <p className="text-[10px] text-gray-400">{kit.contents}</p>
          </div>
          <span className="text-sm font-bold text-gray-900 flex-shrink-0">{fmtEUR(kit.price * quantity)}</span>
        </div>
      )}

      <div className="border-t border-gray-200 mt-2 pt-3 space-y-2">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Subtotal</span>
          <span className="font-medium text-gray-900">{fmtEUR(orderTotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span className="flex items-center gap-1">Envío</span>
          <span className="font-medium text-[#0B8A43]">Gratis</span>
        </div>
      </div>
      <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between items-baseline">
        <span className="font-bold text-gray-900 text-base">Total</span>
        <div className="text-right">
          <span className="text-xs text-gray-400 mr-1">EUR</span>
          <span className="text-2xl font-black text-gray-900">{fmtEUR(orderTotal)}</span>
        </div>
      </div>
    </div>
  );

  if (step === 4) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="w-full border-b border-gray-200 px-6 py-4 flex items-center justify-center">
          <img src="/assets/eci-logo.png" alt="El Corte Inglés" className="h-8 w-auto object-contain" />
        </header>
        <main className="flex-1 flex flex-col items-center px-4 py-16">
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
            <div className="max-w-sm w-full text-center">
              <h1 className="text-2xl font-black text-green-700 mb-2">¡Pedido confirmado!</h1>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Tu pedido fue recibido con éxito. Recibirás un correo de confirmación en breve.
              </p>
              {trackingCode && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 text-center">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Código de rastreo</p>
                  <p className="text-2xl font-black text-gray-900 font-mono tracking-widest mb-3">{trackingCode}</p>
                  <a href={`/rastreio?codigo=${trackingCode}`}
                    className="inline-block bg-[#0B8A43] text-white text-sm font-bold px-5 py-2 rounded-lg hover:bg-green-700 transition-colors">
                    Rastrear mi pedido →
                  </a>
                </div>
              )}
              <div className="bg-white border border-gray-200 rounded-xl p-4 text-left">
                <h3 className="font-bold text-gray-900 text-sm mb-3 border-b pb-2">Resumen del Pedido</h3>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-400">Producto</span>
                  <span className="font-medium text-gray-900">
                    {isCartMode ? `${cartItems.length} producto${cartItems.length !== 1 ? "s" : ""}` : kit.name}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total</span>
                  <span className="font-bold text-gray-900">{fmtEUR(orderTotal)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-sm w-full text-center">
              <h1 className="text-2xl font-black text-gray-900 mb-2">Confirmando el pago…</h1>
              <p className="text-gray-400 text-sm">Tu pago está siendo procesado. Espera un momento.</p>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── Header ── */}
      <header className="w-full border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="w-8" />
        <img src="/assets/eci-logo.png" alt="El Corte Inglés" className="h-8 w-auto object-contain" />
        <button onClick={() => setLocation("/")} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ShoppingBag className="w-6 h-6" />
        </button>
      </header>

      {/* ── Mobile: collapsible order summary ── */}
      <div className="lg:hidden border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setShowSummary(s => !s)}
          className="w-full flex items-center justify-between px-5 py-3.5"
        >
          <span className="flex items-center gap-2 text-[#0B8A43] font-semibold text-sm">
            <ShoppingBag className="w-4 h-4" />
            Resumen del pedido
            {showSummary ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
          <span className="text-gray-900 font-black text-base">{fmtEUR(orderTotal)}</span>
        </button>
        {showSummary && (
          <div className="px-5 pb-4 bg-white border-t border-gray-100">
            <OrderSummaryContent />
          </div>
        )}
      </div>

      {/* ── Main ── */}
      <main className="max-w-5xl mx-auto px-4 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-[1fr_400px] lg:gap-16">

          {/* ── Left: Form ── */}
          <form ref={formRef} onSubmit={handleProceed} noValidate className="flex flex-col gap-8 pb-12">

            {/* Contact */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Contacto</h2>
              <input
                required
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Correo electrónico"
                className="w-full px-4 py-3.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B8A43] focus:border-[#0B8A43] transition-all"
              />
            </section>

            {/* Delivery */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Envío</h2>
              <div className="flex flex-col gap-3">
                <select
                  required
                  name="distrito"
                  value={formData.distrito}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 rounded-lg border border-gray-300 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B8A43] focus:border-[#0B8A43] transition-all bg-white appearance-none cursor-pointer"
                >
                  <option value="">Estado / Región</option>
                  {["Aguascalientes","Baja California","Baja California Sur","Campeche","Chiapas","Chihuahua","Ciudad de México","Coahuila","Colima","Durango","Estado de México","Guanajuato","Guerrero","Hidalgo","Jalisco","Michoacán","Morelos","Nayarit","Nuevo León","Oaxaca","Puebla","Querétaro","Quintana Roo","San Luis Potosí","Sinaloa","Sonora","Tabasco","Tamaulipas","Tlaxcala","Veracruz","Yucatán","Zacatecas"].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    placeholder="Nombre (opcional)"
                    className="w-full px-4 py-3.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B8A43] focus:border-[#0B8A43] transition-all"
                  />
                  <input
                    required
                    type="text"
                    name="localidade"
                    value={formData.localidade}
                    onChange={handleChange}
                    placeholder="Apellidos"
                    className="w-full px-4 py-3.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B8A43] focus:border-[#0B8A43] transition-all"
                  />
                </div>

                <input
                  required
                  type="text"
                  name="morada"
                  value={formData.morada}
                  onChange={handleChange}
                  placeholder="Dirección"
                  className="w-full px-4 py-3.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B8A43] focus:border-[#0B8A43] transition-all"
                />

                <input
                  type="text"
                  name="andar"
                  value={formData.andar}
                  onChange={handleChange}
                  placeholder="Apartamento, piso, etc. (opcional)"
                  className="w-full px-4 py-3.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B8A43] focus:border-[#0B8A43] transition-all"
                />

                <div className="grid grid-cols-2 gap-3">
                  <input
                    required
                    type="text"
                    name="codigoPostal"
                    value={formData.codigoPostal}
                    onChange={handleChange}
                    placeholder="Código postal"
                    className="w-full px-4 py-3.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B8A43] focus:border-[#0B8A43] transition-all"
                  />
                  <input
                    required
                    type="text"
                    name="telemovel"
                    value={formData.telemovel}
                    onChange={handleChange}
                    placeholder="Teléfono"
                    className="w-full px-4 py-3.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B8A43] focus:border-[#0B8A43] transition-all"
                  />
                </div>
              </div>
            </section>

            {/* Delivery mode */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Modo de entrega</h2>
              <div className="border border-gray-200 rounded-lg p-4 flex items-center gap-3">
                <Truck className="w-5 h-5 text-[#0B8A43] flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Envío estándar gratuito</p>
                  <p className="text-xs text-gray-400">3–5 días hábiles · Todo México</p>
                </div>
                <span className="text-sm font-bold text-[#0B8A43]">Gratis</span>
              </div>
            </section>

            {/* Payment */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Pago</h2>
              <p className="text-sm text-gray-400 mb-4 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-gray-400" />
                Todas las transacciones son seguras y están cifradas.
              </p>

              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Skeleton card fields shown until PI is ready */}
              {!clientSecret && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* Card number row */}
                  <div className="px-4 py-3.5 border-b border-gray-200 flex items-center justify-between">
                    <span className="text-sm text-gray-400">Número de tarjeta</span>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-5 bg-blue-600 rounded-sm flex items-center justify-center text-white text-[8px] font-bold">VISA</div>
                      <div className="w-8 h-5 bg-red-600 rounded-full opacity-70" style={{ background: "linear-gradient(90deg,#eb001b 50%,#f79e1b 50%)" }} />
                    </div>
                  </div>
                  {/* Expiry + CVC */}
                  <div className="grid grid-cols-2 divide-x divide-gray-200">
                    <div className="px-4 py-3.5">
                      <span className="text-sm text-gray-400">Fecha de expiración</span>
                    </div>
                    <div className="px-4 py-3.5 flex items-center justify-between">
                      <span className="text-sm text-gray-400">Código de seguridad</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading spinner when creating PI */}
              {creatingIntent && (
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0B8A43]" />
                  Cargando formulario de pago…
                </div>
              )}

              {/* Stripe PaymentElement once PI is ready */}
              {clientSecret && (
                <Elements key={clientSecret} stripe={stripePromise} options={{ clientSecret, locale: "es" }}>
                  <StripePaymentForm
                    total={orderTotal}
                    orderId={orderId!}
                    formRef={formRef}
                    onSuccess={() => {
                      (window as any).fbq?.("track", "Purchase", {
                        value: orderTotal,
                        currency: "MXN",
                        content_type: "product",
                      }, { eventID: `purchase_${orderId}` });
                      setPollConfirmed(true);
                      setStep(4);
                    }}
                    onError={(msg) => setError(msg)}
                  />
                </Elements>
              )}

              {/* Fallback pay button if PI not created yet (handles case where email was skipped) */}
              {!clientSecret && !creatingIntent && (
                <button
                  type="submit"
                  className="mt-4 w-full py-4 rounded-xl font-black text-white text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #0B8A43, #23B05C)" }}
                >
                  <Lock className="w-4 h-4" /> Pagar ahora — {fmtEUR(orderTotal)}
                </button>
              )}

              <div className="flex items-center justify-center gap-4 mt-5">
                <Lock className="w-3.5 h-3.5 text-gray-300" />
                <span className="text-[11px] text-gray-400">Pago cifrado SSL</span>
                <span className="text-gray-200">·</span>
                <span className="text-[11px] text-gray-400">Garantía 7 días</span>
                <span className="text-gray-200">·</span>
                <span className="text-[11px] text-gray-400">Envío gratis</span>
              </div>
            </section>

          </form>

          {/* ── Right: Order summary (desktop) ── */}
          <div className="hidden lg:block border-l border-gray-200 pl-10 py-2">
            <OrderSummaryContent />
          </div>

        </div>
      </main>
    </div>
  );
}
