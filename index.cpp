#include <limits>
#include <sstream>
#include <cstdio>
#include <cstdlib>
#include <ctime>
#include <napi.h>
#include <stdexcept>
#include <vector>
#include <set>
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
  std::vector<NodeId> nodeList;
  nodeList.reserve(size);
  Graph graph{};
  graph.reserve(size);

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
    const auto id = randomUint64();
    graph[id] = Node{};
    nodeList.push_back(id);
  }

  // create edges, for now just 1 to 5 random ones
  for (auto& [nodeId, node] : graph) {
    constexpr auto minEdgesPerNode = 1;
    constexpr auto maxEdgesPerNode = 5;
    constexpr auto edgesRangePerNode = maxEdgesPerNode - minEdgesPerNode;
    const auto edgeCount = std::rand() % edgesRangePerNode + minEdgesPerNode;
    node.reserve(edgeCount);
    for (auto i = 0; i < edgeCount; ++i) {
      // - 1 to skip over self, no self-directed edges
      const auto targetIndex = std::rand() % (size - 1);
      const auto targetId
        = nodeId == nodeList[targetIndex]
        ? nodeList[size - 1]
        : nodeList[targetIndex]
      ;
      node.emplace_back(targetId);
    }
  }

  return graph;
}

using Distance = uint32_t;

template<typename... T>
struct priority_queue : std::priority_queue<T...> {
  using std::priority_queue<T...>::priority_queue;
  typename std::priority_queue<T...>::container_type& container() { return this->c; }
};

// raw native implementation, used as a control
Distance djikstras(const Graph& graph, NodeId start, NodeId end) {
  std::unordered_map<NodeId, std::optional<NodeId>> predecessors;
  predecessors.reserve(graph.size());
  std::unordered_map<NodeId, Distance> distances;
  distances.reserve(graph.size());

  const auto nodeDistanceCmp = [&](const NodeId& l, const NodeId& r) {
    return distances[l] < distances[r];
  };

  auto queue = priority_queue<
    NodeId,
    std::vector<NodeId>,
    decltype(nodeDistanceCmp)
  >(nodeDistanceCmp);

  std::set<NodeId> inQueue;

  queue.container().reserve(graph.size());

  constexpr auto DJIKSTRA_INT_INFINITY = std::numeric_limits<Distance>::max();
  for (const auto& [nodeId, node] : graph) {
    distances[nodeId] = DJIKSTRA_INT_INFINITY;
    queue.push(nodeId);
  }
  distances[start] = 0;

  while (!queue.empty()) {
    const auto u = queue.top();
    queue.pop();
    inQueue.erase(u);
    const auto neighbors = graph.at(u);
    for (const auto& neighbor : neighbors) {
      const auto stillInQueue = inQueue.find(neighbor) != inQueue.end();
      if (!stillInQueue) continue;
      constexpr auto edgeSize = 1;
      const auto alt = distances[u] + edgeSize;
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        predecessors[neighbor] = u;
      }
    }
  }

  return 0;
}

uint32_t lastHighBits = 0U;

namespace Int64Converters {
  enum struct Kind {
    LowHighObject = 0,
    LowHighArray = 1,
    HexString = 2,
    Base64String = 3,
    ByteString = 4,
    TwoNumbers = 5,
    Uint32Array = 6,
    DoubleAsBuffer = 7,
    BigInt = 8,
  };

