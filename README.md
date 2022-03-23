
# JavaScript Int64 benchmark

JavaScript has no built in 64-bit integer type.
Although [BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) was added to partially
resolve this, it has been shown to be slower than existing hacks for the 64-bit integers in JavaScript that years of v8 performance
tuning have already optimized down.

This benchmark tries to capture the performance of various 64-bit integer implementations in JavaScript to see if BigInt has caught up,
and how it compares to many other ways of shoving a 64-bit integer into JavaScript.

Goals are:

- measure performance accurately in the V8 JavaScript engine
- measure performance of marshalling various JavaScript representations of Int64 through native bindings
- use idiomatic code for storing Int64 in JavaScript values

## The latest results

Last generated on my 6-core i7-8850H@2.60GHz on node v12.22.7

```results
ran on linux-x64 on node v17.5.0
┌───────────────────────────────────────────┬──────────┬─────────┬─────────────────┬────────┐
│                  (index)                  │  ops/s   │ samples │ margin of error │ ratio  │
├───────────────────────────────────────────┼──────────┼─────────┼─────────────────┼────────┤
│       do it all in native (control)       │ 289.392  │   90    │    '±0.20%'     │   1    │
│  use byte string: '\u{0001}\x00\x00\x42'  │ 165.2877 │   83    │    '±0.52%'     │ 0.5712 │
│    use two number arguments everywhere    │ 65.5672  │   68    │    '±0.33%'     │ 0.2266 │
│                use BigInt                 │ 65.1298  │   66    │    '±4.63%'     │ 0.2251 │
│          use hex string: '0xff'           │ 53.3297  │   69    │    '±0.33%'     │ 0.1843 │
│       use low/high array [u32, u32]       │  48.736  │   64    │    '±1.38%'     │ 0.1684 │
│              use Uint32Array              │  37.026  │   64    │    '±0.80%'     │ 0.1279 │
│ use low/high object {low: u32, high: u32} │ 27.7769  │   47    │    '±8.86%'     │ 0.096  │
│   use 64-bit number as an 8-byte buffer   │ 24.3484  │   44    │    '±1.45%'     │ 0.0841 │
└───────────────────────────────────────────┴──────────┴─────────┴─────────────────┴────────┘
```
