# Simulation, Backtesting, and Look-Ahead Bias

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Market and Trading Systems</span></p>

A backtest is credible only when every decision uses information available at that simulated instant and when fills model the constraints of the historical market.

## Planned model

Replay event time, receive time, decision time, and order arrival time. Toggle latency, queue position, spread, fees, missing data, and accidental future access.

## Questions

- What information was observable at each decision timestamp?
- How are fills, partial fills, and market impact approximated?
- Which parameter choices were selected using the evaluation period?

## Exercise

Audit a strategy loop for look-ahead, survivorship, fill, and timestamp biases, then design a train-validation-test protocol.
