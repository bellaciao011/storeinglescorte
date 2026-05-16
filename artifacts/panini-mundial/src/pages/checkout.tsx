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
      onError(submitErr.message ?? "Erro no formulário de pagamento.");
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
      onError(error.message ?? "Pagamento recusado. Verifica os dados e tenta novamente.");
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
          VOLTAR
        </button>
        <button
          type="button"
          onClick={handlePay}
          disabled={loading || !stripe || !elements}
          className="flex-1 bg-primary hover:bg-green-700 disabled:opacity-60 text-white font-black text-base py-4 rounded-full flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          {loading
            ? <><Loader2 className="w-5 h-5 animate-spin" /> A processar…</>
            : <>Pagar €{total.toFixed(2).replace(".", ",")} →</>
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

  const orderBumps = [
    { id: "bump50", label: "+50 saquetas · ~250 cromos", desc: "Desconto de pré-venda com portes grátis em Portugal.", price: 30, oldPrice: 40, img: "/assets/kit-iniciante.png", badge: null },
    { id: "bump100", label: "+100 saquetas · ~500 cromos", desc: "O equilíbrio preferido dos colecionadores — pré-venda exclusiva.", price: 55, oldPrice: 125, img: "/assets/kit-campeao.png", badge: { text: "MAIS VENDIDO", cls: "bg-red-600 text-white" } },
    { id: "bump250", label: "+250 saquetas · ~1250 cromos", desc: "Máximo desconto neste lote promocional.", price: 100, oldPrice: 625, img: "/assets/kit-colecionador.png", badge: { text: "ÚLTIMAS UNIDADES", cls: "bg-amber-400 text-gray-900" } },
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

    const t = setTimeout(() => {
      fetch("/api/payment/update-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, amount: orderTotal, items }),
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
          currency: "EUR",
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
        fetch("/api/payment/create-intent", {
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
            productName: `${quantity}x ${kit.name}`,
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
        setError(data.error ?? "Erro ao iniciar pagamento. Tenta novamente.");
        setCreatingIntent(false);
        return;
      }

      sessionStorage.setItem("pendingOrderId", data.orderId ?? "");
      sessionStorage.setItem("upsell_customer", JSON.stringify({
        name: formData.nome,
        email: formData.email,
        phone: formData.telemovel,
        mbwayPhone: formData.telemovel,
        address: addr,
      }));

      setClientSecret(data.clientSecret ?? null);
      setOrderId(data.orderId ?? null);
    } catch {
      setError("Não foi possível ligar ao servidor de pagamentos. Verifica a tua ligação e tenta novamente.");
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
        const r = await fetch(`/api/public/payment-status?orderId=${encodeURIComponent(orderId)}`);
        if (r.ok) {
          const data = await r.json() as { status: string };
          if (data.status === "PAID") {
            clearInterval(pollingRef.current!);
            setPollConfirmed(true);
            setTimeout(() => setLocation("/upsell"), 1500);
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
              <h1 className="text-2xl font-black text-green-700 mb-2">Pagamento confirmado!</h1>
              <p className="text-gray-500 text-sm mb-6">A redirecionar para a tua oferta especial…</p>
              <Loader2 className="w-6 h-6 text-green-500 animate-spin mx-auto" />
            </>
          ) : (
            <>
              <h1 className="text-2xl font-black text-gray-900 mb-2">A confirmar o pagamento…</h1>
              <p className="text-gray-500 text-sm mb-6 max-w-xs">
                O teu pagamento está a ser processado. Aguarda um momento.
              </p>
              <div className="w-full bg-white border border-gray-100 rounded-xl p-4 mb-6 text-left shadow-sm">
                <h3 className="font-bold text-gray-900 text-sm mb-3 border-b pb-2">Resumo da Encomenda</h3>
                <div className="flex justify-between mb-1.5 text-sm">
                  <span className="text-gray-500">Produto</span>
                  <span className="font-medium text-gray-900">{kit.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total</span>
                  <span className="font-medium text-gray-900">€{orderTotal.toFixed(2).replace(".", ",")}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400">Confirmaremos a encomenda por email assim que o pagamento for processado.</p>
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
                {i === 1 ? "Encomenda" : i === 2 ? "Entrega" : "Pagamento"}
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
                  <span className="text-[10px] font-black tracking-[0.18em] uppercase text-[#7c4a00]">Promoção</span>
                </div>
              </div>
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="font-bold text-gray-900 text-sm">{kit.name}</p>
                  <span className="text-xs font-black text-primary">€{kit.price.toFixed(2).replace(".", ",")}</span>
                </div>
                <p className="text-xs text-gray-400 mb-1">{kit.contents}</p>
                <div className="flex items-center gap-1 text-yellow-500 text-xs mb-3">
                  ★★★★★ <span className="text-gray-400">4,9 · +2.200 avaliações</span>
                </div>

                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 mb-3 border border-gray-200">
                  <span className="text-xs font-semibold text-gray-700">Quantidade</span>
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
                    <span>Preço normal</span>
                    <span className="line-through">€{(kit.oldPrice * quantity).toFixed(2).replace(".", ",")}</span>
                  </div>
                  {quantity > 1 && (
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{kit.name} × {quantity}</span>
                      <span>€{(kit.price * quantity).toFixed(2).replace(".", ",")}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Portes de envio</span>
                    <span className="text-green-600 font-semibold">Grátis</span>
                  </div>
                  {orderBumps.filter(b => selectedBumps.has(b.id)).map(b => (
                    <div key={b.id} className="flex justify-between text-xs text-gray-500">
                      <span className="truncate pr-2">{b.label}</span>
                      <span className="flex-shrink-0">+€{b.price.toFixed(2).replace(".", ",")}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="font-bold text-gray-900 text-xs">Total c/ IVA</span>
                    <span className="text-base font-black text-primary">€{orderTotal.toFixed(2).replace(".", ",")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 lg:col-start-1 lg:row-start-1 flex flex-col gap-6">

            <form onSubmit={handleNext} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">1. Os teus dados</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input required type="email" name="email" value={formData.email} onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        placeholder="nome@gmail.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
                      <input required type="text" name="nome" value={formData.nome} onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        placeholder="Nome e apelido" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telemóvel *</label>
                      <input required type="tel" name="telemovel" value={formData.telemovel} onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        placeholder="9XX XXX XXX" />
                      <p className="text-xs text-gray-500 mt-1">Para notificações de entrega por SMS.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">NIF *</label>
                      <input required type="text" name="nif" value={formData.nif} onChange={handleChange}
                        maxLength={9} minLength={9}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        placeholder="123456789" />
                      <p className="text-xs text-gray-500 mt-1">Necessário para emissão de factura.</p>
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
                    <h2 className="text-xl font-bold text-gray-900">Endereço de entrega</h2>
                    <button type="button" onClick={() => setStep(1)} className="text-sm text-primary font-medium hover:underline">Editar dados</button>
                  </div>
                  <p className="text-sm text-gray-400 mb-6 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-green-500" /> Portes grátis para todo Portugal
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1.5">Código postal <span className="text-red-500">*</span></label>
                      <input required type="text" name="codigoPostal" value={formData.codigoPostal} onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white"
                        placeholder="0000-000" />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1.5">Morada <span className="text-red-500">*</span></label>
                      <input required type="text" name="morada" value={formData.morada} onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white"
                        placeholder="Rua / Avenida" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1.5">Número <span className="text-red-500">*</span></label>
                        <input required type="text" name="numero" value={formData.numero} onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white"
                          placeholder="42" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1.5">Andar / Fração</label>
                        <input type="text" name="andar" value={formData.andar} onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white"
                          placeholder="2º Esq." />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1.5">Localidade <span className="text-red-500">*</span></label>
                      <input required type="text" name="localidade" value={formData.localidade} onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white"
                        placeholder="Lisboa" />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1.5">Distrito <span className="text-red-500">*</span></label>
                      <select required name="distrito" value={formData.distrito} onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white appearance-none cursor-pointer text-gray-700">
                        <option value="">Selecione...</option>
                        {["Aveiro","Beja","Braga","Bragança","Castelo Branco","Coimbra","Évora","Faro","Guarda","Leiria","Lisboa","Portalegre","Porto","Santarém","Setúbal","Viana do Castelo","Vila Real","Viseu","Açores","Madeira"].map(d => (
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
                    <p className="text-sm font-black text-primary text-center">Aproveita e leva mais saquetas com preço promocional</p>
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
                                <span className="text-xs text-gray-400 line-through">{bump.oldPrice.toFixed(2).replace(".", ",")} €</span>
                                <span className="text-lg font-black text-primary">{bump.price.toFixed(2).replace(".", ",")} €</span>
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
                            {active ? <><CheckCircle className="w-4 h-4" /> Adicionado</> : <>+ Adicionar ao pedido</>}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="px-5 pt-5 pb-3 border-t border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-0.5">Pagamento</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Pagamento seguro via Stripe</p>

                    {error && (
                      <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    )}

                      <div className="border-t border-gray-100 pt-4 space-y-2 mb-5">
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Portes</span>
                          <span className="text-primary font-semibold">Grátis</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>{kit.name}{quantity > 1 ? ` × ${quantity}` : ""}</span>
                          <span>{(kit.price * quantity).toFixed(2).replace(".", ",")} €</span>
                        </div>
                        {orderBumps.filter(b => selectedBumps.has(b.id)).map(b => (
                          <div key={b.id} className="flex justify-between text-sm text-gray-600">
                            <span className="text-xs">{b.label}</span>
                            <span>{b.price.toFixed(2).replace(".", ",")} €</span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                          <span className="font-black text-gray-900 text-base">Total</span>
                          <span className="font-black text-primary text-xl">{orderTotal.toFixed(2).replace(".", ",")} €</span>
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
                        options={{ clientSecret, locale: "pt" }}
                      >
                        <StripePaymentForm
                          total={orderTotal}
                          orderId={orderId!}
                          onSuccess={() => {
                            (window as any).fbq?.("track", "Purchase", {
                              value: orderTotal,
                              currency: "EUR",
                              content_ids: [kit.id, ...Array.from(selectedBumps)],
                              content_type: "product",
                            }, { eventID: `purchase_${orderId}` });
                            setStep(4);
                          }}
                          onError={(msg) => setError(msg)}
                          onBack={() => { setClientSecret(null); setOrderId(null); piAmountRef.current = null; setStep(2); }}
                        />
                      </Elements>
                    )}

                    <p className="text-center text-[11px] text-gray-400 mb-3">Compra segura SSL · Garantia de 7 dias · Portes grátis Portugal</p>
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-black text-gray-500 border border-gray-300 rounded px-2 py-0.5">VISA</span>
                      <span className="text-xs font-black text-gray-500 border border-gray-300 rounded px-2 py-0.5">MASTERCARD</span>
                      <span className="text-xs font-black text-gray-500 border border-gray-300 rounded px-2 py-0.5">STRIPE</span>
                    </div>
                    <p className="text-center text-[10px] text-gray-400">Panini Portugal Lda · Rua Exemplo, 123, Lisboa<br />NIPC: 500 000 000</p>
                  </div>
                </motion.div>
              )}
            </form>

            {step < 3 && (
              <div className="flex justify-center gap-6">
                <div className="flex flex-col items-center gap-1 text-gray-500">
                  <Lock className="w-5 h-5 text-gray-400" />
                  <span className="text-[10px] font-medium uppercase tracking-wider">Pagamento seguro</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-gray-500">
                  <ShieldCheck className="w-5 h-5 text-gray-400" />
                  <span className="text-[10px] font-medium uppercase tracking-wider">Compra protegida</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-gray-500">
                  <Truck className="w-5 h-5 text-gray-400" />
                  <span className="text-[10px] font-medium uppercase tracking-wider">Portes grátis</span>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
