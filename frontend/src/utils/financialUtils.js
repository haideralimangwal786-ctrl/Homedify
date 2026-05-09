/**
 * Homedify Global Financial Logic
 * Formula: Net Payout = Item Price - (Item Price * (globalRate / 100))
 */

export const calculatePayout = (price, globalRate = 10) => {
    if (!price) return 0;
    const commission = price * (globalRate / 100);
    const netPayout = price - commission;
    return {
        gross: price,
        commission: commission,
        net: netPayout,
        rate: globalRate
    };
};

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        minimumFractionDigits: 0
    }).format(amount);
};
