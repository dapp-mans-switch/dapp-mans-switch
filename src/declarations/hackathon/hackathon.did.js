export const idlFactory = ({ IDL }) => {
  const Staker = IDL.Record({
    'days' : IDL.Nat,
    'name' : IDL.Text,
    'amount' : IDL.Nat,
  });
  const Secret = IDL.Record({
    'reward' : IDL.Nat,
    'valid' : IDL.Bool,
    'keys' : IDL.Vec(IDL.Nat),
    'key_holders' : IDL.Vec(IDL.Nat),
    'secret_id' : IDL.Nat,
    'heartbeat_freq' : IDL.Int,
    'revealed' : IDL.Vec(IDL.Bool),
    'last_heartbeat' : IDL.Int,
    'expiry_time' : IDL.Int,
    'author_id' : IDL.Nat,
    'payload' : IDL.Text,
  });
  return IDL.Service({
    'addSecret' : IDL.Func(
        [
          IDL.Text,
          IDL.Nat,
          IDL.Int,
          IDL.Int,
          IDL.Vec(IDL.Nat),
          IDL.Vec(IDL.Nat),
        ],
        [IDL.Nat],
        [],
      ),
    'addStaker' : IDL.Func([IDL.Text, IDL.Nat, IDL.Nat], [IDL.Nat], []),
    'editStaker' : IDL.Func(
        [IDL.Nat, IDL.Text, IDL.Nat, IDL.Nat],
        [IDL.Bool],
        [],
      ),
    'greet' : IDL.Func([IDL.Text], [IDL.Text], []),
    'listAllStakers' : IDL.Func([], [IDL.Vec(Staker)], ['query']),
    'lookupSecret' : IDL.Func([IDL.Nat], [IDL.Opt(Secret)], ['query']),
    'lookupStaker' : IDL.Func([IDL.Nat], [IDL.Opt(Staker)], ['query']),
    'removeStaker' : IDL.Func([IDL.Nat], [IDL.Bool], []),
    'revealKey' : IDL.Func([IDL.Nat, IDL.Nat, IDL.Nat], [IDL.Bool], []),
    'sendHearbeat' : IDL.Func([IDL.Nat, IDL.Nat], [IDL.Bool], []),
    'shouldReveal' : IDL.Func([IDL.Nat], [IDL.Bool], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
