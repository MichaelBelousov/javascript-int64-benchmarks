#include "js_native_api.h"
#include <limits>
#include <sstream>
#include <cstdio>
#include <cstdlib>
#include <ctime>
#include <node_api.h>
#include <napi.h>
#include <stdexcept>
#include <vector>
#include <unordered_set>
#include <unordered_map>
#include <cstdint>
#include <queue>
#include <limits>
#include <optional>
#include <cmath>
#include <ctime>


constexpr size_t GRAPH_SIZE = 2000;
constexpr size_t EDGES_PER_NODE = 8;

using NodeId = uint64_t;
using Node = std::vector<NodeId>;
using Graph = std::unordered_map<NodeId, Node>;

//struct JsGraph : Napi::ObjectWrap<Graph> {};

struct BuildGraphResult {
  Graph graph;
  NodeId first;
  NodeId last;
};

BuildGraphResult buildGraph(size_t size) {
  std::vector<NodeId> nodeList;
  nodeList.reserve(size);
  BuildGraphResult result;
  result.graph.reserve(size);

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
    result.graph[id] = Node{};
    if (i == 0) result.first = id;
    if (i == size - 1) result.last = id;
    nodeList.push_back(id);
  }

  // create edges, for now just 1 to 5 random ones
  for (auto& [nodeId, node] : result.graph) {
    node.reserve(EDGES_PER_NODE);
    for (auto i = 0U; i < EDGES_PER_NODE; ++i) {
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

  return result;
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

  std::unordered_set<NodeId> inQueue;

  queue.container().reserve(graph.size());

  constexpr auto DJIKSTRA_INT_INFINITY = std::numeric_limits<Distance>::max();
  for (const auto& [nodeId, node] : graph) {
    distances[nodeId] = DJIKSTRA_INT_INFINITY;
    queue.push(nodeId);
    inQueue.insert(nodeId);
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
      constexpr auto edgeLength = 1;
      const auto alt = distances[u] + edgeLength;
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        predecessors[neighbor] = u;
      }
    }
  }

  // can actually terminate early but we build the whole tree
  return distances[end];
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
      char buffer[sizeof(NodeId)];
      napi_get_value_string_latin1(jsVal.Env(), jsVal, buffer, sizeof(buffer), nullptr);
      const NodeId value = *reinterpret_cast<const NodeId*>(&buffer);
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

    static decltype(LowHighObject)* map[] = {
      LowHighObject,
      LowHighArray,
      HexString,
      Base64String,
      ByteString,
      TwoNumbers,
      Uint32Array,
      DoubleAsBuffer,
      BigInt,
    };
  };

  namespace To {
    // ({low, high}) => ({low, high})
    auto LowHighObject(Napi::Env env, uint64_t val) -> Napi::Value {
      auto jsVal = Napi::Object::New(env);
      jsVal["low"] = Napi::Number::New(env, val & 0xffffffffff);
      jsVal["high"] = Napi::Number::New(env, val >> 32);
      return jsVal;
    }
    // ([low, high]) => [low, high]
    auto LowHighArray(Napi::Env env, uint64_t val) -> Napi::Value {
      auto jsVal = Napi::Array::New(env);
      jsVal[0U] = Napi::Number::New(env, val & 0xffffffffff);
      jsVal[1U] = Napi::Number::New(env, val >> 32);
      return jsVal;
    }
    // ("0x0") => "0x0"
    auto HexString(Napi::Env env, uint64_t val) -> Napi::Value {
      std::stringstream buffer;
      std::hex(buffer); // maybe sprintf is faster?
      buffer << "0x" << val;
      const auto jsVal = Napi::String::New(env, buffer.str());
      return jsVal;
    }
    // ("AF==") => "AF=="
    auto Base64String(Napi::Env env, uint64_t val) -> Napi::Value {
      throw std::runtime_error("unimplemented");
    }
    // ("\u0000\u0001\x00") => "\u0000\u0001\x00"
    auto ByteString(Napi::Env env, uint64_t val) -> Napi::Value {
      // there is no node-addon-api wrapper for this so we have to use the napi c_api
      napi_value jsVal;
      napi_status status = napi_create_string_latin1(env, reinterpret_cast<char*>(&val), sizeof(val), &jsVal);
      NAPI_THROW_IF_FAILED(env, status, String());
      return Napi::String(env, jsVal);
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

    // must be same order as enum
    static decltype(LowHighObject)* map[] = {
      LowHighObject,
      LowHighArray,
      HexString,
      Base64String,
      ByteString,
      TwoNumbers,
      Uint32Array,
      DoubleAsBuffer,
      BigInt,
    };
  };
};