  namespace From {
    // ({low, high}) => ({low, high})
    auto LowHighObject(const Napi::Value& jsVal, const Napi::Value&) -> NodeId {
      const uint32_t low = jsVal.As<Napi::Object>().Get("low").As<Napi::Number>().Uint32Value();
      const uint32_t high = jsVal.As<Napi::Object>().Get("high").As<Napi::Number>().Uint32Value();
      const NodeId value = (static_cast<uint64_t>(high) << 32) | low;
      return value;
    }
    // ([low, high]) => [low, high]
    auto LowHighArray(const Napi::Value& jsVal, const Napi::Value&) -> NodeId {
      const auto&& array = jsVal.As<Napi::Array>();
      const uint32_t low = array[0U].As<Napi::Number>().Uint32Value();
      const uint32_t high = array[1U].As<Napi::Number>().Uint32Value();
      const NodeId value = (static_cast<uint64_t>(high) << 32) | low;
      return value;
    }
    // ("0x0") => "0x0"
    auto HexString(const Napi::Value& jsVal, const Napi::Value&) -> NodeId {
      const std::string&& arg1 = jsVal.As<Napi::String>().Utf8Value();
      const NodeId value = std::stoull(arg1.data(), nullptr, 16);
      return value;
    }
    // ("AF==") => "AF=="
    auto Base64String(const Napi::Value& jsVal, const Napi::Value&) -> NodeId {
      throw std::runtime_error("unimplemented");
    }
    // ("\u0000\u0001\x00") => "\u0000\u0001\x00"
    auto ByteString(const Napi::Value& jsVal, const Napi::Value&) -> NodeId {
      const std::string&& arg1 = jsVal.As<Napi::String>().Utf8Value();
      const NodeId value = *reinterpret_cast<const NodeId*>(arg1.data());
      return value;
    }
    // (low, high) => low; high = native.getLastHighBits()
    auto TwoNumbers(const Napi::Value& inLow, const Napi::Value& inHigh) -> NodeId {
      const uint32_t low = inLow.As<Napi::Number>().Uint32Value();
      const uint32_t high = inHigh.As<Napi::Number>().Uint32Value();
      const NodeId value = (static_cast<uint64_t>(high) << 32) | low;
      lastHighBits = high;
      return value;
    }
    // (new Uint32Array([0, 0])) => new Uint8Array([0, 0])
    auto Uint32Array(const Napi::Value& jsVal, const Napi::Value&) -> NodeId {
      const uint32_t* arg1 = jsVal.As<Napi::TypedArrayOf<uint32_t>>().Data();
      const NodeId value = *reinterpret_cast<const NodeId*>(arg1);
      return value;
    }
    // (number) => number
    auto DoubleAsBuffer(const Napi::Value& jsVal, const Napi::Value&) -> NodeId {
      const double arg1 = jsVal.As<Napi::Number>().DoubleValue();
      const NodeId value = *reinterpret_cast<const NodeId*>(&arg1);
      return value;
    }
    // (bigint) => bigint
    auto BigInt(const Napi::Value& jsVal, const Napi::Value&) -> NodeId {
      const uint64_t value = jsVal.As<Napi::BigInt>().Uint64Value(nullptr);
      return value;
    }
  };

  namespace To {
    // ({low, high}) => ({low, high})
    auto LowHighObject(Napi::Env env, uint64_t val) -> Napi::Value {
      Napi::Object jsVal;
      jsVal["low"] = Napi::Number::New(env, val & 0xffffffffff);
      jsVal["high"] = Napi::Number::New(env, val >> 32);
      return jsVal;
    }
    // ([low, high]) => [low, high]
    auto LowHighArray(Napi::Env env, uint64_t val) -> Napi::Value {
      Napi::Array jsVal;
      jsVal[0U] = Napi::Number::New(env, val & 0xffffffffff);
      jsVal[1U] = Napi::Number::New(env, val >> 32);
      return jsVal;
    }
    // ("0x0") => "0x0"
    auto HexString(Napi::Env env, uint64_t val) -> Napi::Value {
      std::stringstream buffer;
      buffer << "0x" << std::ios::hex << val;
      //std::sprintf("0x%llu")
      const auto jsVal = Napi::String::New(env, buffer.str());
      return jsVal;
    }
    // ("AF==") => "AF=="
    auto Base64String(Napi::Env env, uint64_t val) -> Napi::Value {
      throw std::runtime_error("unimplemented");
    }
    // ("\u0000\u0001\x00") => "\u0000\u0001\x00"
    auto ByteString(Napi::Env env, uint64_t val) -> Napi::Value {
      const auto jsVal = Napi::String::New(env, reinterpret_cast<char*>(val), 8);
      return jsVal;
    }
    // (low, high) => low; high = native.getLastHighBits()
    auto TwoNumbers(Napi::Env env, uint64_t val) -> Napi::Value {
      const uint32_t low = val & 0xffffffff;
      const uint32_t high = val >> 32;
      const auto jsVal = Napi::Number::New(env, low);
      lastHighBits = high;
      return jsVal;
    }
    // (new Uint32Array([0, 0])) => new Uint8Array([0, 0])
    auto Uint32Array(Napi::Env env, uint64_t val) -> Napi::Value {
      const uint32_t low = val & 0xffffffff;
      const uint32_t high = val >> 32;
      auto jsVal = Napi::TypedArrayOf<uint32_t>::New(env, sizeof(val) / sizeof(uint32_t));
      jsVal[0] = low;
      jsVal[1] = high;
      return jsVal;
    }
    // (number) => number
    auto DoubleAsBuffer(Napi::Env env, uint64_t val) -> Napi::Value {
      const auto jsVal = Napi::Number::New(env, reinterpret_cast<double&>(val));
      return jsVal;
    }
    // (bigint) => bigint
    auto BigInt(Napi::Env env, uint64_t val) -> Napi::Value {
      const auto jsVal = Napi::BigInt::New(env, val);
      return jsVal;
    }
  };
};

