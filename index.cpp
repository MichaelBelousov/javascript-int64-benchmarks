#include <limits>
#include <cstdlib>
#include <ctime>
#include <napi.h>
#include <vector>
#include <unordered_map>
#include <cstdint>
#include <queue>
#include <limits>
#include <optional>
#include <cmath>
#include <ctime>

using NodeId = uint64_t;
using Node = std::vector<NodeId>;
using Graph = std::unordered_map<NodeId, Node>;

struct JsGraph : Napi::ObjectWrap<Graph> {};

Graph buildGraph(size_t size) {
  Graph result{};
  result.reserve(size);

  std::srand(std::time(nullptr));

  // TODO: there's probably a better way to do this
  const auto& randomUint64 = []() -> uint64_t {
    static_assert(std::numeric_limits<int>::max() == RAND_MAX, "RAND_MAX is not int32_t max");
    const uint32_t high = std::rand();
    const uint32_t low = std::rand();
    const uint64_t value = (static_cast<uint64_t>(high) << 32) | low;
    return value;
  };

  // create nodes
  for (auto i = 0UL; i < size; ++i) {

  }

  // create edges
  for (auto i = 0UL; i < size; ++i)
  for (auto j = 0UL; j < size; ++j)
  for (const auto& direction : {true, false}) {
    static_assert(std::numeric_limits<int>::max() == RAND_MAX, "RAND_MAX is not int32_t max");
    const uint32_t high = std::rand();
    const uint32_t low = std::rand();
    const uint64_t value = 
  }

  return result;
}

using Distance = uint32_t;

// raw native implementation, used as a control
Distance djikstras(const Graph& graph, NodeId start, NodeId end) {
  std::unordered_map<NodeId, std::optional<NodeId>> predecessors; predecessors.reserve(graph.size());
  std::unordered_map<NodeId, Distance> distances; distances.reserve(graph.size());
  auto queue = std::priority_queue<NodeId>{};
  constexpr auto INFINITY = std::numeric_limits<NodeId>::max();
  for (const auto& [nodeId, node] : graph) {
    distances[nodeId] = INFINITY;
    predecessors[nodeId] = std::optional;
  }
  return 0;
}

uint32_t lastHighBits = 0U;

namespace Int64Converters {
  // ({low, high}) => ({low, high})
  auto lowHighObject(const Napi::Value& jsVal) -> NodeId {
    const uint32_t low = jsVal.As<Napi::Object>().Get("low").As<Napi::Number>().Uint32Value();
    const uint32_t high = jsVal.As<Napi::Object>().Get("high").As<Napi::Number>().Uint32Value();
    const NodeId value = (static_cast<uint64_t>(high) << 32) | low;
    return value;
  }
  // ([low, high]) => [low, high]
  auto lowHighArray(const Napi::Value& jsVal) -> NodeId {
    const auto&& array = jsVal.As<Napi::Array>();
    const uint32_t low = array[0U].As<Napi::Number>().Uint32Value();
    const uint32_t high = array[1U].As<Napi::Number>().Uint32Value();
    const NodeId value = (static_cast<uint64_t>(high) << 32) | low;
    return value;
  }
  // ("0x0") => "0x0"
  auto hexString(const Napi::Value& jsVal) -> NodeId {
    const std::string&& arg1 = jsVal.As<Napi::String>().Utf8Value();
    const NodeId value = std::stoull(arg1.data(), nullptr, 16);
    return value;
  }
  // ("AF==") => "AF=="
  auto base64String(const Napi::Value& jsVal) -> NodeId {
    //return value;
  }
  // ("\u0000\u0001\x00") => "\u0000\u0001\x00"
  auto byteString(const Napi::Value& jsVal) -> NodeId {
    const std::string&& arg1 = jsVal.As<Napi::String>().Utf8Value();
    const NodeId value = *reinterpret_cast<const NodeId*>(arg1.data());
    return value;
  }
  // (low, high) => low; high = native.getLastHighBits()
  auto twoNumberWithHighBitGetter(const Napi::CallbackInfo& info) -> NodeId {
    const uint32_t low = info[0].As<Napi::Number>().Uint32Value();
    const uint32_t high = info[1].As<Napi::Number>().Uint32Value();
    const NodeId value = (static_cast<uint64_t>(high) << 32) | low;
    lastHighBits = high;
    return value;
  }
  // (new Uint32Array([0, 0])) => new Uint8Array([0, 0])
  auto uint32Array(const Napi::CallbackInfo& info) -> NodeId {
    const uint32_t* arg1 = info[0].As<Napi::TypedArrayOf<uint32_t>>().Data();
    const NodeId value = *reinterpret_cast<const NodeId*>(arg1);
    return value;
  }
  // (number) => number
  auto reinterpretDouble(const Napi::CallbackInfo& info) -> NodeId {
    const double arg1 = info[0].As<Napi::Number>().DoubleValue();
    const NodeId value = *reinterpret_cast<const NodeId*>(&arg1);
    return value;
  }
  // (bigint) => bigint
  auto bigInt(const Napi::CallbackInfo& info) -> NodeId {
    const double arg1 = info[0].As<Napi::Number>().DoubleValue();
    const NodeId value = *reinterpret_cast<const NodeId*>(&arg1);
    return value;
  }
};

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports["controlBuildInJs"] = Napi::Function::New(env, [](const Napi::CallbackInfo& info) -> Napi::Value {
    //JsGraph graph;
    //djikstras(Graph);
    return info.Env().Undefined();
  });
  exports["controlBuildInNative"] = Napi::Function::New(env, [](const Napi::CallbackInfo& info) -> Napi::Value {
    auto graph = buildGraph();
    djikstras(graph, 0, 100);
    return info.Env().Undefined();
  });
  exports["getLastHighBits"] = Napi::Function::New(env, [](const Napi::CallbackInfo& info) -> Napi::Value {
    return Napi::Number::New(info.Env(), lastHighBits);
    return info.Env().Undefined();
  });
  exports["getNeighbors"] = Napi::Function::New(env, [](const Napi::CallbackInfo& info) -> Napi::Value {
    return Napi::Number::New(info.Env(), lastHighBits);
    return info.Env().Undefined();
  });
  return exports;
}

NODE_API_MODULE(addon, Init)
