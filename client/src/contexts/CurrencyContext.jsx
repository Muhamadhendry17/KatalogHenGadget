import { createContext, useContext, useMemo } from 'react';

const CurrencyContext = createContext(null);

export function CurrencyProvider({ currency = 'Rp.', children }) {
  const formatCurrency = useMemo(() => {
    const symbol = String(currency || 'Rp.').trim() || 'Rp.';
    return (amount) => {
      const number = Number(amount) || 0;
      return `${symbol} ${number.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;
    };
  }, [currency]);

  return <CurrencyContext.Provider value={formatCurrency}>{children}</CurrencyContext.Provider>;
}

export const useFormatCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useFormatCurrency must be used within CurrencyProvider');
  return context;
};
