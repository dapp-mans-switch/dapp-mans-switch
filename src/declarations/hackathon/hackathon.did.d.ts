import type { Principal } from '@dfinity/principal';
export interface Staker { 'days' : bigint, 'name' : string, 'amount' : bigint }
export interface _SERVICE {
  'addStaker' : (arg_0: string, arg_1: bigint, arg_2: bigint) => Promise<
      bigint
    >,
  'editStaker' : (
      arg_0: bigint,
      arg_1: string,
      arg_2: bigint,
      arg_3: bigint,
    ) => Promise<boolean>,
  'greet' : (arg_0: string) => Promise<string>,
  'listAllStakers' : () => Promise<Array<Staker>>,
  'lookupStaker' : (arg_0: bigint) => Promise<[] | [Staker]>,
  'removeStaker' : (arg_0: bigint) => Promise<boolean>,
}
