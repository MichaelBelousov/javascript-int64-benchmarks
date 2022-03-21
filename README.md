
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
```
