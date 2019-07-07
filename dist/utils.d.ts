export declare const first: <T>(arr: T[]) => T;
export declare const last: <T>(arr: T[]) => T;
export declare const split: (del: string) => (str: string) => string[];
export declare function pipe<Param, Return>(fn1: any, ...fns: any[]): (a: Param) => Return;
