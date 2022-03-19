#include <napi.h>
#include <vector>
#include <unordered_map>
#include <cstdint>

using NodeId = uint64_t;
using Node = std::vector<NodeId>;
using Graph = std::unordered_map<NodeId, Node>;

Graph generateGraph() {
  Graph result;
  return result;
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports["lowHigh"] = Napi::Function::New(env, [](const Napi::CallbackInfo& info) -> Napi::Value {
    return info.Env().Undefined();
  });
  //exports["hex"] = Napi::Function::New(env, []() { });
  //exports["base64"] = Napi::Function::New(env, []() { });
  return exports;
}

NODE_API_MODULE(addon, Init)
