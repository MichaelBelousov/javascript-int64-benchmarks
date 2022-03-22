import * as Benchmark from "benchmark";
import { Id64ArgKind, Id64Arg, getNeighbors, Id64Args, getNodes, MaybeHighBitArray, IdArgsFor, nativeDjikstras } from "./addon";
//import Heap from "heap";
const Heap = require("heap"); // wasn't working for some reason
import { MakeIdMapClass, MakeIdSetClass } from "./Id64Containers";

const suite = new Benchmark.Suite("Int64 interop JavaScript");

function djikstras(
  kind:
  | Id64ArgKind.LowHighObject
  | Id64ArgKind.LowHighArray
  | Id64ArgKind.HexString
  | Id64ArgKind.Base64String
  | Id64ArgKind.ByteString
  | Id64ArgKind.TwoNumbers
  | Id64ArgKind.Uint32Array
  | Id64ArgKind.DoubleAsBuffer
  | Id64ArgKind.BigInt
) {
  type Kind =  typeof kind;
  type Type = IdArgsFor<Kind>;
  const predecessors = new (MakeIdMapClass<Id64Arg>(kind))();
  const distances = new (MakeIdMapClass<Kind>(kind))();

  // FIXME: need a custom priority queue where we don't need to spread array args
  // WTH: why do I need to recreate the tuples for them to be spreadable :/
  function nodeDistanceCmp(l: [Type[0], Type[1]], r: [Type[0], Type[1]]): number {
    return distances.get(...l)! - distances.get(...r)!;
  }
  const queue = new Heap(nodeDistanceCmp);
  const inQueue = new (MakeIdSetClass<Type>(kind))();

  const nodes = getNodes(kind);
  const maybeHighBits: number[] = (nodes as MaybeHighBitArray<Id64Args.TwoNumbers>).highBits || [];

  const start = nodes[0], startExtra = maybeHighBits[0];

  for (let i = 0; i < nodes.length; ++i) {
    const nodeId = nodes[i] as Type[0], nodeIdExtra = maybeHighBits[i];
    distances.set(nodeId, nodeIdExtra, Number.POSITIVE_INFINITY);
    queue.push([nodeId, nodeIdExtra]);
    inQueue.add(nodeId, nodeIdExtra);
  }
  distances.set(start as any, startExtra, 0);

  while(!queue.empty()) {
    const [u, uExtra] = queue.pop() as Id64Arg;
    // FIXME remove `any` usage
    const neighbors = getNeighbors(kind, u as any, uExtra as any) as Type[0][];
    const maybeHighBits: number[] = (neighbors as MaybeHighBitArray<Id64Args.TwoNumbers>).highBits || [];
    for (let i = 0; i < neighbors.length; ++i) {
      const neighbor = neighbors[i];
      const neighborExtra = maybeHighBits[i];
      const stillInQueue = inQueue.has(neighbor, neighborExtra);
      if (!stillInQueue) continue;
      const edgeSize = 1;
      const alt = distances.get(u, uExtra)! + edgeSize;
      if (alt < distances.get(neighbor, neighborExtra)!) {
        distances.set(neighbor, neighborExtra, alt);
        predecessors.set(neighbor, neighborExtra, [u, uExtra] as Id64Arg);
      }
    }
  }
}

const erroredBenchmarks = new Set<Benchmark>();

suite
  .add("use low/high object {low: u32, high: u32}", function() {
    djikstras(Id64ArgKind.LowHighObject);
  })
  .add("use low/high array [u32, u32]", function() {
    djikstras(Id64ArgKind.LowHighArray);
  })
  .add("use hex string: '0xff'", function() {
    djikstras(Id64ArgKind.HexString);
  })
  // not implemented
  //.add("use unprefixed hex string: 'ff'", function() {})
  //.add("use prefixed hex string with fast parse routine: '0xff'", function() { })
  //.add("use base64 string: 'bXd='", function() {
  //  djikstras(Id64ArgKind.Base64String);
  //})
  .add("use byte string: '\\u{0001}\\x00\\x00\\x42'", function() {
    djikstras(Id64ArgKind.ByteString);
  })
  .add("use two number arguments everywhere", function() {
    djikstras(Id64ArgKind.TwoNumbers);
  })
  .add("use Uint32Array", function() {
    djikstras(Id64ArgKind.Uint32Array);
  })
  .add("do it all in native (control)", function() {
    nativeDjikstras();
  })
  // the performance of this test is highly affected by using a native map implementation
  // instead of JavaScript's map, due to limitations of comparing NaNs in JavaScript
  .add("use 64-bit number as an 8-byte buffer", function() {
    djikstras(Id64ArgKind.DoubleAsBuffer);
  })
  .add("use BigInt", function() {
    djikstras(Id64ArgKind.BigInt);
  })
  //.add("use 64-bit number as an 8-byte buffer, native equality check only", function() {})
  .on("cycle", function(event: Benchmark.Event) {
    if (event.aborted) console.log(`test '${event.target.name}' was aborted`);
    if (event.cancelled) console.log(`test '${event.target.name}' was cancelled`);
    else console.log(`${event.target}`);
  })
  .on("complete", function(this: Benchmark.Suite) {
    const [fastest]: string[] = this
      .filter('fastest')
      .filter((b: Benchmark) => !/\(control\)$/.test(b.name))
      .map((b: Benchmark) => b.name);
    console.log(`fastest was: ${fastest}`);
  })
  .on("error", function(this: Benchmark.Suite) {
    const [newError] = this
      .filter((benchmark: Benchmark) => benchmark.error)
      .filter((benchmark: Benchmark) => !erroredBenchmarks.has(benchmark))
      .map((benchmark: Benchmark) => benchmark.error);
    erroredBenchmarks.add(newError);
    console.error(newError);
  })
  .on("abort", function(this: Benchmark) {
    console.error("aborted");
  })
  .run()
;

