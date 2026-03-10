# Sample prompts for the Injective Trading Autosign skill

Sample prompt 1:

```text
Grant autosign permissions to account inj1... for MsgCreateDerivativeMarketOrder MsgCancelDerivativeOrder transactions.
```

Sample prompt 2:

```text
Revoke autosign permissions from account inj1... for all transaction types.
```

Sample prompt 3:

```text
Grant MsgSend, MsgWithdraw auto sign permissions to inj1... account.
```

This skill should *reject* this request, saying "Autosign is not allowed for these transaction types."
