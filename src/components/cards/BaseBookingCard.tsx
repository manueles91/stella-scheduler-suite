import { ReactNode, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export interface BaseBookingCardProps {
  id: string;
  className?: string;
  showExpandable?: boolean;
  isExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
  children: ReactNode;
  expandedContent?: ReactNode;
}

export const BaseBookingCard = ({
  className = "",
  showExpandable = true,
  isExpanded = false,
  onExpandChange,
  children,
  expandedContent
}: BaseBookingCardProps) => {
  const isMobile = useIsMobile();
  const [localExpanded, setLocalExpanded] = useState(isExpanded);
  
  // Use local state if no external state is provided
  const expanded = onExpandChange ? isExpanded : localExpanded;
  const setExpanded = onExpandChange || setLocalExpanded;
  
  // Sync local state with external state changes
  useEffect(() => {
    if (onExpandChange && isExpanded !== localExpanded) {
      setLocalExpanded(isExpanded);
    }
  }, [isExpanded, onExpandChange, localExpanded]);
  
  const CardWrapper = showExpandable ? Collapsible : 'div';
  const cardProps = showExpandable ? { 
    open: expanded, 
    onOpenChange: setExpanded 
  } : {};

  const cardContent = (
    <Card 
      className={`border border-border rounded-lg hover:shadow-md transition-all duration-300 overflow-hidden ${
        expanded ? 'h-auto' : ''
      } ${className}`}
      onClick={(e) => {
        if (!showExpandable) return;
        setExpanded(!expanded);
      }}
    >
      {/* Card Content */}
      <div className="p-2 sm:p-3 h-full">
        {/* Card-specific content */}
        <div className="h-full">
          {children}
        </div>
      </div>

      {/* Expandable Content */}
      {showExpandable && expandedContent && (
        <CollapsibleContent>
          <div className="border-t border-border/30">
            <div className={`p-4 sm:p-6`}>
              {expandedContent}
            </div>
          </div>
        </CollapsibleContent>
      )}
    </Card>
  );

  return showExpandable ? (
    <CardWrapper {...cardProps}>
      {cardContent}
    </CardWrapper>
  ) : (
    cardContent
  );
};
