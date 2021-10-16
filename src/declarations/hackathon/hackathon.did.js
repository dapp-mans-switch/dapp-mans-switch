export const idlFactory = ({ IDL }) => {
  const Counter = IDL.Service({
    'getCount' : IDL.Func([], [IDL.Int], ['query']),
    'updateCount' : IDL.Func([IDL.Int], [IDL.Bool], []),
  });
  const Staker = IDL.Record({
    'id' : IDL.Principal,
    'public_key' : IDL.Nat,
    'days' : IDL.Nat,
    'name' : IDL.Text,
    'amount' : IDL.Nat,
  });
  const Secret = IDL.Record({
    'reward' : IDL.Nat,
    'valid' : IDL.Bool,
    'keys' : IDL.Vec(IDL.Nat),
    'key_holders' : IDL.Vec(IDL.Principal),
    'secret_id' : IDL.Nat,
    'heartbeat_freq' : IDL.Int,
    'revealed' : IDL.Vec(IDL.Bool),
    'last_heartbeat' : IDL.Int,
    'expiry_time' : IDL.Int,
    'author_id' : IDL.Principal,
    'payload' : IDL.Text,
  });
  return IDL.Service({
    'addSecret' : IDL.Func(
        [IDL.Text, IDL.Nat, IDL.Int, IDL.Int, IDL.Vec(IDL.Principal)],
        [IDL.Nat],
        [],
      ),
    'getCounter' : IDL.Func([IDL.Nat], [Counter], []),
    'greet' : IDL.Func([IDL.Text], [IDL.Text], []),
    'listAllStakers' : IDL.Func([], [IDL.Vec(Staker)], ['query']),
    'lookupSecret' : IDL.Func([IDL.Nat], [IDL.Opt(Secret)], ['query']),
    'lookupStaker' : IDL.Func([IDL.Nat], [IDL.Opt(Staker)], ['query']),
    'registerStaker' : IDL.Func(
        [IDL.Text, IDL.Nat, IDL.Nat, IDL.Nat],
        [IDL.Nat],
        [],
      ),
    'removeStaker' : IDL.Func([IDL.Nat], [IDL.Bool], []),
    'revealKey' : IDL.Func([IDL.Nat, IDL.Nat, IDL.Nat], [IDL.Bool], []),
    'sendHearbeat' : IDL.Func([IDL.Nat], [IDL.Bool], []),
    'sharedGreet' : IDL.Func([IDL.Text], [IDL.Text], []),
    'shouldReveal' : IDL.Func([IDL.Nat], [IDL.Bool], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
