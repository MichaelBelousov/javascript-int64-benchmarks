#include "js_native_api.h"
#include <limits>
#include <sstream>
#include <cstdio>
#include <cstdlib>
#include <ctime>
#include <node_api.h>
#include <napi.h>
#include <stdexcept>
#include <array>
#include <tuple>
#include <vector>
#include <unordered_set>
#include <unordered_map>
#include <cstdint>
#include <queue>
#include <limits>
#include <optional>
#include <cmath>
#include <ctime>

#include <variant>


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
    const int32_t highBits = std::rand();
    const int32_t lowBits = std::rand();
    const uint32_t high = reinterpret_cast<const uint32_t&>(highBits);
    const uint32_t low = reinterpret_cast<const uint32_t&>(lowBits);
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
    External = 9,
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
      char buffer[sizeof(NodeId) + 1]; // need an extra byte because napi_get_value_string_latin1 will null terminate the buffer
      size_t resultSize;
      napi_get_value_string_latin1(jsVal.Env(), jsVal, &buffer[0], sizeof(buffer), &resultSize);
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
      // FIXME: this should never be triggered, we should never generate such bigints
      bool lossless;
      const uint64_t value = jsVal.As<Napi::BigInt>().Uint64Value(&lossless);
      return value;
    }
    // (External) => External
    auto External(const Napi::Value& jsVal, const Napi::Value&) -> NodeId {
      const void* pointerValue = jsVal.As<Napi::External<void>>().Data();
      const uint64_t value = reinterpret_cast<uint64_t&>(pointerValue);
      return value;
    }

    static auto map = std::array{
      LowHighObject,
      LowHighArray,
      HexString,
      Base64String,
      ByteString,
      TwoNumbers,
      Uint32Array,
      DoubleAsBuffer,
      BigInt,
      External,
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
    // (External) => External
    auto External(Napi::Env env, uint64_t val) -> Napi::Value {
      const auto jsVal = Napi::External<void>::New(env, reinterpret_cast<void*>(val));
      return jsVal;
    }

    // must be same order as enum
    static auto map = std::array{
      LowHighObject,
      LowHighArray,
      HexString,
      Base64String,
      ByteString,
      TwoNumbers,
      Uint32Array,
      DoubleAsBuffer,
      BigInt,
      External,
    };
  };
};

using FromId64Func = uint64_t(const Napi::Value&, const Napi::Value&);
using ToId64Func = Napi::Value(Napi::Env, uint64_t);

template<FromId64Func from, ToId64Func to>
struct Id64Map : Napi::ObjectWrap<Id64Map<from, to>> {
  // NOTE: is there a better way to store both Napi::Reference and Napi::Value?
  std::unordered_map<NodeId, std::variant<double, Napi::Reference<Napi::Value>>> _map;
  static Napi::FunctionReference Constructor;
  static Napi::Value Init(Napi::Env env) {
    Napi::Function wrappedCtor = Napi::ObjectWrap<Id64Map<from, to>>::DefineClass(env, "Id64Map", {
      Napi::ObjectWrap<Id64Map<from, to>>::template InstanceMethod<&Id64Map<from, to>::Get>("get"),
      Napi::ObjectWrap<Id64Map<from, to>>::template InstanceMethod<&Id64Map<from, to>::Set>("set")
    });
    Constructor = Napi::Persistent(wrappedCtor);
    Constructor.SuppressDestruct();
    return wrappedCtor;
  }
  Id64Map(const Napi::CallbackInfo& info) : Napi::ObjectWrap<Id64Map<from, to>>{info}, _map{} {}
  ~Id64Map() {
    for (auto& [id, maybeJsRef] : _map) {
      if (std::holds_alternative<Napi::Reference<Napi::Value>>(maybeJsRef))
        std::get<Napi::Reference<Napi::Value>>(maybeJsRef).Unref();
    }
  }
  Napi::Value Get(const Napi::CallbackInfo& info) {
    const auto&& key = from(info[0], info[1]);
    auto&& entry = _map.find(key);
    if (entry == _map.end()) return info.Env().Undefined();
    auto&& maybeJsVal = entry->second;
    auto jsVal = std::holds_alternative<Napi::Reference<Napi::Value>>(maybeJsVal)
        ? std::get<Napi::Reference<Napi::Value>>(maybeJsVal).Value()
        : Napi::Number::New(info.Env(), std::get<double>(maybeJsVal));
    return jsVal;
  }
  Napi::Value Set(const Napi::CallbackInfo& info) {
    const auto&& key = from(info[0], info[1]);
    if (info[2].IsNumber()) {
      _map[key] = info[2].As<Napi::Number>().DoubleValue();
    } else {
      // XXX: this will wrap primitives like strings in an object, which can be funky
      // it does however work for the types of values used in this project
      _map[key] = Napi::Reference<Napi::Value>::New(info[2].ToObject(), 1);
    }
    return info.Env().Undefined();
  }
};

