import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Schedule } from "./scheduleTypes";
import { calculateWeeklyHours } from "./scheduleUtils";

interface ScheduleSummaryProps {
  schedules: Schedule[];
}

export const ScheduleSummary = ({ schedules }: ScheduleSummaryProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen de la Semana</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Días laborales:</h4>
            <p className="text-2xl font-bold text-primary">
              {schedules.filter(s => s.is_available).length}
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Horas totales por semana:</h4>
            <p className="text-2xl font-bold text-primary">
              {calculateWeeklyHours(schedules)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};