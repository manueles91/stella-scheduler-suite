import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis, YAxis, Cell } from "recharts";
import { formatCRC } from "@/lib/currency";
import { useIsMobile } from "@/hooks/use-mobile";
import { DailyRevenueData, RetentionData, CategoryShareData, ChartConfig } from "@/types/finances";

interface RevenueChartsProps {
  dailyRevenueData: DailyRevenueData[];
  retentionData: RetentionData;
  categoryShareData: CategoryShareData;
  barMinWidth: number;
  dailyRevenueConfig: ChartConfig;
  retentionConfig: ChartConfig;
  categoryConfig: ChartConfig;
}

export const RevenueCharts = ({
  dailyRevenueData,
  retentionData,
  categoryShareData,
  barMinWidth,
  dailyRevenueConfig,
  retentionConfig,
  categoryConfig
}: RevenueChartsProps) => {
  const isMobile = useIsMobile();

  const renderCurrencyTick = (value: number) => formatCRC(value);

  return (
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
                  <ChartTooltip content={<ChartTooltipContent />} formatter={(value) => [formatCRC(Number(value)), ""]} />
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
                      <Cell key={entry.name} fill={retentionConfig[entry.name]?.color || `hsl(${entry.name === 'Recurrentes' ? 142 : 27}, 70%, 50%)`} />
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
          {categoryShareData.chart.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">Sin datos</div>
          ) : (
            <ChartContainer config={categoryConfig} className="h-[240px] sm:h-[280px]">
              <PieChart>
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-md">
                          <div className="grid gap-2">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium leading-none tracking-tight">
                                {data.name}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {formatCRC(Number(data.value))}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Pie dataKey="value" data={categoryShareData.chart} nameKey="name" innerRadius={isMobile ? 50 : 60} outerRadius={isMobile ? 80 : 90} strokeWidth={2}>
                  {categoryShareData.chart.map((entry, index) => (
                    <Cell key={entry.name} fill={categoryConfig[entry.name]?.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)`} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
