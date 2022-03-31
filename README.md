
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
│       do it all in native (control)       │ 360.5484 │   70    │    '±4.22%'     │   1    │                           │
│  use byte string: '\u{0001}\x00\x00\x42'  │ 96.9654  │   77    │    '±1.01%'     │ 0.2689 │                           │
│                use BigInt                 │  61.884  │   62    │    '±2.71%'     │ 0.1716 │                           │
│    use two number arguments everywhere    │ 58.7188  │   51    │    '±5.70%'     │ 0.1629 │                           │
│       use low/high array [u32, u32]       │ 40.4611  │   53    │    '±5.47%'     │ 0.1122 │                           │
│ use low/high object {low: u32, high: u32} │ 32.7643  │   50    │    '±5.49%'     │ 0.0909 │                           │
│              use Uint32Array              │ 31.9666  │   49    │    '±6.62%'     │ 0.0887 │                           │
│          use hex string: '0xff'           │ 31.5042  │   54    │    '±2.22%'     │ 0.0874 │                           │
│   use 64-bit number as an 8-byte buffer   │ 30.2948  │   55    │    '±4.67%'     │ 0.084  │ 'has to use a custom map' │
│  use Napi::External as an 8-byte buffer   │ 27.1923  │   49    │    '±4.47%'     │ 0.0754 │ 'has to use a custom map' │
└───────────────────────────────────────────┴──────────┴─────────┴─────────────────┴────────┴───────────────────────────┘
```
