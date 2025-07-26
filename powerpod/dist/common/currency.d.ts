export function formatCurrencyOnBlur(inputValue: any, allowNegatives: any): string;
export function customizeCurrencyInput({ inputId, skipCalculatingBudget, maxDigits, limitInputValue, hideDollarSign, emptyInitialValue, initialValue, allowNegatives, }: {
    inputId: any;
    skipCalculatingBudget?: boolean | undefined;
    maxDigits?: number | undefined;
    limitInputValue?: undefined;
    hideDollarSign?: boolean | undefined;
    emptyInitialValue?: boolean | undefined;
    initialValue?: undefined;
    allowNegatives?: boolean | undefined;
}): void;
export const CURRENCY_FORMAT: Intl.NumberFormat;
