import { Id64, Id64ArgKind, Id64Args } from "./addon";

export interface PartialMap<K, V> /* extends Pick<Map<K, V>, "get" | "set"> */ {
  get(k: K): V | undefined;
  set(k: K, v: V): PartialMap<K, V>;
}
export interface PartialDoubleNumMap<V> {
  get(l: number, h: number): V | undefined;
  set(l: number, h: number, val: V): this;
}

export function MakeIdMapClass<V>(kind: Id64ArgKind.LowHighObject ): new() => PartialMap<Id64Args.LowHighObject[0],   V>;
export function MakeIdMapClass<V>(kind: Id64ArgKind.LowHighArray  ): new() => PartialMap<Id64Args.LowHighArray[0],    V>;
export function MakeIdMapClass<V>(kind: Id64ArgKind.HexString     ): new() => PartialMap<Id64Args.HexString[0],       V>;
export function MakeIdMapClass<V>(kind: Id64ArgKind.Base64String  ): new() => PartialMap<Id64Args.Base64String[0],    V>;
export function MakeIdMapClass<V>(kind: Id64ArgKind.ByteString    ): new() => PartialMap<Id64Args.ByteString[0],      V>;
export function MakeIdMapClass<V>(kind: Id64ArgKind.TwoNumbers    ): new() => PartialDoubleNumMap<V>;
export function MakeIdMapClass<V>(kind: Id64ArgKind.Uint32Array   ): new() => PartialMap<Id64Args.Uint32Array[0],     V>;
export function MakeIdMapClass<V>(kind: Id64ArgKind.DoubleAsBuffer): new() => PartialMap<Id64Args.DoubleAsBuffer[0],  V>;
export function MakeIdMapClass<V>(kind: Id64ArgKind.BigInt        ): new() => PartialMap<Id64Args.BigInt[0],          V>;
// overload for the generic case
export function MakeIdMapClass<V>(kind: Id64ArgKind): new() => (PartialMap<Id64[0], V> | PartialDoubleNumMap<V>);
export function MakeIdMapClass<V>(
  kind: Id64ArgKind
): new() => (PartialMap<Id64[0], V> | PartialDoubleNumMap<V>) {
  class LayeredMap implements PartialDoubleNumMap<V> {
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
      return class LowHighObjectMap implements PartialMap<Id64Args.LowHighObject[0], V> {
        _map = new LayeredMap();
        get(...[k]: Id64Args.LowHighObject): V | undefined {
          return this._map.get(k.low, k.high);
        }
        set(...[k, val]: [...Id64Args.LowHighObject, V]): PartialMap<Id64Args.LowHighObject[0], V> {
          this._map.set(k.low, k.high, val);
          return this as any;
        }
      }
    case Id64ArgKind.LowHighArray:
    case Id64ArgKind.Uint32Array:
      return class LowHighArrayMap implements PartialMap<Id64Args.LowHighArray[0], V> {
        _map = new LayeredMap();
        get(...[k]: Id64Args.LowHighArray): V | undefined {
          return this._map.get(k[0], k[1]);
        }
        set(...[k, val]: [...Id64Args.LowHighArray, V]): PartialMap<Id64Args.LowHighArray[0], V> {
          this._map.set(k[0], k[1], val);
          return this as any;
        }
      }
    case Id64ArgKind.HexString:
    case Id64ArgKind.Base64String:
    case Id64ArgKind.ByteString:
    case Id64ArgKind.BigInt:
      return Map;
    case Id64ArgKind.TwoNumbers: return LayeredMap;
    // not sure if this one can be done in javascript...
    case Id64ArgKind.DoubleAsBuffer:
      return class DoubleAsBufferMap extends Map<Id64Args.DoubleAsBuffer[0], V> {
        get(...[key]: Id64Args.DoubleAsBuffer): V | undefined {
          if (Number.isNaN(key)) throw Error("do not yet handle NaNs in this container...");
          return this.get(key);
        }
        set(...[key, value]: [...Id64Args.DoubleAsBuffer, V]): this {
          if (Number.isNaN(key)) throw Error("do not yet handle NaNs in this container...");
          return this.set(key, value);
        }
      }
  }
}

export interface Id64Set<K extends Id64> /* extends Pick<Map<K, V>, "get" | "set"> */ {
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
export function MakeIdSetClass<V>(kind: Id64ArgKind): new() => Id64Set<Id64>;
export function MakeIdSetClass<V>(
  kind: Id64ArgKind
): new() => Id64Set<Id64> {
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
          return this as any;
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
          return this as any;
        }
      }
    case Id64ArgKind.HexString:
    case Id64ArgKind.Base64String:
    case Id64ArgKind.ByteString:
    case Id64ArgKind.BigInt:
      return Set;
    case Id64ArgKind.TwoNumbers: return LayeredSet;
    // not sure if this one can be done in javascript...
    case Id64ArgKind.DoubleAsBuffer:
      return class DoubleAsBufferMap extends Map<Id64Args.DoubleAsBuffer[0], V> {
        has(...[k]: Id64Args.DoubleAsBuffer): boolean {
          if (Number.isNaN(k)) throw Error("do not yet handle NaNs in this container...");
          return this.has(k);
        }
        add(...[k]: Id64Args.DoubleAsBuffer): this {
          if (Number.isNaN(k)) throw Error("do not yet handle NaNs in this container...");
          return this.add(k);
        }
      }
  }
}
