export const idlFactory = ({ IDL }) => {
  const Staker = IDL.Record({
    'days' : IDL.Nat,
    'name' : IDL.Text,
    'amount' : IDL.Nat,
  });
  return IDL.Service({
    'edit' : IDL.Func([IDL.Nat, IDL.Text, IDL.Nat, IDL.Nat], [IDL.Bool], []),
    'insert' : IDL.Func([IDL.Text, IDL.Nat, IDL.Nat], [IDL.Nat], []),
    'listAll' : IDL.Func([], [IDL.Vec(Staker)], ['query']),
    'lookup' : IDL.Func([IDL.Nat], [IDL.Opt(Staker)], ['query']),
    'remove' : IDL.Func([IDL.Nat], [IDL.Bool], []),
  });
};
export const init = ({ IDL }) => { return []; };