struct DoubleAsBufferMap : Napi::ObjectWrap<DoubleAsBufferMap> {
  std::unordered_map<NodeId, Napi::Reference<Napi::Value>> _map;
  static Napi::FunctionReference Constructor;
  static void Init(Napi::Env env, Napi::Object exports) {
    Napi::Function wrappedCtor = DefineClass(env, "DoubleAsBufferMap", {
        InstanceMethod<&DoubleAsBufferMap::Get>("get"),
        InstanceMethod<&DoubleAsBufferMap::Set>("set"),
    });
    Constructor = Napi::Persistent(wrappedCtor);
    Constructor.SuppressDestruct();
    exports["DoubleAsBufferMap"] = wrappedCtor;
  }
  DoubleAsBufferMap(const Napi::CallbackInfo& info) : Napi::ObjectWrap<DoubleAsBufferMap>{info}, _map{} {}
  ~DoubleAsBufferMap() {
    for (auto& [id, jsRef] : _map) { jsRef.Unref(); }
  }
  Napi::Value Get(const Napi::CallbackInfo& info) {
    const auto&& key = Int64Converters::From::DoubleAsBuffer(info[0].As<Napi::Number>(), info.Env().Undefined());
    auto&& entry = _map.find(key);
    if (entry == _map.end()) return info.Env().Undefined();
    return entry->second.Value();
  }
  Napi::Value Set(const Napi::CallbackInfo& info) {
    const auto&& key = Int64Converters::From::DoubleAsBuffer(info[0].As<Napi::Number>(), info.Env().Undefined());
    // TODO: this ToObject is inperfect since now the value is voxed and `typeof` won't work
    auto val = Napi::Reference<Napi::Value>::New(info[2].ToObject(), 1);
    _map[key] = std::move(val); // FIXME: wut
    return info.Env().Undefined();
  }
};

Napi::FunctionReference DoubleAsBufferMap::Constructor;

struct DoubleAsBufferSet : Napi::ObjectWrap<DoubleAsBufferSet> {
  std::unordered_set<NodeId> _set;
  static Napi::FunctionReference Constructor;
  static void Init(Napi::Env env, Napi::Object exports) {
    Napi::Function wrappedCtor = DefineClass(env, "DoubleAsBufferSet", {
        InstanceMethod<&DoubleAsBufferSet::Has>("has"),
        InstanceMethod<&DoubleAsBufferSet::Add>("add"),
    });
    Constructor = Napi::Persistent(wrappedCtor);
    Constructor.SuppressDestruct();
    exports["DoubleAsBufferSet"] = wrappedCtor;
  }
  DoubleAsBufferSet(const Napi::CallbackInfo& info) : Napi::ObjectWrap<DoubleAsBufferSet>{info}, _set{} {}
  Napi::Value Has(const Napi::CallbackInfo& info) {
    const auto&& key = Int64Converters::From::DoubleAsBuffer(info[0].As<Napi::Number>(), info.Env().Undefined());
    return Napi::Boolean::New(info.Env(), _set.find(key) != _set.end());
  }
  Napi::Value Add(const Napi::CallbackInfo& info) {
    const auto&& key = Int64Converters::From::DoubleAsBuffer(info[0].As<Napi::Number>(), info.Env().Undefined());
    _set.insert(key);
    return info.Env().Undefined();
  }
};

Napi::FunctionReference DoubleAsBufferSet::Constructor;

Graph moduleGraph;
NodeId moduleStart;
NodeId moduleEnd;

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  auto&& moduleGraphResult = buildGraph(GRAPH_SIZE);
  moduleGraph = std::move(moduleGraphResult.graph);
  moduleStart = moduleGraphResult.first;
  moduleEnd = moduleGraphResult.last;

  exports["nativeDjikstras"] = Napi::Function::New(env, [](const Napi::CallbackInfo& info) -> Napi::Value {
    djikstras(moduleGraph, moduleStart, moduleEnd);
    return info.Env().Undefined();
  });

  exports["getLastHighBits"] = Napi::Function::New(env, [](const Napi::CallbackInfo& info) -> Napi::Value {
    return Napi::Number::New(info.Env(), lastHighBits);
  });

  exports["doubleAsBufferWhenNanEqFallback"] = Napi::Function::New(env, [](const Napi::CallbackInfo& info) -> Napi::Value {
    const auto l = info[0].As<Napi::Number>().DoubleValue();
    const auto r = info[1].As<Napi::Number>().DoubleValue();
    const auto lId = reinterpret_cast<const uint64_t&>(l);
    const auto rId = reinterpret_cast<const uint64_t&>(r);
    return Napi::Boolean::New(info.Env(), lId == rId);
  });

  exports["getNeighbors"] = Napi::Function::New(env, [](const Napi::CallbackInfo& info) -> Napi::Value {
    const auto kind = static_cast<Int64Converters::Kind>(info[0].As<Napi::Number>().Uint32Value());
    auto result = Napi::Array::New(info.Env());
    auto i = 0U;

    const auto& getter = Int64Converters::From::map[static_cast<size_t>(kind)];
    const auto& setter = Int64Converters::To::map[static_cast<size_t>(kind)];

    const auto nodeId = getter(info[1], info[2]);
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

  exports["getNodes"] = Napi::Function::New(env, [](const Napi::CallbackInfo& info) -> Napi::Value {
    const auto kind = static_cast<Int64Converters::Kind>(info[0].As<Napi::Number>().Uint32Value());
    auto result = Napi::Array::New(info.Env());
    auto i = 0U;

    const auto& setter = Int64Converters::To::map[static_cast<size_t>(kind)];

    auto highBits = Napi::Array::New(info.Env());
    if (kind == Int64Converters::Kind::TwoNumbers) {
      result.Set("highBits", highBits);
    }

    for (const auto& [nodeId, _node] : moduleGraph) {
      result[i] = setter(info.Env(), nodeId);
      if (kind == Int64Converters::Kind::TwoNumbers) highBits[i] = nodeId >> 32;
      ++i;
    }

    return result;
  });

  DoubleAsBufferMap::Init(env, exports);
  DoubleAsBufferSet::Init(env, exports);

  return exports;
}

NODE_API_MODULE(addon, Init)
