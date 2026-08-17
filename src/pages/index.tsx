import { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { UtensilsCrossed, BarChart3, ChevronRight, Mail, Users, BellRing } from 'lucide-react';
import { toast } from 'sonner';

import { FormularioPedidos } from '@/components/formulario-pedidos';
import { StatusCards, type StatusFilterType } from '@/components/status-cards';
import { TablaPedidos, type FilterStatus } from '@/components/tabla-pedidos';
import { DashboardMetrics } from '@/components/dashboard-metrics';
import { ThemeSettings } from '@/components/theme-settings';
import { SkeletonDashboard } from '@/components/enhanced-skeleton';
import { UserMenu } from '@/components/user-menu';


import { usePedidoList } from '@/generated/hooks/use-pedido';
import { useIsTablet } from '@/hooks/use-form-factor';
import { useUserRole } from '@/hooks/use-user-role';
import { formatLocalDateKey, parseLocalDateKey } from '@/lib/utils';

// TEMP: Flag to enable the new request button for operations
const ENABLE_NEW_ORDER_FOR_OPERATIVO = false;

function millisecondsUntilNextLocalDay() {
  const now = new Date();
  const nextDay = new Date(now);
  nextDay.setDate(now.getDate() + 1);
  nextDay.setHours(0, 0, 0, 0);
  return nextDay.getTime() - now.getTime();
}

export default function HomePage() {
  const { isAdmin, isOperativo, isDeveloper } = useUserRole();
  // Auto-refresh (polling) at 30 seconds to capture new orders from other users.
  // 5s was too aggressive and caused visual flickering in the table.
  const { data: orders, isLoading } = usePedidoList(undefined, 30_000);
  const isTablet = useIsTablet();

  const [showDashboard, setShowDashboard] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // State for coordinating between FormularioPedidos and OrdersTable
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);
  const [navigateToDate, setNavigateToDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const selectedDateRef = useRef(selectedDate);
  const followingTodayRef = useRef(true);
  const knownTodayKeyRef = useRef(formatLocalDateKey(new Date()));

  const handleSelectedDateChange = useCallback((date: Date) => {
    const nextDate = new Date(date);
    selectedDateRef.current = nextDate;
    followingTodayRef.current = formatLocalDateKey(nextDate) === formatLocalDateKey(new Date());
    setSelectedDate(nextDate);
  }, []);

  useEffect(() => {
    let timeoutId: ReturnType<typeof window.setTimeout>;

    const syncCurrentDay = () => {
      const currentTodayKey = formatLocalDateKey(new Date());
      const previousTodayKey = knownTodayKeyRef.current;

      if (currentTodayKey !== previousTodayKey) {
        if (
          followingTodayRef.current &&
          formatLocalDateKey(selectedDateRef.current) === previousTodayKey
        ) {
          const currentDate = new Date();
          selectedDateRef.current = currentDate;
          setSelectedDate(currentDate);
        }

        knownTodayKeyRef.current = currentTodayKey;
        followingTodayRef.current = formatLocalDateKey(selectedDateRef.current) === currentTodayKey;
      }
    };

    const scheduleNextCheck = () => {
      timeoutId = window.setTimeout(() => {
        syncCurrentDay();
        scheduleNextCheck();
      }, millisecondsUntilNextLocalDay() + 1000);
    };

    const handleVisibilityOrFocus = () => {
      syncCurrentDay();
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    scheduleNextCheck();

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, []);

  // Detect scroll for header shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Tracking background new orders logic for Operadores
  const [previousOrderCount, setPreviousOrderCount] = useState<number>(-1);

  useEffect(() => {
    if (orders) {
      // Setup initial baseline properly
      if (previousOrderCount === -1) {
        setPreviousOrderCount(orders.length);
        return;
      }

      // Compare the new count against baseline
      if (orders.length > previousOrderCount) {
        const nuevosAdicionales = orders.length - previousOrderCount;

        // Find the newest order by fechadecreacin
        const latestOrder = orders.reduce((latest, current) => {
          return (new Date(current.fechadecreacin || 0).getTime() > new Date(latest.fechadecreacin || 0).getTime()) ? current : latest;
        }, orders[0]);

        // Visual notification specifically targeted at Operativo screen
        if (isOperativo) {
          toast.info(`¡${nuevosAdicionales === 1 ? 'Nuevo pedido agendado' : 'Nuevos pedidos agendados'}!`, {
            description: 'Acaban de solicitar un nuevo Box Lunch.',
            duration: 10000,
            icon: <BellRing className="text-blue-500 h-5 w-5" />,
            style: { border: '1px solid #3b82f6', backgroundColor: '#eff6ff', color: '#1e3a8a' },
            action: {
              label: 'Ver Pedido',
              onClick: () => {
                if (latestOrder && latestOrder.fechaentrega) {
                  const orderDate = parseLocalDateKey(latestOrder.fechaentrega);
                  setNavigateToDate(orderDate);
                  setHighlightedOrderId(latestOrder.id);
                  setStatusFilter('all');
                }
              }
            }
          });
        }
      }

      // Update baseline after firing notification
      setPreviousOrderCount(orders.length);
    }
  }, [orders, previousOrderCount, isOperativo]);

  // Handler when a new order is created
  const handleOrderCreated = useCallback((order: { id: string; fechaentrega: string; nombreEmpleado: string }) => {
    const orderDate = parseLocalDateKey(order.fechaentrega);

    setNavigateToDate(orderDate);
    setHighlightedOrderId(order.id);
    // Reset filter to show all when navigating to a new order
    setStatusFilter('all');
  }, []);

  // Handler for status filter changes (from cards or table)
  const handleStatusFilterChange = useCallback((filter: StatusFilterType) => {
    setStatusFilter(filter);
  }, []);

  // Callbacks to clear navigation and highlight state
  const handleNavigationComplete = useCallback(() => {
    setNavigateToDate(null);
  }, []);

  const handleHighlightComplete = useCallback(() => {
    setHighlightedOrderId(null);
  }, []);



  return (
    <div className="bg-background grain-texture w-full max-w-[100vw] overflow-x-hidden">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_2px_8px_rgba(0,0,0,0.02)] ${isScrolled ? 'bg-background/70 backdrop-blur-xl' : 'bg-background/60 backdrop-blur-md'}`}>
        {/* Glassmorphism circular shapes - subtle blurred orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-8 -left-12 w-32 h-32 bg-primary/[0.04] rounded-full blur-2xl" />
          <div className="absolute -top-4 left-1/4 w-24 h-24 bg-accent/[0.03] rounded-full blur-xl" />
          <div className="absolute top-0 right-1/3 w-20 h-20 bg-primary/[0.025] rounded-full blur-2xl" />
          <div className="absolute -top-6 right-20 w-28 h-28 bg-accent/[0.035] rounded-full blur-xl" />
          <div className="absolute top-2 right-0 w-36 h-36 bg-primary/[0.03] rounded-full blur-3xl translate-x-1/2" />
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0"
            >
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-primary to-accent rounded-lg sm:rounded-xl shadow-lg shrink-0">
                <UtensilsCrossed className="h-4 w-4 sm:h-6 sm:w-6 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-xl font-bold tracking-tight whitespace-nowrap" style={{ fontFamily: 'var(--font-display)' }}>
                  BoxLunch<span className="hidden sm:inline"> | Demo App</span>
                </h1>
                <p className="text-xs text-muted-foreground -mt-0.5 hidden sm:block">
                  Sistema de Solicitudes
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1.5 sm:gap-2 shrink-0"
            >
              {/* Developer sees user management */}
              {isDeveloper && (
                <Link
                  to="/usuarios"
                  className="inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-lg border border-border/50 bg-background/50 hover:bg-accent/20 hover:border-accent/50 transition-all duration-200 shrink-0"
                  title="Gestión de Usuarios"
                >
                  <Users className="h-4 w-4 text-muted-foreground" />
                </Link>
              )}
              {/* TEMP: Also show FormularioPedidos for operations when the flag is active */}
              {(isAdmin || isDeveloper || (ENABLE_NEW_ORDER_FOR_OPERATIVO && isOperativo)) && <FormularioPedidos onOrderCreated={handleOrderCreated} />}
              <ThemeSettings />
              <div className="ml-0.5 sm:ml-1 pl-1 sm:pl-2 border-l border-border/40 shrink-0">
                <UserMenu />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Subtle decorative line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      </header>



      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 overflow-x-hidden mt-14">
        {/* Welcome Section */}
        {/* Welcome Section - Only visible on desktop (xl+) and NOT on tablet */}
        {/* Hidden when: system detects tablet OR viewport is tablet-sized (md to xl) */}
        {/* Welcome Section - Visible for admin and developer on desktop */}
        {(isAdmin || isDeveloper) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 hidden xl:block ${isTablet ? '!hidden' : ''}`}
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2
                  className="typo-title-main"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Panel de Pedidos
                </h2>
                <p className="typo-subtitle text-muted-foreground">
                  Gestiona las solicitudes de Box Lunch de manera eficiente
                </p>
              </div>
              {/* Dashboard toggle button - hidden on tablet (system + viewport) */}
              <button
                onClick={() => setShowDashboard(!showDashboard)}
                className="group flex items-center gap-2 typo-btn-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <BarChart3 className="h-4 w-4" />
                <span>{showDashboard ? 'Ocultar métricas' : 'Ver métricas'}</span>
                <motion.div
                  animate={{ rotate: showDashboard ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              </button>
            </div>
          </motion.div>
        )}

        {/* Dashboard toggle for mobile - Visible for admin and developer */}
        {/* Hidden on xl+, hidden on tablet (system + viewport) */}
        {(isAdmin || isDeveloper) && !isTablet && (
          <div className="mb-4 flex justify-end xl:hidden md:hidden">
            <button
              onClick={() => setShowDashboard(!showDashboard)}
              className="group flex items-center gap-2 typo-btn-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              <span>{showDashboard ? 'Ocultar métricas' : 'Ver métricas'}</span>
              <motion.div
                animate={{ rotate: showDashboard ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            </button>
          </div>
        )}

        {/* Dashboard Metrics - Visible for admin and developer, hidden on tablets */}
        {(isAdmin || isDeveloper) && !isTablet && showDashboard && (
          isLoading ? (
            <SkeletonDashboard />
          ) : (
            <DashboardMetrics orders={orders} isLoading={isLoading} />
          )
        )}

        {/* Status Cards - Normal flow (moves down when metrics are shown) */}
        <section className="mb-6">
          <StatusCards
            orders={orders}
            isLoading={isLoading}
            selectedDate={selectedDate}
            activeFilter={statusFilter}
            onFilterChange={handleStatusFilterChange}
          />
        </section>

        {/* Orders Table */}
        <section className="tabla-pedidos-section">
          <TablaPedidos
            highlightedOrderId={highlightedOrderId}
            onHighlightComplete={handleHighlightComplete}
            navigateToDate={navigateToDate}
            onNavigationComplete={handleNavigationComplete}
            externalStatusFilter={statusFilter as FilterStatus}
            onStatusFilterChange={handleStatusFilterChange}
            selectedDate={selectedDate}
            onDateChange={handleSelectedDateChange}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="sticky bottom-0 border-t border-border/30 bg-background/60 backdrop-blur-xl shadow-[0_-1px_3px_rgba(0,0,0,0.03),0_-2px_8px_rgba(0,0,0,0.02)] transition-all duration-300">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 sm:h-14">
            {/* Left: Brand Text Logo */}
            <div className="flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity text-sm font-bold tracking-tight">
              <span className="text-slate-800 dark:text-slate-200">Alekarpy</span>
              <span className="text-orange-500">Dev.</span>
            </div>

            {/* Center: System Name (optional, hidden on small screens) */}
            <div className="hidden sm:block">
                <span
                  className="typo-footer text-muted-foreground/70"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Sistema de Gestión BoxLunch | Demo App
                </span>
            </div>

            {/* Right: Support Link & Version */}
            <div className="flex items-center gap-3">
              <a
                href="https://teams.microsoft.com/l/chat/0/0?users=admin@demo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 typo-footer text-muted-foreground/70 hover:text-primary transition-colors"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                <Mail className="h-3 w-3" />
                <span className="hidden sm:inline">Soporte</span>
              </a>
              <span className="h-3 w-px bg-border/50" />
              <span
                className="typo-footer text-muted-foreground/60"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                v1.0.0
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>
    </div>
  );
}
