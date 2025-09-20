import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis, YAxis, Cell } from "recharts";
import { formatCRC } from "@/lib/currency";
import { useIsMobile } from "@/hooks/use-mobile";
import { DailyCostData, CostTypeData, CategoryShareData, ChartConfig } from "@/types/finances";

interface CostChartsProps {
  dailyCostData: DailyCostData[];
  costTypeData: CostTypeData[];
  costCategoryShareData: CategoryShareData;
  barMinWidth: number;
  dailyCostConfig: ChartConfig;
  costTypeConfig: ChartConfig;
  costCategoryConfig: ChartConfig;
}

export const CostCharts = ({
  dailyCostData,
  costTypeData,
  costCategoryShareData,
  barMinWidth,
  dailyCostConfig,
  costTypeConfig,
  costCategoryConfig
}: CostChartsProps) => {
  const isMobile = useIsMobile();

  const renderCurrencyTick = (value: number) => formatCRC(value);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Costos diarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="-mx-4 sm:mx-0 overflow-x-auto">
            <div style={{ minWidth: barMinWidth }}>
              <ChartContainer config={dailyCostConfig} className="h-[280px] sm:h-[340px]">
                <BarChart data={dailyCostData}>
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
                  <Bar dataKey="costCents" fill="var(--color-costCents)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribución por tipo de costo</CardTitle>
        </CardHeader>
        <CardContent>
          {costTypeData.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">Sin datos</div>
          ) : (
            <ChartContainer config={costTypeConfig} className="h-[240px] sm:h-[280px]">
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
                <Pie dataKey="value" data={costTypeData} nameKey="name" innerRadius={isMobile ? 50 : 60} outerRadius={isMobile ? 80 : 90} strokeWidth={2}>
                  {costTypeData.map((entry, index) => (
                    <Cell key={entry.name} fill={costTypeConfig[entry.name]?.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)`} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Costos por categoría</CardTitle>
        </CardHeader>
        <CardContent>
          {costCategoryShareData.chart.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">Sin datos</div>
          ) : (
            <ChartContainer config={costCategoryConfig} className="h-[240px] sm:h-[280px]">
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
                <Pie dataKey="value" data={costCategoryShareData.chart} nameKey="name" innerRadius={isMobile ? 50 : 60} outerRadius={isMobile ? 80 : 90} strokeWidth={2}>
                  {costCategoryShareData.chart.map((entry, index) => (
                    <Cell key={entry.name} fill={costCategoryConfig[entry.name]?.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)`} />
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
