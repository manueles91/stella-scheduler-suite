import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, Download, ExternalLink } from "lucide-react";
import { 
  CalendarEvent, 
  generateGoogleCalendarUrl, 
  generateOutlookCalendarUrl, 
  generateICSFile 
} from "@/lib/utils/calendar";

interface CalendarAddButtonProps {
  event: CalendarEvent;
  variant?: "default" | "outline";
  size?: "sm" | "default" | "lg";
}

export const CalendarAddButton = ({ event, variant = "outline", size = "default" }: CalendarAddButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleGoogleCalendar = () => {
    const url = generateGoogleCalendarUrl(event);
    window.open(url, '_blank');
    setIsOpen(false);
  };

  const handleOutlookCalendar = () => {
    const url = generateOutlookCalendarUrl(event);
    window.open(url, '_blank');
    setIsOpen(false);
  };

  const handleDownloadICS = () => {
    const icsFile = generateICSFile(event);
    const link = document.createElement('a');
    link.href = icsFile;
    link.download = 'cita.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <Calendar className="h-4 w-4" />
          Agregar a calendario
          <ExternalLink className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleGoogleCalendar} className="gap-2">
          <ExternalLink className="h-4 w-4" />
          Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOutlookCalendar} className="gap-2">
          <ExternalLink className="h-4 w-4" />
          Outlook Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadICS} className="gap-2">
          <Download className="h-4 w-4" />
          Descargar archivo (.ics)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};