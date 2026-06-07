import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Checkout from "@/pages/checkout";
import Presell from "@/pages/presell";
import Admin from "@/pages/admin";
import Rastreio from "@/pages/rastreio";
import Quiz from "@/pages/quiz";
import ProductPage from "@/pages/product";
import { CartProvider } from "@/lib/CartContext";
import { CartDrawer } from "@/components/CartDrawer";

const queryClient = new QueryClient();

function GuardedLanding() {
  const [, navigate] = useLocation();
  const quizDone = sessionStorage.getItem("quiz_done");
  useEffect(() => {
    if (!quizDone) navigate("/quiz");
  }, [quizDone, navigate]);
  if (!quizDone) return null;
  return <Landing />;
}

function GuardedProduct({ params }: { params?: { id?: string } }) {
  const [, navigate] = useLocation();
  const quizDone = sessionStorage.getItem("quiz_done");
  useEffect(() => {
    if (!quizDone) navigate("/quiz");
  }, [quizDone, navigate]);
  if (!quizDone) return null;
  return <ProductPage params={params} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={GuardedLanding} />
      <Route path="/quiz" component={Quiz} />
      <Route path="/producto/:id" component={GuardedProduct} />
      <Route path="/presell" component={Presell} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/admin" component={Admin} />
      <Route path="/rastreio" component={Rastreio} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CartProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <CartDrawer />
          <Toaster />
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
