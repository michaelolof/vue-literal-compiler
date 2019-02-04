export const first = <T>(arr:T[] ) => arr[0];
export const last = <T>(arr:T[]) => arr[ arr.length - 1 ];
export const split = (del:string) => (str:string) => str.split( del );

