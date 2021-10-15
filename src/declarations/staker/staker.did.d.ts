import type { Principal } from '@dfinity/principal';
export interface Staker { 'days' : bigint, 'name' : string, 'amount' : bigint }
export interface _SERVICE {
  'edit' : (
      arg_0: bigint,
      arg_1: string,
      arg_2: bigint,
      arg_3: bigint,
    ) => Promise<boolean>,
  'insert' : (arg_0: string, arg_1: bigint, arg_2: bigint) => Promise<bigint>,
  'listAll' : () => Promise<Array<Staker>>,
  'lookup' : (arg_0: bigint) => Promise<[] | [Staker]>,
  'remove' : (arg_0: bigint) => Promise<boolean>,
}
