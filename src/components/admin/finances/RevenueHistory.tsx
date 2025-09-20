import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CollapsibleFilter } from "../CollapsibleFilter";
import { BookingCard } from "@/components/cards/BookingCard";
import { ReservationLite, FinanceFilters, FilterHandlers } from "@/types/finances";

interface RevenueHistoryProps {
  filteredReservations: ReservationLite[];
  recentCompletedOnly: ReservationLite[];
  reservations: ReservationLite[];
  filters: FinanceFilters;
  filterHandlers: FilterHandlers;
}

export const RevenueHistory = ({
  filteredReservations,
  recentCompletedOnly,
  reservations,
  filters,
  filterHandlers
}: RevenueHistoryProps) => {
  const uniqueCategories = Array.from(new Set(reservations.map(r => r.category_name).filter(Boolean)));

  return (
    <div className="space-y-4">
      {/* Filter Component */}
      <Card>
        <CardContent className="p-4">
          <CollapsibleFilter 
            searchTerm={filters.searchTerm} 
            onSearchChange={filterHandlers.onSearchChange} 
            placeholder="Buscar ingresos..."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select value={filters.statusFilter} onValueChange={filterHandlers.onStatusFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.categoryFilter} onValueChange={filterHandlers.onCategoryFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {uniqueCategories.map(category => (
                    <SelectItem key={category} value={category!}>
                      {category}
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

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Ingresos Recientes</CardTitle>
          {filteredReservations.length !== recentCompletedOnly.length && (
            <p className="text-sm text-muted-foreground">
              <span className="text-blue-600">
                ({filteredReservations.length} de {recentCompletedOnly.length} resultados)
              </span>
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReservations.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {recentCompletedOnly.length === 0 
                  ? "No hay ingresos recientes completados"
                  : "No se encontraron resultados con los filtros aplicados"
                }
              </div>
            ) : (
              filteredReservations.slice(0, 10).map((reservation) => (
                <BookingCard
                  key={reservation.id}
                  id={reservation.id}
                  serviceName={reservation.service_name}
                  appointmentDate={reservation.appointment_date}
                  startTime={reservation.start_time}
                  status={reservation.status}
                  priceCents={reservation.service_price_cents}
                  finalPriceCents={reservation.final_price_cents}
                  variablePrice={reservation.service_variable_price || false}
                  clientName={reservation.client_full_name || reservation.customer_email || "Cliente invitado"}
                  clientEmail={reservation.customer_email}
                  employeeName={reservation.employee_full_name || undefined}
                  isCombo={reservation.booking_type === 'combo'}
                  comboName={reservation.combo_name}
                  comboId={reservation.combo_id}
                  variant="revenue"
                  showExpandable={true}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
