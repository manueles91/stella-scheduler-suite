import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CollapsibleFilter } from "../CollapsibleFilter";
import { CostCard } from "@/components/cards/CostCard";
import { Cost, CostCategory, FinanceFilters, FilterHandlers, CostType } from "@/types/finances";

const costTypes = [
  { value: 'fixed', label: 'Fijo' },
  { value: 'variable', label: 'Variable' },
  { value: 'recurring', label: 'Recurrente' },
  { value: 'one_time', label: 'Una vez' }
];

interface CostHistoryProps {
  filteredCosts: Cost[];
  costsInWindow: Cost[];
  costCategories: CostCategory[];
  filters: FinanceFilters;
  filterHandlers: FilterHandlers;
  onEdit: (cost: Cost) => void;
  onDelete: (id: string) => void;
  onCategoryManagerOpen: () => void;
  getCategoryLabel: (categoryId: string) => string;
}

export const CostHistory = ({
  filteredCosts,
  costsInWindow,
  costCategories,
  filters,
  filterHandlers,
  onEdit,
  onDelete,
  onCategoryManagerOpen,
  getCategoryLabel
}: CostHistoryProps) => {
  return (
    <div className="space-y-4">
      {/* Filter Component */}
      <Card>
        <CardContent className="p-4">
          <CollapsibleFilter 
            searchTerm={filters.searchTerm} 
            onSearchChange={filterHandlers.onSearchChange} 
            placeholder="Buscar costos..."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select value={filters.costTypeFilter} onValueChange={filterHandlers.onCostTypeFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de costo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {costTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.categoryFilter} onValueChange={filterHandlers.onCategoryFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {costCategories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={filterHandlers.onClearFilters} className="w-full">
                Limpiar filtros
              </Button>
            </div>
          </CollapsibleFilter>
        </CardContent>
      </Card>

      {/* Header - Mobile optimized */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold">Costos</h3>
          <Button variant="outline" size="sm" onClick={onCategoryManagerOpen} className="px-3">
            Categorías
          </Button>
        </div>
      </div>

      {/* Costs List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de costos recientes</CardTitle>
          {filteredCosts.length !== costsInWindow.length && (
            <p className="text-sm text-muted-foreground">
              <span className="text-blue-600">
                ({filteredCosts.length} de {costsInWindow.length} resultados)
              </span>
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCosts.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {costsInWindow.length === 0 
                  ? "No hay costos registrados en el período seleccionado"
                  : "No se encontraron resultados con los filtros aplicados"
                }
              </div>
            ) : (
              filteredCosts.slice(0, 10).map((cost) => (
                <CostCard
                  key={cost.id}
                  id={cost.id}
                  name={cost.name}
                  description={cost.description}
                  amountCents={cost.amount_cents}
                  costCategoryId={cost.cost_category_id}
                  costType={cost.cost_type as CostType}
                  dateIncurred={cost.date_incurred}
                  isActive={cost.is_active}
                  recurringFrequency={cost.recurring_frequency}
                  categoryName={getCategoryLabel(cost.cost_category_id)}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
