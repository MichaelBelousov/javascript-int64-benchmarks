import * as Benchmark from "benchmark";
import * as addon from "./addon";

const suite = new Benchmark.Suite();

// generating the graph in javascript is interesting but afaik not comparable
// to C++, the random generation is probably pretty non-comparable
function randId64(kind: Id64ArgKind) {
  switch (kind) {
    case Id64ArgKind.LowHighObject: return { low: randUint32(), high: randUint32() };
    case Id64ArgKind.LowHighArray:
      return [randUint32(), randUint32()];
    case Id64ArgKind.HexString:
      return `0x${randUint32().toString(16)}${randUint32().toString(16).padStart(8, '0')}`
    case Id64ArgKind.Base64String:
      return Buffer.from(new Uint32Array([randUint32(), randUint32()])).toString("base64");
    case Id64ArgKind.ByteString:
    default:
      return Math.random();
  }
}

suite
  .add("low/high u32: {u32,u32}", function() {
  })
  .add("hex: 0xff", function() {
  })
  .add("base64: 0xff", function() {
  })
  .add("store u64 directly in string", function() {
  })
  .add("store u64 directly in number", function() {
  })
  .add("store u64 directly in number, native equality fallback only", function() {
  })
  .on("cycle", function(event: Benchmark.Event) {
    console.log(`${event.target}`);
  })
  .on("complete", function(this: Benchmark.Suite) {
    console.log(this.join('\n'));
  })
;

