import * as Benchmark from "benchmark";
import { Id64ArgKind, Id64Arg, getNeighbors, Id64Args, getNodes, MaybeHighBitArray, IdArgsFor, nativeDjikstras } from "./addon";
const Heap = require("heap"); // wasn't working for some reason
import { MakeIdMapClass, MakeIdSetClass } from "./Id64Containers";
const os = require("os");

const suite = new Benchmark.Suite("Int64 interop JavaScript");

declare module "benchmark" {
  // TODO: need to use an external module to get access to this on the default export
  // https://stackoverflow.com/questions/39189665/augment-external-module-that-exports-default
  export interface Options {
    note?: string;
  }
}

type Distance = number;

let expectedDistances: Distance[] | undefined;

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
  | Id64ArgKind.External
) {
  type Kind =  typeof kind;
  type Type = IdArgsFor<Kind>;
  const predecessors = new (MakeIdMapClass<Id64Arg>(kind))();
  const distances = new (MakeIdMapClass<Distance>(kind))();

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

  if (process.env.DEBUG) {
    const orderedDistances = nodes.map((node, i) => distances.get(node as Type[0], maybeHighBits[i] as Type[1])!);
    if (expectedDistances === undefined) expectedDistances = orderedDistances;
    else if (!orderedDistances.every((_d, i) => orderedDistances[i] === expectedDistances![i]))
      throw Error("expected distances were different");
  }

  return;
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
  .add("use BigInt", function() {
    djikstras(Id64ArgKind.BigInt);
  })
  // the performance of these two tests is highly affected by using a native map implementation
  // instead of JavaScript's map, due to limitations of hashing NaNs and external objects in ecmascript's Map
  .add("use 64-bit number as an 8-byte buffer", function() {
    djikstras(Id64ArgKind.DoubleAsBuffer);
  }, {
    note: "has to use a custom map"
  })
  .add("use Napi::External as an 8-byte buffer", function() {
    djikstras(Id64ArgKind.External);
  }, {
    note: "has to use a custom map"
  })
  //.add("use 64-bit number as an 8-byte buffer, native equality check only", function() {})
  .on("cycle", function(event: Benchmark.Event) {
    if (event.aborted) console.log(`test '${event.target.name}' was aborted`);
    if (event.cancelled) console.log(`test '${event.target.name}' was cancelled`);
    console.log(event.target.toString());
  })
  .on("complete", function(this: Benchmark.Suite) {
    const maxHz = this.sort((a, b) => b.hz - a.hz)[0].hz;
    const fmter = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 4,
    });
    console.log(`ran on ${os.platform()}-${os.arch()} on node ${process.version}`);
    console.table(
      this
        .sort((a, b) => b.hz - a.hz)
        .reduce<Record<string, {}>>((prev, cur: Benchmark) => (
          prev[cur.name] = {
            "ops/s": Number(fmter.format(cur.hz)),
            samples: cur.stats.sample.length,
            "margin of error": `±${Number(cur.stats.rme).toFixed(2)}%`,
            ratio: Number(fmter.format(cur.hz / maxHz)),
            note: (cur as any).note,
          },
          prev
        ), {})
    )
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

