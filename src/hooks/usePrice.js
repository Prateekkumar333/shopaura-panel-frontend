import { useCallback } from 'react';

const usePrice = () => {
  const format = useCallback((amount, options = {}) => {
    if (amount == null || isNaN(amount)) return '₹0';

    const {
      showSymbol = true,
      decimals = 2,
    } = options;

    const formatted = Number(amount).toLocaleString('en-IN', {
      minimumFractionDigits: decimals > 0 ? 0 : 0,
      maximumFractionDigits: decimals,
    });

    return showSymbol ? `₹${formatted}` : formatted;
  }, []);

  return {
    format,
  };
};

export default usePrice;
