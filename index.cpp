#include <napi.h>
#include <vector>
#include <unordered_map>
#include <cstdint>
#include <queue>

using NodeId = uint64_t;
using Node = std::vector<NodeId>;
using Graph = std::unordered_map<NodeId, Node>;

struct JsGraph : Napi::ObjectWrap<Graph> {};

Graph buildGraph() {
  Graph result;
  return result;
}

// raw native implementation, used as a control
int djikstras(const Graph& graph, NodeId start, NodeId end) {
  auto queue = std::queue<NodeId>{};
  return 0;
}

uint32_t lastHighBits = 0U;

namespace Int64Converters {
  // ({low, high}) => ({low, high})
  auto lowHighObject(const Napi::CallbackInfo& info) -> NodeId {
    const uint32_t low = info[0].As<Napi::Object>().Get("low").As<Napi::Number>().Uint32Value();
    const uint32_t high = info[0].As<Napi::Object>().Get("high").As<Napi::Number>().Uint32Value();
    const NodeId value = (static_cast<uint64_t>(high) << 32) | low;
    return value;
  }
  // ([low, high]) => [low, high]
  auto lowHighArray(const Napi::CallbackInfo& info) -> NodeId {
    const auto&& array = info[0].As<Napi::Array>();
    const uint32_t low = array[0U].As<Napi::Number>().Uint32Value();
    const uint32_t high = array[1U].As<Napi::Number>().Uint32Value();
    const NodeId value = (static_cast<uint64_t>(high) << 32) | low;
    return value;
  }
  // ("0x0") => "0x0"
  auto hexString(const Napi::CallbackInfo& info) -> NodeId {
    const std::string&& arg1 = info[0].As<Napi::String>().Utf8Value();
    const NodeId value = std::stoull(arg1.data(), nullptr, 16);
    return info.Env().Undefined();
  }
  // ("AF==") => "AF=="
  auto base64String(const Napi::CallbackInfo& info) -> NodeId {
    return info.Env().Undefined();
  }
  // ("\u0000\u0001\x00") => "\u0000\u0001\x00"
  auto byteString(const Napi::CallbackInfo& info) -> NodeId {
    const std::string&& arg1 = info[0].As<Napi::String>().Utf8Value();
    const NodeId value = *reinterpret_cast<const NodeId*>(arg1.data());
    return info.Env().Undefined();
  }
  // (low, high) => low; high = native.getLastHighBits()
  auto doubleArgWithHighBitGetter(const Napi::CallbackInfo& info) -> NodeId {
    const uint32_t low = info[0].As<Napi::Number>().Uint32Value();
    const uint32_t high = info[1].As<Napi::Number>().Uint32Value();
    const NodeId value = (static_cast<uint64_t>(high) << 32) | low;
    lastHighBits = high;
    return info.Env().Undefined();
  }
  // (new Uint32Array([0, 0])) => new Uint8Array([0, 0])
  cases["Uint32Array"] = Napi::Function::New(env, [](const Napi::CallbackInfo& info) -> Napi::Value {
    const uint32_t* arg1 = info[0].As<Napi::TypedArrayOf<uint32_t>>().Data();
    const NodeId value = *reinterpret_cast<const NodeId*>(arg1);
    return info.Env().Undefined();
  });
  // (number) => number
  cases["double-bytes"] = Napi::Function::New(env, [](const Napi::CallbackInfo& info) -> Napi::Value {
    const double arg1 = info[0].As<Napi::Number>().DoubleValue();
    const NodeId value = *reinterpret_cast<const NodeId*>(&arg1);
    return info.Env().Undefined();
  });
  exports["controlBuildInJs"] = Napi::Function::New(env, [](const Napi::CallbackInfo& info) -> Napi::Value {
    //JsGraph graph;
    //djikstras(Graph);
    return info.Env().Undefined();
  });
};

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  Napi::Object cases;
  exports["cases"] = cases;
  // ({low, high}) => ({low, high})
  cases["u32-object"] = Napi::Function::New(env, [](const Napi::CallbackInfo& info) -> Napi::Value {
    return info.Env().Undefined();
  });
  // ([low, high]) => [low, high]
  cases["u32-array"] = Napi::Function::New(env, [](const Napi::CallbackInfo& info) -> Napi::Value {
    return info.Env().Undefined();
  });
  // ("0x0") => "0x0"
  cases["hex-string"] = Napi::Function::New(env, [](const Napi::CallbackInfo& info) -> Napi::Value {
    const std::string&& arg1 = info[0].As<Napi::String>().Utf8Value();
    const NodeId value = std::stoull(arg1.data(), nullptr, 16);
    return info.Env().Undefined();
  });
  // ("a") => "a"
  cases["base64-string"] = Napi::Function::New(env, [](const Napi::CallbackInfo& info) -> Napi::Value {
    return info.Env().Undefined();
  });
  // ("\u0000\u0001\x00") => "\u0000\u0001\x00"
  cases["byte-string"] = Napi::Function::New(env, [](const Napi::CallbackInfo& info) -> Napi::Value {
    const std::string&& arg1 = info[0].As<Napi::String>().Utf8Value();
    const NodeId value = *reinterpret_cast<const NodeId*>(arg1.data());
    return info.Env().Undefined();
  });
  // (low, high) => low; high = native.getLastHighBits()
  cases["two-args-and-separate-get-high-bits"] = Napi::Function::New(env, [](const Napi::CallbackInfo& info) -> Napi::Value {
    const uint32_t arg1Low = info[0].As<Napi::Number>().Uint32Value();
    const uint32_t arg2High = info[1].As<Napi::Number>().Uint32Value();
    const NodeId value = (static_cast<uint64_t>(arg2High) << 32) | arg1Low;
    lastHighBits = arg2High;
    return info.Env().Undefined();
  });
  // (new Uint32Array([0, 0])) => new Uint8Array([0, 0])
  cases["Uint32Array"] = Napi::Function::New(env, [](const Napi::CallbackInfo& info) -> Napi::Value {
    const uint32_t* arg1 = info[0].As<Napi::TypedArrayOf<uint32_t>>().Data();
    const NodeId value = *reinterpret_cast<const NodeId*>(arg1);
    return info.Env().Undefined();
  });
  // (number) => number
  cases["double-bytes"] = Napi::Function::New(env, [](const Napi::CallbackInfo& info) -> Napi::Value {
    const double arg1 = info[0].As<Napi::Number>().DoubleValue();
    const NodeId value = *reinterpret_cast<const NodeId*>(&arg1);
    return info.Env().Undefined();
  });
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
  return exports;
}

NODE_API_MODULE(addon, Init)
