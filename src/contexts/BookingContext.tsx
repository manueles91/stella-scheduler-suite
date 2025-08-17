import { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { BookableItem, Employee, TimeSlot } from '@/types/booking';

interface BookingContextType {
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  filteredItems: BookableItem[];
  setFilteredItems: (items: BookableItem[]) => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

interface BookingProviderProps {
  children: ReactNode;
}

export const BookingProvider = ({ children }: BookingProviderProps) => {
  const [selectedCategory, setSelectedCategoryState] = useState<string | null>('promociones');
  const [filteredItems, setFilteredItems] = useState<BookableItem[]>([]);

  const setSelectedCategory = useCallback((category: string | null) => {
    setSelectedCategoryState(category);
  }, []);

  const contextValue: BookingContextType = {
    selectedCategory,
    setSelectedCategory,
    filteredItems,
    setFilteredItems
  };

  return (
    <BookingContext.Provider value={contextValue}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBookingContext = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBookingContext must be used within a BookingProvider');
  }
  return context;
};