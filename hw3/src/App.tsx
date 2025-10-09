import { HeroParticles } from "@/components/HeroParticles";
import { Outlet, Route, Routes, Link } from "react-router-dom";
import { Suspense } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AniButton } from "@/components/ui/ani-button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/toaster";
import { Separator } from "@/components/ui/separator";
import { DataProvider } from "@/contexts/DataContext";
import { CartProvider } from "@/contexts/CartContext";
import { CartDrawer } from "@/components/CartDrawer";
import { OrderProvider } from "@/contexts/OrderContext";
import { useState } from "react";
import OrdersPanel from "@/pages/OrdersPanel";
import { SubmitSheet } from "@/components/SubmitSheet";
import { useData } from "@/contexts/DataContext";
import { useFilters } from "@/hooks/useFilters";
import { FilterBar } from "@/components/FilterBar";
import { ItemGrid } from "@/components/ItemGrid";

function Home() {
  const { items, loading, error } = useData();
  const {
    keyword,
    setKeyword,
    selectedCategories,
    toggleCategory,
    sortBy,
    setSortBy,
    filteredItems,
    reset,
  } = useFilters(items);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-10 relative">
        <h1 className="font-display text-4xl md:text-6xl bg-gradient-to-r from-rose to-matcha text-transparent bg-clip-text">
          Find your daily dessert plan
        </h1>
        <p className="mt-2 text-sm opacity-80">Curated sweets and café picks with a premium touch.</p>
      </div>
      <FilterBar
        keyword={keyword}
        onKeyword={setKeyword}
        selectedCategories={selectedCategories}
        onToggleCategory={toggleCategory}
        sortBy={sortBy}
        onSortBy={setSortBy}
        onClearAll={reset}
      />
      <div className="mt-6">
        {error ? (
          <div role="alert" className="glass p-4 text-red-300">Failed to load items: {error}</div>
        ) : (
          <ItemGrid items={filteredItems} loading={loading} />
        )}
      </div>
    </div>
  );
}

function Orders() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="font-display text-3xl">Orders</h1>
    </div>
  );
}

export default function App() {
  const [cartOpen, setCartOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  return (
    <Suspense fallback={<div className="text-foreground">Loading…</div>}>
      <OrderProvider>
      <CartProvider>
      <DataProvider>
      <div className="min-h-screen bg-gradient-bg text-foreground">
        <div className="noise-overlay" />
        {/* Skip to content link for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[color:var(--rose)] focus:text-black focus:rounded-2xl focus:font-medium focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
        >
          Skip to content
        </a>
        <header className="sticky top-0 z-40 relative backdrop-blur supports-[backdrop-filter]:bg-black/30 bg-[color:var(--bg-2)]/55 after:content-[''] after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-white/5">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
            <Link to="/" className="font-display text-2xl tracking-wide text-[color:var(--text)] drop-rose">Dessert Planner</Link>
            <div className="flex-1" />
            <AniButton
              className="ml-2 elev-1 bg-[color:var(--glass)]/80 hover:bg-[color:var(--glass)]/95 border border-white/20 text-[color:var(--text)] rounded-2xl focus-visible:outline-none focus-visible:ring-2 ring-[var(--ring)] ring-offset-2 ring-offset-[var(--bg)]"
              variant="ghost"
              onClick={() => setCartOpen(true)}
            >
              Today's Plan
            </AniButton>
            <Link
              to="/orders"
              className="ml-2 inline-flex items-center h-9 px-4 rounded-2xl border border-white/20 bg-[color:var(--glass)]/80 hover:bg-[color:var(--glass)]/95 text-sm focus-visible:outline-none focus-visible:ring-2 ring-[var(--ring)] ring-offset-2 ring-offset-[var(--bg)]"
            >
              Orders
            </Link>
          </div>
        </header>
        <main id="main-content">
          <div className="relative">
            <HeroParticles />
          </div>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/orders" element={<OrdersPanel />} />
            <Route path="*" element={<Home />} />
          </Routes>
          <Outlet />
        </main>
        <Separator className="opacity-20" />
        <footer className="px-6 py-8 text-sm text-center text-foreground/70">
          Built for NTU hw3 · Images: Unsplash/Pexels (attribution placeholders)
        </footer>
        <CartDrawer open={cartOpen} onOpenChange={setCartOpen} onProceed={() => setSubmitOpen(true)} />
        <SubmitSheet open={submitOpen} onOpenChange={setSubmitOpen} />
      </div>
      </DataProvider>
      </CartProvider>
      </OrderProvider>
      <Toaster />
    </Suspense>
  );
}


