/**
 * Formats a number as Indonesian Rupiah (IDR) with "Rp" prefix and thousand separators.
 * Example: 1000 -> "Rp 1.000"
 */
export const formatIDR = (value: number | string): string => {
    if (value === '' || value === undefined || value === null) return '';

    const numericValue = typeof value === 'string' ? parseInt(value.replace(/\D/g, ''), 10) : value;
    if (isNaN(numericValue)) return '';

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(numericValue).replace('Rp', 'Rp ');
};

/**
 * Parses a numeric value from an IDR formatted string.
 * Example: "Rp 1.000" -> 1000
 */
export const parseIDR = (value: string): number => {
    const numericString = value.replace(/\D/g, '');
    return numericString === '' ? 0 : parseInt(numericString, 10);
};
