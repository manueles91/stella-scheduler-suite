import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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
  adminBadges?: ReactNode;
  discountBadge?: ReactNode;
  adminButtons?: ReactNode;
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
  expandedContent,
  adminBadges,
  discountBadge,
  adminButtons
}: BaseCardProps) => {
  const isMobile = useIsMobile();
  const CardWrapper = showExpandable ? Collapsible : 'div';
  const cardProps = showExpandable ? { 
    open: isExpanded, 
    onOpenChange: onExpandChange 
  } : {};

  const cardContent = (
    <Card 
      className={`relative overflow-hidden hover:shadow-lg transition-all duration-300 ${
        isExpanded 
          ? 'h-auto' 
          : isMobile 
            ? 'h-28 sm:h-32' // Smaller height on mobile
            : 'h-32'
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
        {/* Shadow gradient from top to bottom for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-transparent" />
      </div>

      {/* Card Content */}
      <div className="relative z-10 p-3 sm:p-4 h-full flex flex-col justify-between text-white">
        {/* Top Row */}
        <div className="flex justify-between items-start">
                     {/* Only show service name in collapsed state, not expanded */}
           {!isExpanded && (
             <h3 className={`font-serif font-bold leading-tight text-white drop-shadow-md ${
               isMobile ? 'text-base sm:text-xl' : 'text-xl'
             }`}>
               {name}
             </h3>
           )}
          {/* Expand button for collapsed state only */}
          {showExpandable && !isExpanded && (
            <CollapsibleTrigger asChild>
              <button 
                className="p-1 hover:bg-white/20 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                onClick={(e) => {
                  e.stopPropagation();
                  onExpandChange?.(!isExpanded);
                }}
              >
                <ChevronDown className="h-4 w-4 text-white" />
              </button>
            </CollapsibleTrigger>
          )}
        </div>

        {/* Card-specific content */}
        {children}
        
        {/* Admin badges - positioned at bottom left in collapsed state */}
        {(adminBadges || discountBadge) && !isExpanded && (
          <div className="absolute bottom-2 left-2 flex gap-1 max-w-[calc(100%-4rem)]">
            {discountBadge}
            {adminBadges}
          </div>
        )}
      </div>

      {/* Expandable Content */}
      {showExpandable && expandedContent && (
        <CollapsibleContent>
          <div className="relative">
            {/* Content with shadow boxes - no duplicate background image */}
            <div className={`relative z-10 ${
              isMobile ? 'px-4 pb-4' : 'px-6 pb-6'
            } pt-0`}>
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