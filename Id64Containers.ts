// TODO: probably should make Int64/Id64 names consistent
import { Id64Arg, Id64ArgKind, Id64Args, Id64DoubleAsBufferMap, Id64DoubleAsBufferSet, Id64ExternalMap, Id64ExternalSet } from "./addon";

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
// overload for the generic case
export function MakeIdMapClass<V>(kind: Id64ArgKind): new() => Id64Map<Id64Arg, V>;
export function MakeIdMapClass<V>(
  kind: Id64ArgKind
): new() => Id64Map<Id64Arg, V> {
  class LayeredMap {
    _map = new Map<number, Map<number, V>>();
    get(l: number, r: number): V | undefined {
      let submap = this._map.get(l);
      if (submap === undefined) {
        submap = new Map<number, V>();
        this._map.set(l, submap);
      }
      return submap.get(r);
    }
    set(l: number, r: number, val: V): this {
      let submap = this._map.get(l);
      if (submap === undefined) {
        submap = new Map<number, V>();
        this._map.set(l, submap);
      }
      submap.set(r, val);
      return this;
    }
  }
  switch (kind) {
    case Id64ArgKind.LowHighObject:
      return class LowHighObjectMap implements Id64Map<Id64Args.LowHighObject, V> {
        _map = new LayeredMap();
        get(...[k]: Id64Args.LowHighObject): V | undefined {
          return this._map.get(k.low, k.high);
        }
        set(...[k, _kExtra, v]: [...Id64Args.LowHighObject, V]): Id64Map<Id64Args.LowHighObject, V> {
          this._map.set(k.low, k.high, v);
          return this;
        }
      };
    case Id64ArgKind.LowHighArray:
    case Id64ArgKind.Uint32Array:
      return class LowHighArrayMap implements Id64Map<Id64Args.LowHighArray, V> {
        _map = new LayeredMap();
        get(...[k]: Id64Args.LowHighArray): V | undefined {
          return this._map.get(k[0], k[1]);
        }
        set(...[k, _kExtra, val]: [...Id64Args.LowHighArray, V]): Id64Map<Id64Args.LowHighArray, V> {
          this._map.set(k[0], k[1], val);
          return this;
        }
      };
    case Id64ArgKind.HexString:
    case Id64ArgKind.Base64String:
    case Id64ArgKind.ByteString:
    case Id64ArgKind.BigInt:
    case Id64ArgKind.HalfByteString:
      return class TwoArgMap {
        _map = new Map();
        get(...[k]: Id64Arg): V | undefined {
          return this._map.get(k);
        }
        set(...[k, _kExtra, val]: [...Id64Args.LowHighArray, V]): TwoArgMap {
          this._map.set(k, val);
          return this;
        }
      };
    case Id64ArgKind.TwoNumbers: return LayeredMap;
    case Id64ArgKind.DoubleAsBuffer: return Id64DoubleAsBufferMap;
    case Id64ArgKind.External: return Id64ExternalMap;
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
// overload for the generic case
export function MakeIdSetClass<V>(kind: Id64ArgKind): new() => Id64Set<Id64Arg>;
export function MakeIdSetClass<V>(
  kind: Id64ArgKind
): new() => Id64Set<Id64Arg> {
  class LayeredSet {
    _map = new Map<number, Set<number>>();
    has(l: number, r: number): boolean {
      let subset = this._map.get(l);
      if (subset === undefined) {
        subset = new Set<number>();
        this._map.set(l, subset);
      }
      return subset.has(r);
    }
    add(l: number, r: number): this {
      let subset = this._map.get(l);
      if (subset === undefined) {
        subset = new Set<number>();
        this._map.set(l, subset);
      }
      subset.add(r);
      return this;
    }
  }
  switch (kind) {
    case Id64ArgKind.LowHighObject:
      return class LowHighObjectSet implements Id64Set<Id64Args.LowHighObject> {
        _set = new LayeredSet();
        has(...[k]: Id64Args.LowHighObject): boolean {
          return this._set.has(k.low, k.high);
        }
        add(...[k]: Id64Args.LowHighObject): Id64Set<Id64Args.LowHighObject> {
          this._set.add(k.low, k.high);
          return this;
        }
      }
    case Id64ArgKind.LowHighArray:
    case Id64ArgKind.Uint32Array:
      return class LowHighArraySet implements Id64Set<Id64Args.LowHighArray> {
        _set = new LayeredSet();
        has(...[k]: Id64Args.LowHighArray): boolean {
          return this._set.has(k[0], k[1]);
        }
        add(...[k]: Id64Args.LowHighArray): Id64Set<Id64Args.LowHighArray> {
          this._set.add(k[0], k[1]);
          return this;
        }
      }
    case Id64ArgKind.HexString:
    case Id64ArgKind.Base64String:
    case Id64ArgKind.ByteString:
    case Id64ArgKind.BigInt:
    case Id64ArgKind.HalfByteString:
      return Set;
    case Id64ArgKind.TwoNumbers: return LayeredSet;
    case Id64ArgKind.DoubleAsBuffer: return Id64DoubleAsBufferSet;
    case Id64ArgKind.External: return Id64ExternalSet;
  }
}
