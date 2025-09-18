/**
 * Create a namespaced logger
 * @param {string|null} [namespace]
 * @returns {{info: function({fn?: any, message?: any, data?: any}): void,
 *            error: function({fn?: any, message?: any, data?: any}): void,
 *            warn: function({fn?: any, message?: any, data?: any}): void}}
 */
export function Logger(namespace?: string | null | undefined): {
    info: (arg0: {
        fn?: any;
        message?: any;
        data?: any;
    }) => void;
    error: (arg0: {
        fn?: any;
        message?: any;
        data?: any;
    }) => void;
    warn: (arg0: {
        fn?: any;
        message?: any;
        data?: any;
    }) => void;
};
