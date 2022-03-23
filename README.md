
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
│       do it all in native (control)       │ 185.1604 │   79    │    '±3.38%'     │   1    │
│  use byte string: '\u{0001}\x00\x00\x42'  │ 165.0317 │   84    │    '±1.38%'     │ 0.8913 │
│    use two number arguments everywhere    │ 62.8541  │   65    │    '±0.99%'     │ 0.3395 │
│          use hex string: '0xff'           │ 54.7092  │   70    │    '±1.89%'     │ 0.2955 │
│       use low/high array [u32, u32]       │ 53.4918  │   69    │    '±1.11%'     │ 0.2889 │
│                use BigInt                 │ 48.3158  │   50    │    '±5.21%'     │ 0.2609 │
│ use low/high object {low: u32, high: u32} │ 40.9281  │   59    │    '±9.75%'     │ 0.221  │
│              use Uint32Array              │ 28.1204  │   48    │    '±5.87%'     │ 0.1519 │
│   use 64-bit number as an 8-byte buffer   │ 22.8174  │   41    │    '±2.06%'     │ 0.1232 │
└───────────────────────────────────────────┴──────────┴─────────┴─────────────────┴────────┘
```
