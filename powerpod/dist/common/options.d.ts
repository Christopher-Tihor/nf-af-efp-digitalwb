export function getOptions(): any;
export function setOptions(options: any): any;
export function setOption(name: any, value: any): void;
export function getOriginals(): any;
export const ENV_LOG_LEVEL: {
    [Environment.DEV]: number;
    [Environment.TEST]: number;
    [Environment.PROD]: number;
};
import { Environment } from './constants.js';
