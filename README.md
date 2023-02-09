
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
ran on linux-x64 on node v18.14.0
┌─────────────────────────────────────────────────┬──────────┬─────────┬─────────────────┬────────┬─────────────────────────────────────────┐
│                     (index)                     │  ops/s   │ samples │ margin of error │ ratio  │                  note                   │
├─────────────────────────────────────────────────┼──────────┼─────────┼─────────────────┼────────┼─────────────────────────────────────────┤
│          do it all in native (control)          │ 307.7858 │   65    │    '±2.85%'     │   1    │                                         │
│ use half byte encoded string: '\x00SF\xfc&\x11' │ 71.5697  │   63    │    '±4.61%'     │ 0.2325 │                                         │
│     use byte string: '\u{0001}\x00\x00\x42'     │ 70.0191  │   62    │    '±7.14%'     │ 0.2275 │                                         │
│       use two number arguments everywhere       │ 59.8509  │   53    │    '±5.69%'     │ 0.1945 │                                         │
│                   use BigInt                    │ 57.6093  │   51    │    '±9.14%'     │ 0.1872 │                                         │
│          use low/high array [u32, u32]          │ 37.4102  │   49    │    '±6.52%'     │ 0.1215 │                                         │
│                 use Uint32Array                 │  36.61   │   49    │    '±4.82%'     │ 0.1189 │                                         │
│    use low/high object {low: u32, high: u32}    │ 34.7259  │   50    │    '±3.92%'     │ 0.1128 │                                         │
│     use hex string (string stream): '0xff'      │ 32.5032  │   47    │    '±9.93%'     │ 0.1056 │ 'uses slow C++ stringstream and stoull' │
│          use hex string (stoi): '0xff'          │ 29.9514  │   40    │    '±7.37%'     │ 0.0973 │    'uses std::to_string and stoull'     │
│  use hex string (custom deserializer): '0xff'   │ 28.1802  │   38    │    '±9.92%'     │ 0.0916 │   'uses custom hex parser and stoull'   │
│     use Napi::External as an 8-byte buffer      │  23.334  │   42    │    '±4.75%'     │ 0.0758 │        'has to use a custom map'        │
│      use 64-bit number as an 8-byte buffer      │ 21.2934  │   45    │    '±11.05%'    │ 0.0692 │        'has to use a custom map'        │
└─────────────────────────────────────────────────┴──────────┴─────────┴─────────────────┴────────┴─────────────────────────────────────────┘
```

## iTwin TypedId64 Format

- In a string:
  - optimized:
    - stores 2 bytes of briefcase id
    - stores 2 bytes of class id
    - stores 4 bytes of element id
  - de-optimized
    - stores 8 bytes of class id
    - stores 3 bytes of briefcaseid
    - stores 5 bytes of element id

## iTwin non typed Id64 Format

In JavaScript we could just use a regular number up until the the 53-bit mark. That leaves us
13 bits of space for the briefcase id.
