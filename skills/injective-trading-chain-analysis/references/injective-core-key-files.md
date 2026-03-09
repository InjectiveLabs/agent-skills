# Key files in injective-core for the exchange module

```text
x/exchange/
├── keeper/
│   ├── derivative_liquidations.go    # Liquidation engine
│   ├── derivative_orders.go          # Order placement/cancellation
│   ├── derivative_positions.go       # Position management
│   ├── funding.go                    # Funding rate calculation
│   ├── margin.go                     # Margin calculations
│   └── offset_positions.go           # Position offsetting
├── types/
│   ├── derivative_orders.go          # Order types/validation
│   ├── derivative_positions.go       # Position types
│   └── params.go                     # Module parameters
└── module.go                         # Module registration
```

Note: injective-core is the main repo for the blockchain node of Injective.
See: https://github.com/InjectiveLabs/injective-core
