
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
┌───────────────────────────────────────────┬──────────┬─────────┬─────────────────┬────────┬───────────────────────────┐
│                  (index)                  │  ops/s   │ samples │ margin of error │ ratio  │           note            │
├───────────────────────────────────────────┼──────────┼─────────┼─────────────────┼────────┼───────────────────────────┤
│       do it all in native (control)       │ 329.0603 │   87    │    '±4.02%'     │   1    │                           │
│    use two number arguments everywhere    │ 75.5317  │   66    │    '±3.63%'     │ 0.2295 │                           │
│                use BigInt                 │ 75.2404  │   64    │    '±4.14%'     │ 0.2287 │                           │
│  use byte string: '\u{0001}\x00\x00\x42'  │ 73.5554  │   70    │    '±5.40%'     │ 0.2235 │                           │
│ use low/high object {low: u32, high: u32} │ 33.8693  │   61    │    '±4.72%'     │ 0.1029 │                           │
│       use low/high array [u32, u32]       │ 31.4116  │   56    │    '±3.10%'     │ 0.0955 │                           │
│          use hex string: '0xff'           │ 29.6327  │   52    │    '±1.25%'     │ 0.0901 │                           │
│              use Uint32Array              │ 27.7123  │   47    │    '±3.77%'     │ 0.0842 │                           │
│  use Napi::External as an 8-byte buffer   │ 24.1303  │   46    │    '±4.79%'     │ 0.0733 │ 'has to use a custom map' │
│   use 64-bit number as an 8-byte buffer   │ 23.6506  │   43    │    '±4.68%'     │ 0.0719 │ 'has to use a custom map' │
└───────────────────────────────────────────┴──────────┴─────────┴─────────────────┴────────┴───────────────────────────┘
```
