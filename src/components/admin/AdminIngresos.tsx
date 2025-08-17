import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, isAfter, parseISO } from "date-fns";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatCRC } from "@/lib/currency";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

interface ReservationLite {
  id: string;
  appointment_date: string; // yyyy-MM-dd
  status: string;
  client_id: string | null;
  customer_email: string | null;
  services: {
    price_cents: number;
    category_id: string | null;
    service_categories: {
      name: string | null;
    } | null;
  };
}

const DAYS_WINDOW_DEFAULT = 30;

export const AdminIngresos = () => {
  const [reservations, setReservations] = useState<ReservationLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysWindow] = useState<number>(DAYS_WINDOW_DEFAULT);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const startDate = subDays(new Date(), daysWindow + 60); // include lookback for retention context
      const startStr = format(startDate, "yyyy-MM-dd");

      // Use the admin_reservations_view for better performance and reliability
      const { data, error } = await supabase
        .from("admin_reservations_view")
        .select(`
          id,
          appointment_date,
          status,
          client_id,
          client_email,
          service_name,
          service_price_cents,
          category_name
        `)
        .gte("appointment_date", startStr)
        .order("appointment_date", { ascending: true });

      if (error) {
        // eslint-disable-next-line no-console
        console.error("Error loading reservations for ingresos dashboard:", error);
        setReservations([]);
      } else {
        // Transform the data to match the expected interface
        const transformedData = data?.map(item => ({
          id: item.id,
          appointment_date: item.appointment_date,
          status: item.status,
          client_id: item.client_id,
          customer_email: item.client_email,
          services: {
            price_cents: item.service_price_cents || 0,
            category_id: null, // We'll get this from the category_name if needed
            service_categories: {
              name: item.category_name
            }
          }
        })) || [];
        
        setReservations(transformedData as unknown as ReservationLite[]);
      }
      setLoading(false);
    };

    fetchData();
  }, [daysWindow]);

  const timeframeStart = useMemo(() => subDays(new Date(), daysWindow - 1), [daysWindow]);
  const timeframeStartStr = useMemo(() => format(timeframeStart, "yyyy-MM-dd"), [timeframeStart]);
  const timeframeEnd = useMemo(() => new Date(), []);
  const timeframeDays: string[] = useMemo(() => {
    const days: string[] = [];
    for (let i = daysWindow - 1; i >= 0; i--) {
      days.push(format(subDays(new Date(), i), "yyyy-MM-dd"));
    }
    return days;
  }, [daysWindow]);

  const completedInWindow = useMemo(() => {
    return reservations.filter((r) => {
      if (r.status !== "completed") return false;
      return r.appointment_date >= timeframeStartStr;
    });
  }, [reservations, timeframeStartStr]);

  const dailyRevenueData = useMemo(() => {
    const centsByDay = new Map<string, number>();
    timeframeDays.forEach((d) => centsByDay.set(d, 0));

    for (const r of completedInWindow) {
      const key = r.appointment_date;
      const prev = centsByDay.get(key) || 0;
      centsByDay.set(key, prev + (r.services?.price_cents || 0));
    }

    return timeframeDays.map((d) => ({
      date: format(parseISO(d), "dd/MM"),
      revenueCents: centsByDay.get(d) || 0,
    }));
  }, [completedInWindow, timeframeDays]);

  const barMinWidth = useMemo(() => {
    const perBar = isMobile ? 28 : 20;
    const yAxisReserve = isMobile ? 80 : 100;
    return Math.max(640, dailyRevenueData.length * perBar + yAxisReserve);
  }, [dailyRevenueData.length, isMobile]);

  const retentionData = useMemo(() => {
    // Identify customers' earliest completed booking
    const earliestCompletedByCustomer = new Map<string, string>();

    const identifierFor = (r: ReservationLite) => r.client_id || r.customer_email || r.id;

    // Consider all completed in our fetch window, not only timeframe, to detect prior history
    const allCompletedSorted = [...reservations]
      .filter((r) => r.status === "completed")
      .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date));

    for (const r of allCompletedSorted) {
      const id = identifierFor(r);
      if (!earliestCompletedByCustomer.has(id)) {
        earliestCompletedByCustomer.set(id, r.appointment_date);
      }
    }

    let returningCount = 0;
    let newCount = 0;

    for (const r of completedInWindow) {
      const id = identifierFor(r);
      const firstDate = earliestCompletedByCustomer.get(id);
      if (!firstDate) {
        newCount += 1;
        continue;
      }
      // Returning if there was a completed visit before this booking date
      if (firstDate < r.appointment_date) {
        returningCount += 1;
      } else {
        newCount += 1;
      }
    }

    const total = Math.max(1, returningCount + newCount);

    return {
      chart: [
        { name: "Recurrentes", value: returningCount },
        { name: "Nuevos", value: newCount },
      ],
      percentReturning: Math.round((returningCount / total) * 100),
    };
  }, [reservations, completedInWindow]);

  const categoryShare = useMemo(() => {
    // Aggregate revenue by category within timeframe
    const centsByCategory = new Map<string, number>();

    for (const r of completedInWindow) {
      const catName = r.services?.service_categories?.name || "Sin categoría";
      const prev = centsByCategory.get(catName) || 0;
      centsByCategory.set(catName, prev + (r.services?.price_cents || 0));
    }

    const items = Array.from(centsByCategory.entries()).map(([name, cents]) => ({
      name,
      value: cents,
    }));

    // Sort descending by value
    items.sort((a, b) => b.value - a.value);

    const totalCents = items.reduce((s, i) => s + i.value, 0) || 1;

    return {
      chart: items,
      totalCents,
    };
  }, [completedInWindow]);

  const categoryConfig = useMemo(() => {
    // Generate colors for categories deterministically from a palette
    const palette = [
      "hsl(221, 83%, 53%)",
      "hsl(142, 71%, 45%)",
      "hsl(27, 96%, 61%)",
      "hsl(291, 64%, 42%)",
      "hsl(199, 89%, 48%)",
      "hsl(340, 82%, 52%)",
      "hsl(10, 87%, 55%)",
      "hsl(50, 94%, 58%)",
      "hsl(170, 78%, 41%)",
    ];

    const cfg: Record<string, { label: string; color: string }> = {};
    categoryShare.chart.forEach((item, idx) => {
      cfg[item.name] = { label: item.name, color: palette[idx % palette.length] };
    });
    return cfg;
  }, [categoryShare.chart]);

  const dailyRevenueConfig = useMemo(
    () => ({
      revenueCents: {
        label: "Ingresos diarios",
        color: "hsl(221, 83%, 53%)",
      },
    }),
    []
  );

  const retentionConfig = useMemo(
    () => ({
      Recurrentes: { label: "Recurrentes", color: "hsl(142, 71%, 45%)" },
      Nuevos: { label: "Nuevos", color: "hsl(27, 96%, 61%)" },
    }),
    []
  );

  const renderCurrencyTick = (value: number) => formatCRC(value);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-serif font-bold">Ingresos</h2>
        <div className="text-center py-8">Cargando datos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-serif font-bold">Ingresos</h2>
        <div className="text-sm text-muted-foreground">Últimos {daysWindow} días</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Ingresos diarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="-mx-4 sm:mx-0 overflow-x-auto">
              <div style={{ minWidth: barMinWidth }}>
                <ChartContainer config={dailyRevenueConfig} className="h-[280px] sm:h-[340px]">
                  <BarChart data={dailyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      height={isMobile ? 50 : 30}
                      tick={{ fontSize: isMobile ? 12 : 11 }}
                      angle={isMobile ? -45 : 0}
                      dy={isMobile ? 10 : 0}
                    />
                    <YAxis
                      tickFormatter={renderCurrencyTick}
                      tickLine={false}
                      axisLine={false}
                      width={isMobile ? 64 : 80}
                      tick={{ fontSize: isMobile ? 12 : 11 }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} formatter={(value) => [formatCRC(Number(value)), "Ingresos"]} />
                    <Bar dataKey="revenueCents" fill="var(--color-revenueCents)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Retención (clientes recurrentes)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <ChartContainer config={retentionConfig} className="h-[240px] sm:h-[280px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                    <Pie dataKey="value" data={retentionData.chart} nameKey="name" innerRadius={isMobile ? 50 : 60} outerRadius={isMobile ? 80 : 90} strokeWidth={2}>
                      {retentionData.chart.map((entry) => (
                        <Cell key={entry.name} fill={`var(--color-${entry.name})`} />
                      ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                  </PieChart>
                </ChartContainer>
              </div>
              <div className="text-center md:w-[160px]">
                <div className="text-4xl font-bold">{retentionData.percentReturning}%</div>
                <div className="text-sm text-muted-foreground">de reservas son de clientes recurrentes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ventas por categoría de servicio</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryShare.chart.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">Sin datos</div>
            ) : (
              <ChartContainer config={categoryConfig} className="h-[240px] sm:h-[280px]">
                <PieChart>
                  <ChartTooltip
                    content={<ChartTooltipContent nameKey="name" />}
                    formatter={(value, name) => [formatCRC(Number(value)), String(name)]}
                  />
                  <Pie dataKey="value" data={categoryShare.chart} nameKey="name" innerRadius={isMobile ? 50 : 60} outerRadius={isMobile ? 80 : 90} strokeWidth={2}>
                    {categoryShare.chart.map((entry) => (
                      <Cell key={entry.name} fill={`var(--color-${entry.name})`} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};