Graph moduleGraph;

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports["controlBuildInJs"] = Napi::Function::New(env, [](const Napi::CallbackInfo& info) -> Napi::Value {
    //JsGraph graph;
    //djikstras(Graph);
    return info.Env().Undefined();
  });
  exports["controlBuildInNative"] = Napi::Function::New(env, [](const Napi::CallbackInfo& info) -> Napi::Value {
    moduleGraph = buildGraph(10000);
    djikstras(moduleGraph , 0, 100);
    return info.Env().Undefined();
  });
  exports["getLastHighBits"] = Napi::Function::New(env, [](const Napi::CallbackInfo& info) -> Napi::Value {
    return Napi::Number::New(info.Env(), lastHighBits);
  });
  exports["doubleAsBufferWhenNanEqFallback"] = Napi::Function::New(env, [](const Napi::CallbackInfo& info) -> Napi::Value {
    const auto l = info[0].As<Napi::Number>().DoubleValue();
    const auto r = info[1].As<Napi::Number>().DoubleValue();
    return Napi::Boolean::New(info.Env(), l == r);
  });
  exports["getNeighbors"] = Napi::Function::New(env, [](const Napi::CallbackInfo& info) -> Napi::Value {
    const auto kind = static_cast<Int64Converters::Kind>(info[0].As<Napi::Number>().Uint32Value());
    auto result = Napi::Array::New(info.Env());
    auto i = 0U;

    static decltype(Int64Converters::From::LowHighObject)* getters[] = {
      Int64Converters::From::LowHighObject,
      Int64Converters::From::LowHighArray,
      Int64Converters::From::LowHighArray,
      Int64Converters::From::HexString,
      Int64Converters::From::Base64String,
      Int64Converters::From::ByteString,
      Int64Converters::From::TwoNumbers,
      Int64Converters::From::Uint32Array,
      Int64Converters::From::DoubleAsBuffer,
    };
    const auto& getter = getters[static_cast<size_t>(kind)];

    static decltype(Int64Converters::To::LowHighObject)* setters[] = {
      Int64Converters::To::LowHighObject,
      Int64Converters::To::LowHighArray,
      Int64Converters::To::LowHighArray,
      Int64Converters::To::HexString,
      Int64Converters::To::Base64String,
      Int64Converters::To::ByteString,
      Int64Converters::To::TwoNumbers,
      Int64Converters::To::Uint32Array,
      Int64Converters::To::DoubleAsBuffer,
    };
    const auto& setter = setters[static_cast<size_t>(kind)];
    
    const auto nodeId = getter(
      info[0],
      info.Length() == 3 ? info[1] : info.Env().Undefined()
    );
    const auto node = moduleGraph[nodeId];

    auto highBits = Napi::Array::New(info.Env());
    if (kind == Int64Converters::Kind::TwoNumbers) {
      result.Set("highBits", highBits);
    }

    for (const auto& neighborId : node) {
      result[i] = setter(info.Env(), neighborId);
      if (kind == Int64Converters::Kind::TwoNumbers) highBits[i] = neighborId >> 32;
      ++i;
    }

    return result;
  });

  return exports;
}

NODE_API_MODULE(addon, Init)
