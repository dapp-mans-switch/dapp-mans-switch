export const idlFactory = ({ IDL }) => {
  const Staker = IDL.Record({
    'days' : IDL.Nat,
    'name' : IDL.Text,
    'amount' : IDL.Nat,
  });
  return IDL.Service({
    'addStaker' : IDL.Func([IDL.Text, IDL.Nat, IDL.Nat], [IDL.Nat], []),
    'editStaker' : IDL.Func(
        [IDL.Nat, IDL.Text, IDL.Nat, IDL.Nat],
        [IDL.Bool],
        [],
      ),
    'greet' : IDL.Func([IDL.Text], [IDL.Text], []),
    'listAllStakers' : IDL.Func([], [IDL.Vec(Staker)], ['query']),
    'lookupStaker' : IDL.Func([IDL.Nat], [IDL.Opt(Staker)], ['query']),
    'removeStaker' : IDL.Func([IDL.Nat], [IDL.Bool], []),
  });
};
export const init = ({ IDL }) => { return []; };
