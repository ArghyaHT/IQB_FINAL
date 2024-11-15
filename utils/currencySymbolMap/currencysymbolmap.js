import currencySymbolMap from 'currency-symbol-map';

export const getCurrencySymbol = async(currencyCode) => {
    const currencySymbol = await currencySymbolMap(currencyCode);

    return currencySymbol;
}