import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Schedule, DAYS_OF_WEEK, TIME_OPTIONS } from "./scheduleTypes";
import { calculateDuration } from "./scheduleUtils";

interface ScheduleItemProps {
  schedule: Schedule;
  index: number;
  onUpdate: (index: number, field: keyof Schedule, value: any) => void;
}

export const ScheduleItem = ({ schedule, index, onUpdate }: ScheduleItemProps) => {
  const dayLabel = DAYS_OF_WEEK.find(d => d.value === schedule.day_of_week)?.label;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-4 border rounded-lg">
      <div className="flex items-center space-x-2">
        <Switch
          checked={schedule.is_available}
          onCheckedChange={(checked) => onUpdate(index, 'is_available', checked)}
        />
        <Label className="font-medium">{dayLabel}</Label>
      </div>

      {schedule.is_available && (
        <>
          <div>
            <Label className="text-sm">Hora de inicio</Label>
            <Select
              value={schedule.start_time}
              onValueChange={(value) => onUpdate(index, 'start_time', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar hora de inicio" />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.filter(time => time < schedule.end_time || time === schedule.start_time).map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm">Hora de fin</Label>
            <Select
              value={schedule.end_time}
              onValueChange={(value) => onUpdate(index, 'end_time', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar hora de fin" />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.filter(time => time > schedule.start_time || time === schedule.end_time).map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            Duración: {calculateDuration(schedule.start_time, schedule.end_time)}
          </div>
        </>
      )}

      {!schedule.is_available && (
        <div className="md:col-span-3 text-sm text-muted-foreground">
          No disponible este día
        </div>
      )}
    </div>
  );
};