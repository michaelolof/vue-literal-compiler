export const first = <T>(arr:T[] ) => arr[0];
export const last = <T>(arr:T[]) => arr[ arr.length - 1 ];

export const split = (del:string) => (str:string) => str.split( del );

export function pipe<Param,Return>( fn1: any, ...fns: any[] ): (a:Param) => Return {
  return fns.reduce((prevFn, nextFn) => (value:any) => nextFn(prevFn(value)), fn1);
}