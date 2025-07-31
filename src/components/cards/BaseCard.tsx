import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

export interface BaseCardProps {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  className?: string;
  showExpandable?: boolean;
  isExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
  onSelect?: () => void;
  children: ReactNode;
  expandedContent?: ReactNode;
}

export const BaseCard = ({
  name,
  imageUrl,
  className = "",
  showExpandable = true,
  isExpanded = false,
  onExpandChange,
  onSelect,
  children,
  expandedContent
}: BaseCardProps) => {
  const CardWrapper = showExpandable ? Collapsible : 'div';
  const cardProps = showExpandable ? { 
    open: isExpanded, 
    onOpenChange: onExpandChange 
  } : {};

  const cardContent = (
    <Card 
      className={`relative overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer ${
        isExpanded ? 'h-auto' : 'h-32'
      } ${className}`}
      onClick={!showExpandable ? onSelect : undefined}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/20" />
      </div>

      {/* Card Content */}
      <div className="relative z-10 p-4 h-full flex flex-col justify-between text-white">
        {/* Top Row */}
        <div className="flex justify-between items-start">
          <h3 className="font-serif text-lg font-bold leading-tight text-white drop-shadow-md">
            {name}
          </h3>
          {showExpandable && (
            <CollapsibleTrigger asChild>
              <div className="p-1 hover:bg-white/20 rounded-full transition-colors">
                <ChevronDown className={`h-4 w-4 text-white transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
          )}
        </div>

        {/* Card-specific content */}
        {children}
      </div>

      {/* Expandable Content */}
      {showExpandable && expandedContent && (
        <CollapsibleContent>
          <div className="relative z-10 bg-background/95 backdrop-blur-sm border-t p-4 space-y-4">
            {expandedContent}
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