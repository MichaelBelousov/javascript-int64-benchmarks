import * as Benchmark from "benchmark";
import { Id64ArgKind, Id64Arg, getNeighbors, Id64Args, getNodes, MaybeHighBitArray } from "./addon";
import Heap from "heap";
import { MakeIdMapClass, MakeIdSetClass } from "./Id64Containers";

const suite = new Benchmark.Suite();

function djikstras(
  ...[kind, start, startExtra]:
  | [Id64ArgKind.LowHighObject,  ...Id64Args.LowHighObject]
  | [Id64ArgKind.LowHighArray,   ...Id64Args.LowHighArray]
  | [Id64ArgKind.HexString,      ...Id64Args.HexString]
  | [Id64ArgKind.Base64String,   ...Id64Args.Base64String]
  | [Id64ArgKind.ByteString,     ...Id64Args.ByteString]
  | [Id64ArgKind.TwoNumbers,     ...Id64Args.TwoNumbers]
  | [Id64ArgKind.Uint32Array,    ...Id64Args.Uint32Array]
  | [Id64ArgKind.DoubleAsBuffer, ...Id64Args.DoubleAsBuffer]
  | [Id64ArgKind.BigInt,         ...Id64Args.BigInt]
) {
  type Kind =  typeof kind;
  type Type = [typeof start, typeof startExtra];
  const predecessors = new (MakeIdMapClass<Id64Arg>(kind))();
  const distances = new (MakeIdMapClass<Kind>(kind))();
  // FIXME: need to write a custom priority queue where we pass numbers by param...
  function nodeDistanceCmp(l: Type, r: Type): number {
    return (distances as any).get(...l)! - (distances as any).get(...r)!;
  }
  const queue = new Heap(nodeDistanceCmp);
  const inQueue = new (MakeIdSetClass<Type>(kind))();

  // FIXME: rid all these anys

  const nodes = getNodes(kind);
  const maybeHighBits: number[] = (nodes as MaybeHighBitArray<Id64Args.TwoNumbers>).highBits ?? [];
  for (let i = 0; i < nodes.length; ++i) {
    const nodeId = nodes[i];
    const nodeIdExtra = maybeHighBits[i];
    distances.set(nodeId as any, nodeIdExtra, Number.POSITIVE_INFINITY);
    queue.push([nodeId as any, nodeIdExtra]);
    inQueue.add(nodeId as any, nodeIdExtra);
  }
  distances.set(start as any, startExtra, 0);

  while(!queue.empty()) {
    const [u, uExtra] = queue.pop();
    const neighbors = getNeighbors(kind, u, uExtra);
    const maybeHighBits: number[] = (neighbors as MaybeHighBitArray<Id64Args.TwoNumbers>).highBits ?? [];
    for (let i = 0; i < neighbors.length; ++i) {
      const neighbor = neighbors[i];
      const neighborExtra = maybeHighBits[i];
      const stillInQueue = inQueue.has(neighbor, neighborExtra);
      if (!stillInQueue) continue;
      const edgeSize = 1;
      const alt = distances.get(u, uExtra) + 1;
      if (alt < distances.get(neighbor, neighborExtra)) {
        distances.set(neighbor, neighborExtra, alt);
        predecessors.set(neighbor, neighborExtra as any, [u, uExtra] as any);
      }
    }
  }
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

