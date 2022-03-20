import * as Benchmark from "benchmark";
import * as addon from "./addon";

const suite = new Benchmark.Suite();

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
  .on("cycle", function(event: Benchmark.Event) {
    console.log(`${event.target}`);
  })
  .on("complete", function(this: Benchmark.Suite) {
    console.log(this.join('\n'));
  })
;

