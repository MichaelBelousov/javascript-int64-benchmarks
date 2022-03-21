
# JavaScript Int64 benchmark

JavaScript has no built in 64-bit integer type.
Although [BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) was added to partially
resolve this, it has been shown to be slower than existing hacks for the 64-bit integers in JavaScript that years of v8 performance
tuning have already optimized down.

This benchmark tries to capture the performance of various 64-bit integer implementations in JavaScript to see if BigInt has caught up,
and how it compares to many other ways to shoving a 64-bit integer into JavaScript.

Goals are:

- measure performance accurately in the V8 JavaScript engine
- measure performance of marshalling various JavaScript representations of Int64 through native bindings
- use idiomatic code for storing Int64 in JavaScript values.

## The latest results

Last generated on my 6-core i7-8850H@2.60GHz

```results

> javascript-int64-benchmarks@1.0.0 start
> ts-node index.ts

use low/high object {low: u32, high: u32} x 20.96 ops/sec ±5.19% (40 runs sampled)
use low/high array [u32, u32] x 25.79 ops/sec ±2.36% (47 runs sampled)
use hex string: '0xff' x 27.28 ops/sec ±1.79% (49 runs sampled)
use byte string: '\u{0001}\x00\x00\x42' x 80.28 ops/sec ±0.79% (69 runs sampled)
use two number arguments everywhere x 30.79 ops/sec ±2.15% (55 runs sampled)
use Uint32Array x 20.21 ops/sec ±2.58% (38 runs sampled)
use 64-bit number as an 8-byte buffer: 
fastest was: use byte string: '\u{0001}\x00\x00\x42'

```

