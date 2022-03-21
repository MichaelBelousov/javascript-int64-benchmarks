import * as Benchmark from "benchmark";
import { Id64ArgKind } from "./addon";

const suite = new Benchmark.Suite();

function randUint32() {
  const MAX_UINT32 = 2**32 - 1;
  return Math.floor(Math.random() * MAX_UINT32);
}

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

function buildGraph() {
  const uint32 = Math.random() * 2**32
}

function djikstras() {

}

suite
  .add("use low/high object {low: u32, high: u32}", function() {
  })
  .add("use low/high array {u32, u32}", function() {
  })
  .add("use hex string: '0xff'", function() {
  })
  .add("use base64 string: 'bXd='", function() {
  })
  .add("use byte string: '\\u{0001}\\x00\\x00\\x42", function() {
  })
  .add("use two numbers", function() {
  })
  .add("Uint32Array", function() {
  })
  .add("use 64-bit number as an 8-byte buffer", function() {
  })
  .add("use 64-bit number as an 8-byte buffer, native equality check only", function() {
  })
  .on("cycle", function(event: Benchmark.Event) {
    console.log(`${event.target}`);
  })
  .on("complete", function(this: Benchmark.Suite) {
    console.log(this.join('\n'));
  })
;

