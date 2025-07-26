/**
 * Marks a script fully loaded.
 * @function
 * @param {string} id - The id of the associated script.
 */
export function isScriptFullyLoaded(id: string): any;
/**
 * Allows use of a pre-defined script, employs lazy-loading.
 * @function
 * @param {string} id - The id of the associated script.
 * @param {function} onload - A function to be executed on load of the script.
 * @param {function} onerror - A function to be executed on error.
 */
export function useScript(id: string, onload?: Function, onerror?: Function): void;
export namespace Scripts {
    let jquerymask: string;
    let canadapost: string;
    let chosen: string;
    let jquery: string;
    let jqueryui: string;
    let shoelace: string;
    let flatpickr: string;
}
