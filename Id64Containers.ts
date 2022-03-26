// TODO: probably should make Int64/Id64 names consistent
import {
  Id64DoubleAsBufferMap,
  Id64DoubleAsBufferSet,
  Id64Arg,
  Id64ArgKind,
  Id64Args,
  Id64HexStringSet,
  Id64Base64StringSet,
  Id64ByteStringSet,
  Id64BigIntSet,
  Id64ExternalSet,
  Id64TwoNumbersSet,
  Id64Uint32ArraySet,
  Id64LowHighArraySet,
  Id64LowHighObjectSet,
  Id64Base64StringMap,
  Id64BigIntMap,
  Id64ByteStringMap,
  Id64ExternalMap,
  Id64HexStringMap,
  Id64LowHighArrayMap,
  Id64LowHighObjectMap,
  Id64TwoNumbersMap,
  Id64Uint32ArrayMap,
} from "./addon";

export interface Id64Map<K extends Id64Arg, V> /* extends Pick<Map<K, V>, "get" | "set"> */ {
  get(k: K[0], kExtra: K[1]): V | undefined;
  set(k: K[0], kExtra: K[1], v: V): Id64Map<K, V>;
}

export function MakeIdMapClass<V>(kind: Id64ArgKind.LowHighObject ): new() => Id64Map<Id64Args.LowHighObject,   V>;
export function MakeIdMapClass<V>(kind: Id64ArgKind.LowHighArray  ): new() => Id64Map<Id64Args.LowHighArray,    V>;
export function MakeIdMapClass<V>(kind: Id64ArgKind.HexString     ): new() => Id64Map<Id64Args.HexString,       V>;
export function MakeIdMapClass<V>(kind: Id64ArgKind.Base64String  ): new() => Id64Map<Id64Args.Base64String,    V>;
export function MakeIdMapClass<V>(kind: Id64ArgKind.ByteString    ): new() => Id64Map<Id64Args.ByteString,      V>;
export function MakeIdMapClass<V>(kind: Id64ArgKind.TwoNumbers    ): new() => Id64Map<Id64Args.TwoNumbers,      V>
export function MakeIdMapClass<V>(kind: Id64ArgKind.Uint32Array   ): new() => Id64Map<Id64Args.Uint32Array,     V>;
export function MakeIdMapClass<V>(kind: Id64ArgKind.DoubleAsBuffer): new() => Id64Map<Id64Args.DoubleAsBuffer,  V>;
export function MakeIdMapClass<V>(kind: Id64ArgKind.BigInt        ): new() => Id64Map<Id64Args.BigInt,          V>;
export function MakeIdMapClass<V>(kind: Id64ArgKind.External      ): new() => Id64Map<Id64Args.External,        V>;
// overload for the generic case
export function MakeIdMapClass<V>(kind: Id64ArgKind): new() => Id64Map<Id64Arg, V>;
export function MakeIdMapClass<V>(
  kind: Id64ArgKind
): new() => Id64Map<Id64Arg, V> {
  switch (kind) {
    case Id64ArgKind.LowHighObject:
      return Id64LowHighObjectMap;
    case Id64ArgKind.LowHighArray:
      return Id64LowHighArrayMap;
    case Id64ArgKind.Uint32Array:
      return Id64Uint32ArrayMap;
    case Id64ArgKind.HexString:
      return Id64HexStringMap;
    case Id64ArgKind.Base64String:
      return Id64Base64StringMap;
    case Id64ArgKind.ByteString:
      return Id64ByteStringMap;
    case Id64ArgKind.BigInt:
      return Id64BigIntMap;
    case Id64ArgKind.External:
      return Id64ExternalMap;
    case Id64ArgKind.TwoNumbers:
      return Id64TwoNumbersMap;
    case Id64ArgKind.DoubleAsBuffer:
      return Id64DoubleAsBufferMap;
  }
}

export interface Id64Set<K extends Id64Arg> /* extends Pick<Map<K, V>, "get" | "set"> */ {
  has(lowOrObj: K[0], high: K[1]): boolean;
  add(lowOrObj: K[0], high: K[1]): Id64Set<K>;
}

export function MakeIdSetClass<V>(kind: Id64ArgKind.LowHighObject ): new() => Id64Set<Id64Args.LowHighObject>;
export function MakeIdSetClass<V>(kind: Id64ArgKind.LowHighArray  ): new() => Id64Set<Id64Args.LowHighArray>;
export function MakeIdSetClass<V>(kind: Id64ArgKind.HexString     ): new() => Id64Set<Id64Args.HexString>;
export function MakeIdSetClass<V>(kind: Id64ArgKind.Base64String  ): new() => Id64Set<Id64Args.Base64String>;
export function MakeIdSetClass<V>(kind: Id64ArgKind.ByteString    ): new() => Id64Set<Id64Args.ByteString>;
export function MakeIdSetClass<V>(kind: Id64ArgKind.TwoNumbers    ): new() => Id64Set<Id64Args.TwoNumbers>;
export function MakeIdSetClass<V>(kind: Id64ArgKind.Uint32Array   ): new() => Id64Set<Id64Args.Uint32Array>;
export function MakeIdSetClass<V>(kind: Id64ArgKind.DoubleAsBuffer): new() => Id64Set<Id64Args.DoubleAsBuffer>;
export function MakeIdSetClass<V>(kind: Id64ArgKind.BigInt        ): new() => Id64Set<Id64Args.BigInt>;
export function MakeIdSetClass<V>(kind: Id64ArgKind.External      ): new() => Id64Set<Id64Args.External>;
// overload for the generic case
export function MakeIdSetClass<V>(kind: Id64ArgKind): new() => Id64Set<Id64Arg>;
export function MakeIdSetClass<V>(
  kind: Id64ArgKind
): new() => Id64Set<Id64Arg> {
  switch (kind) {
    case Id64ArgKind.LowHighObject:
      return Id64LowHighObjectSet;
    case Id64ArgKind.LowHighArray:
      return Id64LowHighArraySet;
    case Id64ArgKind.Uint32Array:
      return Id64Uint32ArraySet;
    case Id64ArgKind.HexString:
      return Id64HexStringSet;
    case Id64ArgKind.Base64String:
      return Id64Base64StringSet;
    case Id64ArgKind.ByteString:
      return Id64ByteStringSet;
    case Id64ArgKind.BigInt:
      return Id64BigIntSet;
    case Id64ArgKind.External:
      return Id64ExternalSet;
    case Id64ArgKind.TwoNumbers:
      return Id64TwoNumbersSet;
    case Id64ArgKind.DoubleAsBuffer:
      return Id64DoubleAsBufferSet;
  }
}
