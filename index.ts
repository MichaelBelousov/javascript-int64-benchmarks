import Benchmark from "benchmark";
import Benchmark from "benchmark";
import addon from "./build/Debug/addon";

const suite = new Benchmark.Suite();

// need some kind of translation layer to their implementation of topo sort
const topoSort = new

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
  .on("cycle", function(event) {
    console.log(`${event.target}`);
  })
  .on("complete", function() {
    console.log(`Fastest was ${this.filter("fastest").map("name")}`);
  })
;

