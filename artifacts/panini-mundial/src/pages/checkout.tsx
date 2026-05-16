import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ChevronRight, CheckCircle2, ShieldCheck, Truck, Lock,
  CreditCard, CheckCircle, Loader2, AlertCircle,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Header } from "@/components/Header";
import { kits } from "@/lib/kits";
import { readUtms } from "@/lib/utm";
import { apiUrl } from "@/lib/api";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "");

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
    <div className="mt-4">
      <PaymentElement
        options={{
          layout: "tabs",
          terms: { card: "never" },
        }}
      />
      <div className="flex gap-3 mt-5 mb-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-shrink-0 px-5 py-4 rounded-full border-2 border-gray-300 text-gray-700 font-black text-sm hover:border-gray-400 transition-all"
        >
          VOLVER
        </button>
        <button
          type="button"
          onClick={handlePay}
          disabled={loading || !stripe || !elements}
          className="flex-1 bg-primary hover:bg-green-700 disabled:opacity-60 text-white font-black text-base py-4 rounded-full flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          {loading
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Procesando…</>
            : <>Pagar ${total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} →</>
          }
        </button>
      </div>
    </div>
  );
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const kitId = searchParams.get("kit") || "campeao";
  const kit = kits.find((k) => k.id === kitId) || kits[2];

  const utmParams = readUtms();

  const [step, setStep] = useState(1);
  const [error, setError] = useState<string>("");
  const [selectedBumps, setSelectedBumps] = useState<Set<string>>(new Set());
  const [quantity, setQuantity] = useState(1);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [pollConfirmed, setPollConfirmed] = useState(false);
  const piAmountRef = useRef<number | null>(null);

  const fmtMXN = (n: number) => `$${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

  const orderBumps = [
    { id: "bump50", label: "+50 sobres · ~350 cromos", desc: "Descuento de preventa con envío gratis en México.", price: 699, oldPrice: 1299, img: "/assets/bump-sobres.png", badge: null },
    { id: "bump100", label: "+100 sobres · ~700 cromos", desc: "El equilibrio preferido de los coleccionistas — preventa exclusiva.", price: 1299, oldPrice: 2499, img: "/assets/bump-sobres.png", badge: { text: "MÁS VENDIDO", cls: "bg-red-600 text-white" } },
    { id: "bump250", label: "+250 sobres · ~1,750 cromos", desc: "Máximo descuento en este lote promocional.", price: 2999, oldPrice: 5999, img: "/assets/bump-sobres.png", badge: { text: "ÚLTIMAS UNIDADES", cls: "bg-amber-400 text-gray-900" } },
  ];

  const bumpsTotal = orderBumps.filter(b => selectedBumps.has(b.id)).reduce((s, b) => s + b.price, 0);
  const orderTotal = kit.price * quantity + bumpsTotal;

  const toggleBump = (id: string) => {
    setSelectedBumps(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

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

  // Auto-create PI when user enters step 3
  useEffect(() => {
    if (step !== 3 || clientSecret || creatingIntent) return;
    handleCreateIntent();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Update PI amount silently when bumps change (debounced)
  useEffect(() => {
    if (!orderId || !clientSecret) return;
    if (piAmountRef.current === null) {
      piAmountRef.current = orderTotal;
      return;
    }
    if (piAmountRef.current === orderTotal) return;
    piAmountRef.current = orderTotal;

    const items = [
      { id: kit.id, name: kit.name, quantity, price: kit.price },
      ...orderBumps.filter(b => selectedBumps.has(b.id)).map(b => ({
        id: b.id, name: b.label, quantity: 1, price: b.price,
      })),
    ];

    const piId = clientSecret.split("_secret_")[0];
    const t = setTimeout(() => {
      fetch(apiUrl("/api/payment/update-intent"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ piId, amount: orderTotal, items }),
      }).catch(() => { /* silent — payment will use confirmed amount */ });
    }, 400);

    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, clientSecret, orderTotal]);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (step < 3) {
      const nextStep = step + 1;
      setStep(nextStep);
      if (nextStep === 3) {
        (window as any).fbq?.("track", "InitiateCheckout", {
          value: orderTotal,
          currency: "MXN",
          content_ids: [kit.id],
          content_type: "product",
          num_items: quantity + selectedBumps.size,
        });
      }
    }
  };

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

      const items = [
        { id: kit.id, name: kit.name, quantity, price: kit.price },
        ...orderBumps.filter(b => selectedBumps.has(b.id)).map(b => ({
          id: b.id, name: b.label, quantity: 1, price: b.price,
        })),
      ];

      const res = await Promise.race([
        fetch(apiUrl("/api/payment/create"), {
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
            kitId: kit.id,
            productName: "Kit Panini FIFA World Cup 2026",
            quantity,
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
          const data = await r.json() as { status: string };
          if (data.status === "paid") {
            clearInterval(pollingRef.current!);
            setPollConfirmed(true);
          }
        }
      } catch { }

      if (attempts >= MAX_ATTEMPTS) clearInterval(pollingRef.current!);
    }, 5000);

    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [step, orderId]);

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
              <h1 className="text-2xl font-black text-green-700 mb-2">¡Pago confirmado!</h1>
              <p className="text-gray-500 text-sm mb-6">Redirigiendo a tu oferta especial…</p>
              <Loader2 className="w-6 h-6 text-green-500 animate-spin mx-auto" />
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
                  <span className="font-medium text-gray-900">{kit.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total</span>
                  <span className="font-medium text-gray-900">{fmtMXN(orderTotal)}</span>
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pb-12">
      <Header />

      <main className="w-full max-w-5xl mx-auto px-4 pt-6 pb-4">

        <div className="flex items-center justify-between px-2 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${step >= i ? "bg-primary text-white" : "bg-gray-200 text-gray-400"}`}>
                {step > i ? <CheckCircle2 className="w-5 h-5" /> : i}
              </div>
              <span className={`ml-2 text-xs md:text-sm font-semibold ${step >= i ? "text-gray-900" : "text-gray-400"}`}>
                {i === 1 ? "Pedido" : i === 2 ? "Envío" : "Pago"}
              </span>
              {i < 3 && <div className={`w-8 md:w-16 h-1 mx-2 rounded ${step > i ? "bg-primary" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <div className="lg:col-span-5 lg:col-start-8 lg:row-start-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
              <div className="relative overflow-hidden bg-gray-50 border-b border-gray-100">
                <img src={kit.img} alt={kit.name} className="w-full h-28 lg:h-36 object-contain py-2 px-8" />
                <div
                  className="absolute top-[28px] right-[-36px] w-[148px] text-center py-[5px] rotate-45 shadow-lg"
                  style={{ background: "linear-gradient(135deg, #f5a623 0%, #fbbf24 40%, #f5a623 100%)" }}
                >
                  <span className="text-[10px] font-black tracking-[0.18em] uppercase text-[#7c4a00]">Promoción</span>
                </div>
              </div>
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="font-bold text-gray-900 text-sm">{kit.name}</p>
                  <span className="text-xs font-black text-primary">{fmtMXN(kit.price)}</span>
                </div>
                <p className="text-xs text-gray-400 mb-1">{kit.contents}</p>
                <div className="flex items-center gap-1 text-yellow-500 text-xs mb-3">
                  ★★★★★ <span className="text-gray-400">4.9 · +2,200 calificaciones</span>
                </div>

                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 mb-3 border border-gray-200">
                  <span className="text-xs font-semibold text-gray-700">Cantidad</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-7 h-7 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 font-black hover:border-primary hover:text-primary transition-all text-sm"
                    >−</button>
                    <span className="w-6 text-center font-black text-gray-900 text-sm">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(q => Math.min(10, q + 1))}
                      className="w-7 h-7 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 font-black hover:border-primary hover:text-primary transition-all text-sm"
                    >+</button>
                  </div>
                </div>

                <div className="space-y-1 border-t border-gray-100 pt-2">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Precio normal</span>
                    <span className="line-through">{fmtMXN(kit.oldPrice * quantity)}</span>
                  </div>
                  {quantity > 1 && (
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{kit.name} × {quantity}</span>
                      <span>{fmtMXN(kit.price * quantity)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Envío</span>
                    <span className="text-green-600 font-semibold">Gratis</span>
                  </div>
                  {orderBumps.filter(b => selectedBumps.has(b.id)).map(b => (
                    <div key={b.id} className="flex justify-between text-xs text-gray-500">
                      <span className="truncate pr-2">{b.label}</span>
                      <span className="flex-shrink-0">+{fmtMXN(b.price)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="font-bold text-gray-900 text-xs">Total</span>
                    <span className="text-base font-black text-primary">{fmtMXN(orderTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 lg:col-start-1 lg:row-start-1 flex flex-col gap-6">

            <form onSubmit={handleNext} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">1. Tus datos</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico *</label>
                      <input required type="email" name="email" value={formData.email} onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        placeholder="nombre@gmail.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                      <input required type="text" name="nome" value={formData.nome} onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        placeholder="Nombre y apellidos" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono celular *</label>
                      <input required type="tel" name="telemovel" value={formData.telemovel} onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        placeholder="55 1234 5678" />
                      <p className="text-xs text-gray-500 mt-1">Para notificaciones de entrega por SMS.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">RFC (opcional)</label>
                      <input type="text" name="nif" value={formData.nif} onChange={handleChange}
                        maxLength={13} minLength={12}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        placeholder="XAXX010101000" />
                      <p className="text-xs text-gray-500 mt-1">Necesario para emisión de factura.</p>
                    </div>
                  </div>
                  <button type="submit"
                    className="mt-8 w-full bg-primary hover:bg-green-700 text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                    Continuar <ChevronRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-6">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-xl font-bold text-gray-900">Dirección de entrega</h2>
                    <button type="button" onClick={() => setStep(1)} className="text-sm text-primary font-medium hover:underline">Editar datos</button>
                  </div>
                  <p className="text-sm text-gray-400 mb-6 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-green-500" /> Envío gratis a todo México
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1.5">Código Postal <span className="text-red-500">*</span></label>
                      <input required type="text" name="codigoPostal" value={formData.codigoPostal} onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white"
                        placeholder="C.P. 00000" />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1.5">Calle y número <span className="text-red-500">*</span></label>
                      <input required type="text" name="morada" value={formData.morada} onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white"
                        placeholder="Ej. Insurgentes Sur 1647" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1.5">Número ext. <span className="text-red-500">*</span></label>
                        <input required type="text" name="numero" value={formData.numero} onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white"
                          placeholder="123" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1.5">Depto / Interior</label>
                        <input type="text" name="andar" value={formData.andar} onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white"
                          placeholder="Apto 4B" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1.5">Colonia <span className="text-red-500">*</span></label>
                      <input required type="text" name="localidade" value={formData.localidade} onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white"
                        placeholder="Roma Norte" />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1.5">Estado <span className="text-red-500">*</span></label>
                      <select required name="distrito" value={formData.distrito} onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white appearance-none cursor-pointer text-gray-700">
                        <option value="">Selecciona...</option>
                        {["Aguascalientes","Baja California","Baja California Sur","Campeche","Chiapas","Chihuahua","Ciudad de México","Coahuila","Colima","Durango","Estado de México","Guanajuato","Guerrero","Hidalgo","Jalisco","Michoacán","Morelos","Nayarit","Nuevo León","Oaxaca","Puebla","Querétaro","Quintana Roo","San Luis Potosí","Sinaloa","Sonora","Tabasco","Tamaulipas","Tlaxcala","Veracruz","Yucatán","Zacatecas"].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button type="submit"
                    className="mt-8 w-full bg-primary hover:bg-green-700 text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                    Continuar <ChevronRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>

                  <div className="bg-green-50 border-b border-green-100 px-5 py-3">
                    <p className="text-sm font-black text-primary text-center">Aprovecha y lleva más sobres con precio promocional</p>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {orderBumps.map(bump => {
                      const active = selectedBumps.has(bump.id);
                      return (
                        <div key={bump.id} className={`p-4 transition-colors ${active ? "bg-green-50" : "bg-white"}`}>
                          <div className="flex gap-3 mb-3">
                            <img src={bump.img} alt={bump.label} className="w-16 h-16 object-contain rounded-lg border border-gray-100 bg-white flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                                <span className="font-bold text-gray-900 text-sm">{bump.label}</span>
                                {bump.badge && (
                                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${bump.badge.cls}`}>{bump.badge.text}</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mb-1.5">{bump.desc}</p>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-xs text-gray-400 line-through">{fmtMXN(bump.oldPrice)}</span>
                                <span className="text-lg font-black text-primary">{fmtMXN(bump.price)}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleBump(bump.id)}
                            className={`w-full py-2.5 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                              active
                                ? "border-primary bg-primary text-white"
                                : "border-primary text-primary bg-white hover:bg-green-50"
                            }`}
                          >
                            {active ? <><CheckCircle className="w-4 h-4" /> Agregado</> : <>+ Agregar al pedido</>}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="px-5 pt-5 pb-3 border-t border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-0.5">Pago</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Pago 100% seguro y encriptado</p>

                    {error && (
                      <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    )}

                      <div className="border-t border-gray-100 pt-4 space-y-2 mb-5">
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Envío</span>
                          <span className="text-primary font-semibold">Gratis</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>{kit.name}{quantity > 1 ? ` × ${quantity}` : ""}</span>
                          <span>{fmtMXN(kit.price * quantity)}</span>
                        </div>
                        {orderBumps.filter(b => selectedBumps.has(b.id)).map(b => (
                          <div key={b.id} className="flex justify-between text-sm text-gray-600">
                            <span className="text-xs">{b.label}</span>
                            <span>{fmtMXN(b.price)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                          <span className="font-black text-gray-900 text-base">Total</span>
                          <span className="font-black text-primary text-xl">{fmtMXN(orderTotal)}</span>
                        </div>
                      </div>

                    {creatingIntent && (
                      <div className="flex items-center justify-center gap-3 py-10 text-gray-500">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span className="text-sm font-medium">A preparar pagamento…</span>
                      </div>
                    )}

                    {clientSecret && (
                      <Elements
                        key={clientSecret}
                        stripe={stripePromise}
                        options={{ clientSecret, locale: "es" }}
                      >
                        <StripePaymentForm
                          total={orderTotal}
                          orderId={orderId!}
                          onSuccess={() => {
                            (window as any).fbq?.("track", "Purchase", {
                              value: orderTotal,
                              currency: "MXN",
                              content_ids: [kit.id, ...Array.from(selectedBumps)],
                              content_type: "product",
                            }, { eventID: `purchase_${orderId}` });
                            setPollConfirmed(true);
                            setStep(4);
                          }}
                          onError={(msg) => setError(msg)}
                          onBack={() => { setClientSecret(null); setOrderId(null); piAmountRef.current = null; setStep(2); }}
                        />
                      </Elements>
                    )}

                    <p className="text-center text-[11px] text-gray-400 mb-3">Compra segura SSL · Garantía de 7 días · Envío gratis México</p>
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-black text-gray-500 border border-gray-300 rounded px-2 py-0.5">VISA</span>
                      <span className="text-xs font-black text-gray-500 border border-gray-300 rounded px-2 py-0.5">MASTERCARD</span>
                    </div>
                    <p className="text-center text-[10px] text-gray-400">Panini México S.A. de C.V. · Av. Insurgentes Sur 1647, CDMX<br />RFC: PMX260101AAA</p>
                  </div>
                </motion.div>
              )}
            </form>

            {step < 3 && (
              <div className="flex justify-center gap-6">
                <div className="flex flex-col items-center gap-1 text-gray-500">
                  <Lock className="w-5 h-5 text-gray-400" />
                  <span className="text-[10px] font-medium uppercase tracking-wider">Pago seguro</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-gray-500">
                  <ShieldCheck className="w-5 h-5 text-gray-400" />
                  <span className="text-[10px] font-medium uppercase tracking-wider">Compra protegida</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-gray-500">
                  <Truck className="w-5 h-5 text-gray-400" />
                  <span className="text-[10px] font-medium uppercase tracking-wider">Envío gratis</span>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
