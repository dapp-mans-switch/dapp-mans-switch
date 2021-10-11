import type { Principal } from '@dfinity/principal';
export interface Counter {
  'getCount' : () => Promise<bigint>,
  'updateCount' : (arg_0: bigint) => Promise<boolean>,
}
export interface Secret {
  'reward' : bigint,
  'valid' : boolean,
  'keys' : Array<bigint>,
  'key_holders' : Array<bigint>,
  'secret_id' : bigint,
  'heartbeat_freq' : bigint,
  'revealed' : Array<boolean>,
  'last_heartbeat' : bigint,
  'expiry_time' : bigint,
  'author_id' : bigint,
  'payload' : string,
}
export interface Staker { 'days' : bigint, 'name' : string, 'amount' : bigint }
export interface _SERVICE {
  'addSecret' : (
      arg_0: string,
      arg_1: bigint,
      arg_2: bigint,
      arg_3: bigint,
      arg_4: Array<bigint>,
      arg_5: Array<bigint>,
    ) => Promise<bigint>,
  'addStaker' : (arg_0: string, arg_1: bigint, arg_2: bigint) => Promise<
      bigint
    >,
  'editStaker' : (
      arg_0: bigint,
      arg_1: string,
      arg_2: bigint,
      arg_3: bigint,
    ) => Promise<boolean>,
  'getCounter' : (arg_0: bigint) => Promise<Principal>,
  'greet' : (arg_0: string) => Promise<string>,
  'listAllStakers' : () => Promise<Array<Staker>>,
  'lookupSecret' : (arg_0: bigint) => Promise<[] | [Secret]>,
  'lookupStaker' : (arg_0: bigint) => Promise<[] | [Staker]>,
  'removeStaker' : (arg_0: bigint) => Promise<boolean>,
  'revealKey' : (arg_0: bigint, arg_1: bigint, arg_2: bigint) => Promise<
      boolean
    >,
  'sendHearbeat' : (arg_0: bigint, arg_1: bigint) => Promise<boolean>,
  'sharedGreet' : (arg_0: string) => Promise<string>,
  'shouldReveal' : (arg_0: bigint) => Promise<boolean>,
}
