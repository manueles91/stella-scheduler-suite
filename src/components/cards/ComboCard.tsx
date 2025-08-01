import { ServiceCard } from "./ServiceCard";

export interface ComboService {
  name: string;
  quantity?: number;
  service_id?: string;
}

export interface ComboCardProps {
  id: string;
  name: string;
  description?: string;
  originalPrice: number;
  finalPrice: number;
  savings: number;
  duration?: number;
  imageUrl?: string;
  
  // Combo specific
  comboServices: ComboService[];
  
  // Interaction
  onSelect?: () => void;
  onEdit?: () => void;
  canEdit?: boolean;
  
  // Employee selection
  employees?: any[];
  selectedEmployee?: any | null;
  onEmployeeSelect?: (employee: any | null) => void;
  allowEmployeeSelection?: boolean;
  
  // Display options
  variant?: 'landing' | 'dashboard' | 'reservation' | 'admin';
  showExpandable?: boolean;
  className?: string;
  
  // Admin-specific badges and buttons
  adminBadges?: React.ReactNode;
  adminButtons?: React.ReactNode;
}

export const ComboCard = (props: ComboCardProps) => {
  // Convert to ServiceCard props
  const serviceCardProps = {
    ...props,
    type: 'combo' as const,
    discountType: 'combo' as const,
    discountValue: undefined
  };

  return <ServiceCard {...serviceCardProps} />;
};