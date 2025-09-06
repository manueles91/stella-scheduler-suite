import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, Filter, ChevronDown, ChevronUp } from "lucide-react";

interface CollapsibleFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  children: React.ReactNode;
  placeholder?: string;
}

export const CollapsibleFilter = ({ 
  searchTerm, 
  onSearchChange, 
  children,
  placeholder = "Buscar..." 
}: CollapsibleFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="px-3">
            <Filter className="h-4 w-4 mr-1" />
            {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </CollapsibleTrigger>
      </div>
      
      <CollapsibleContent className="space-y-4 pt-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};