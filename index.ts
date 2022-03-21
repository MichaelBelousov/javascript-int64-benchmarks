import * as Benchmark from "benchmark";
import { Id64ArgKind, Id64, getNeighbors } from "./addon";
import Heap from "heap";
import { MakeIdMapClass } from "./Id64Containers";

const suite = new Benchmark.Suite();

function djikstras<Kind extends Id64ArgKind, Type extends Id64>(kind: Kind, start: Type) {
  const predecessors = new (MakeIdMapClass<Id64>(kind))();
  const distances = new (MakeIdMapClass<Kind>(kind))();
  // FIXME: need to write a custom priority queue where we pass numbers by param...
  function nodeDistanceCmp(l: Type, r: Type): number {
    return (distances as any).get(l)! - (distances as any).get(r)!;
  }
  const queue = new Heap(nodeDistanceCmp);
  // TODO: need a custom set type
  const inQueue = new Set<Type>();

  for (const nodeId of getNodes()) {
    distances.set(nodeId, Number.POSITIVE_INFINITY);
    queue.push(nodeId)
    inQueue.add(nodeId);
  }
  distances.set(start, 0);

  while(!queue.empty()) {
    const u = queue.pop();
    const neighbors = getNeighbors(u);
    for (const neighbor of neighbors) {
      const stillInQueue = inQueue.has(neighbor);
      if (!stillInQueue) continue;
      const edgeSize = 1;
      const alt = distances.get(u) + 1;
      if (alt < distances.get(neighbor)) {
        distances.set(neighbor, alt);
        predecessors.set(neighbor, u);
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

