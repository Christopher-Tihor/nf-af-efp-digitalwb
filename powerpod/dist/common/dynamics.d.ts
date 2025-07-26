type User = {
    contactId: string;
    userName: string;
};
export declare function getCurrentUser(): User;
export declare function preloadRequestVerificationToken(): Promise<void>;
export declare function getRequestVerificationToken(): string | number | string[] | undefined;
export {};
