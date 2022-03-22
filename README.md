
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

> javascript-int64-benchmarks@1.0.0 start /home/mike/personal/javascript-int64-benchmarks
> ts-node index.ts

use BigInt x 94.35 ops/sec ±0.81% (69 runs sampled)
use low/high object {low: u32, high: u32} x 32.46 ops/sec ±5.38% (59 runs sampled)
use low/high array [u32, u32] x 39.32 ops/sec ±1.57% (54 runs sampled)
use hex string: '0xff' x 43.52 ops/sec ±0.35% (57 runs sampled)
use byte string: '\u{0001}\x00\x00\x42' x 92.97 ops/sec ±5.10% (59 runs sampled)
use two number arguments everywhere x 33.80 ops/sec ±5.97% (55 runs sampled)
use Uint32Array x 33.17 ops/sec ±1.09% (58 runs sampled)
do it all in native (control) x 32.42 ops/sec ±0.77% (43 runs sampled)
use 64-bit number as an 8-byte buffer x 10.68 ops/sec ±7.65% (32 runs sampled)
fastest was: use BigInt

```