template<FromId64Func *from, ToId64Func *to>
Napi::FunctionReference Id64Map<from, to>::Constructor;

template<FromId64Func *from, ToId64Func *to>
struct Id64Set : Napi::ObjectWrap<Id64Set<from, to>> {
  std::unordered_set<NodeId> _set;
  static Napi::FunctionReference Constructor;
  static Napi::Value Init(Napi::Env env) {
    Napi::Function wrappedCtor = Napi::ObjectWrap<Id64Set<from, to>>::DefineClass(env, "Id64Set", {
        Napi::ObjectWrap<Id64Set<from, to>>::template InstanceMethod<&Id64Set<from, to>::Has>("has"),
        Napi::ObjectWrap<Id64Set<from, to>>::template InstanceMethod<&Id64Set<from, to>::Add>("add"),
    });
    Constructor = Napi::Persistent(wrappedCtor);
    Constructor.SuppressDestruct();
    return wrappedCtor;
  }
  Id64Set(const Napi::CallbackInfo& info) : Napi::ObjectWrap<Id64Set>{info}, _set{} {}
  Napi::Value Has(const Napi::CallbackInfo& info) {
    const auto&& key = from(info[0], info[1]);
    return Napi::Boolean::New(info.Env(), _set.find(key) != _set.end());
  }
  Napi::Value Add(const Napi::CallbackInfo& info) {
    const auto&& key = from(info[0], info[1]);
    _set.insert(key);
    return info.Env().Undefined();
  }
};

template<FromId64Func *from, ToId64Func *to>
Napi::FunctionReference Id64Set<from, to>::Constructor;

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

  exports["Id64LowHighObjectMap"] = Id64Map<Int64Converters::From::LowHighObject, Int64Converters::To::LowHighObject>::Init(env);
  exports["Id64LowHighObjectSet"] = Id64Set<Int64Converters::From::LowHighObject, Int64Converters::To::LowHighObject>::Init(env);
  exports["Id64LowHighArrayMap"] = Id64Map<Int64Converters::From::LowHighArray, Int64Converters::To::LowHighArray>::Init(env);
  exports["Id64LowHighArraySet"] = Id64Set<Int64Converters::From::LowHighArray, Int64Converters::To::LowHighArray>::Init(env);
  exports["Id64HexStringMap"] = Id64Map<Int64Converters::From::HexString, Int64Converters::To::HexString>::Init(env);
  exports["Id64HexStringSet"] = Id64Set<Int64Converters::From::HexString, Int64Converters::To::HexString>::Init(env);
  exports["Id64Base64StringMap"] = Id64Map<Int64Converters::From::Base64String, Int64Converters::To::Base64String>::Init(env);
  exports["Id64Base64StringSet"] = Id64Set<Int64Converters::From::Base64String, Int64Converters::To::Base64String>::Init(env);
  exports["Id64ByteStringMap"] = Id64Map<Int64Converters::From::ByteString, Int64Converters::To::ByteString>::Init(env);
  exports["Id64ByteStringSet"] = Id64Set<Int64Converters::From::ByteString, Int64Converters::To::ByteString>::Init(env);
  exports["Id64TwoNumbersMap"] = Id64Map<Int64Converters::From::TwoNumbers, Int64Converters::To::TwoNumbers>::Init(env);
  exports["Id64TwoNumbersSet"] = Id64Set<Int64Converters::From::TwoNumbers, Int64Converters::To::TwoNumbers>::Init(env);
  exports["Id64Uint32ArrayMap"] = Id64Map<Int64Converters::From::Uint32Array, Int64Converters::To::Uint32Array>::Init(env);
  exports["Id64Uint32ArraySet"] = Id64Set<Int64Converters::From::Uint32Array, Int64Converters::To::Uint32Array>::Init(env);
  exports["Id64DoubleAsBufferMap"] = Id64Map<Int64Converters::From::DoubleAsBuffer, Int64Converters::To::DoubleAsBuffer>::Init(env);
  exports["Id64DoubleAsBufferSet"] = Id64Set<Int64Converters::From::DoubleAsBuffer, Int64Converters::To::DoubleAsBuffer>::Init(env);
  exports["Id64BigIntMap"] = Id64Map<Int64Converters::From::BigInt, Int64Converters::To::BigInt>::Init(env);
  exports["Id64BigIntSet"] = Id64Set<Int64Converters::From::BigInt, Int64Converters::To::BigInt>::Init(env);
  exports["Id64ExternalMap"] = Id64Map<Int64Converters::From::External, Int64Converters::To::External>::Init(env);
  exports["Id64ExternalSet"] = Id64Set<Int64Converters::From::External, Int64Converters::To::External>::Init(env);

  return exports;
}

NODE_API_MODULE(addon, Init)
