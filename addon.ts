let nativeBindings;
try {
  nativeBindings = require("./build/Release/addon");
} catch {
  nativeBindings = require("./build/Debug/addon");
}


// matches array in C++
export enum Id64ArgKind {
  LowHighObject = 0,
  LowHighArray = 1,
  HexStringStringStream = 2,
  Base64String = 3,
  ByteString = 4,
  TwoNumbers = 5,
  Uint32Array = 6,
  DoubleAsBuffer = 7,
  BigInt = 8,
  External = 9,
  HalfByteString = 10,
  // TODO: BigInt64Array
  HexStringCustom = 11,
  HexStringStoi = 12,
}

/** unique type to represent Napi::External object */
const NapiExternal = Symbol("napi-external");
type NapiExternal = typeof NapiExternal;

export namespace Id64Args {
  export type LowHighObject = [{ low: number, high: number }, void];
  export type LowHighArray = [[ low: number, high: number ], void];
  export type HexStringStringStream = [string, void];
  export type Base64String = [string, void];
  export type ByteString = [string, void];
  export type TwoNumbers = [number, number];
  export type Uint32Array = [Uint32Array, void];
  export type DoubleAsBuffer = [number, void];
  export type BigInt = [bigint, void];
  export type External = [NapiExternal, void];
  export type HalfByteString = [string, void];
  export type HexStringCustom = [string, void];
  export type HexStringStoi = [string, void];
}

export type Id64Arg =
  | Id64Args.LowHighObject
  | Id64Args.LowHighArray
  | Id64Args.HexStringStringStream
  | Id64Args.Base64String
  | Id64Args.ByteString
  | Id64Args.TwoNumbers
  | Id64Args.Uint32Array
  | Id64Args.DoubleAsBuffer
  | Id64Args.BigInt
  | Id64Args.External
  | Id64Args.HalfByteString
  | Id64Args.HexStringCustom
  | Id64Args.HexStringStoi
;

export type IdArgsFor<Kind> =
  Kind extends Id64ArgKind.LowHighObject ? Id64Args.LowHighObject
  : Kind extends Id64ArgKind.LowHighArray ? Id64Args.LowHighArray
  : Kind extends Id64ArgKind.HexStringStringStream ? Id64Args.HexStringStringStream
  : Kind extends Id64ArgKind.Base64String ? Id64Args.Base64String
  : Kind extends Id64ArgKind.ByteString ? Id64Args.ByteString
  : Kind extends Id64ArgKind.TwoNumbers ? Id64Args.TwoNumbers
  : Kind extends Id64ArgKind.Uint32Array ? Id64Args.Uint32Array
  : Kind extends Id64ArgKind.DoubleAsBuffer ? Id64Args.DoubleAsBuffer
  : Kind extends Id64ArgKind.BigInt ? Id64Args.BigInt
  : Kind extends Id64ArgKind.External ? Id64Args.External
  : Kind extends Id64ArgKind.HalfByteString ? Id64Args.HalfByteString
  : Kind extends Id64ArgKind.HexStringCustom ? Id64Args.HexStringCustom
  : Kind extends Id64ArgKind.HexStringStoi ? Id64Args.HexStringStoi
  //: Kind extends Id64ArgKind ? Id64Arg
  : never;
;


export type MaybeHighBitArray<T extends Id64Arg> = T extends Id64Args.TwoNumbers
  ? number[] & { highBits: number[] }
  : T[0][];

export const getNeighbors: {
  (kind: Id64ArgKind.LowHighObject,  ...id: Id64Args.LowHighObject):  MaybeHighBitArray<Id64Args.LowHighObject>;
  (kind: Id64ArgKind.LowHighArray,   ...id: Id64Args.LowHighArray):   MaybeHighBitArray<Id64Args.LowHighArray>;
  (kind: Id64ArgKind.HexStringStringStream,      ...id: Id64Args.HexStringStringStream):      MaybeHighBitArray<Id64Args.HexStringStringStream>;
  (kind: Id64ArgKind.Base64String,   ...id: Id64Args.Base64String):   MaybeHighBitArray<Id64Args.Base64String>;
  (kind: Id64ArgKind.ByteString,     ...id: Id64Args.ByteString):     MaybeHighBitArray<Id64Args.ByteString>;
  (kind: Id64ArgKind.TwoNumbers,     ...id: Id64Args.TwoNumbers):     MaybeHighBitArray<Id64Args.TwoNumbers>;
  (kind: Id64ArgKind.Uint32Array,    ...id: Id64Args.Uint32Array):    MaybeHighBitArray<Id64Args.Uint32Array>;
  (kind: Id64ArgKind.DoubleAsBuffer, ...id: Id64Args.DoubleAsBuffer): MaybeHighBitArray<Id64Args.DoubleAsBuffer>;
  (kind: Id64ArgKind.BigInt,         ...id: Id64Args.BigInt):         MaybeHighBitArray<Id64Args.BigInt>;
  (kind: Id64ArgKind.External,       ...id: Id64Args.External):       MaybeHighBitArray<Id64Args.External>;
  (kind: Id64ArgKind.HalfByteString, ...id: Id64Args.HalfByteString): MaybeHighBitArray<Id64Args.HalfByteString>;
  (kind: Id64ArgKind.HexStringCustom,...id: Id64Args.HexStringCustom):MaybeHighBitArray<Id64Args.HexStringCustom>;
  (kind: Id64ArgKind.HexStringStoi,  ...id: Id64Args.HexStringStoi):  MaybeHighBitArray<Id64Args.HexStringStoi>;
  // generic case
  (kind: Id64ArgKind, ...id: Id64Arg): MaybeHighBitArray<Id64Arg>;
} = nativeBindings.getNeighbors;

export const getNodes: {
  (kind: Id64ArgKind.LowHighObject ): MaybeHighBitArray<Id64Args.LowHighObject>;
  (kind: Id64ArgKind.LowHighArray  ): MaybeHighBitArray<Id64Args.LowHighArray>;
  (kind: Id64ArgKind.HexStringStringStream     ): MaybeHighBitArray<Id64Args.HexStringStringStream>;
  (kind: Id64ArgKind.Base64String  ): MaybeHighBitArray<Id64Args.Base64String>;
  (kind: Id64ArgKind.ByteString    ): MaybeHighBitArray<Id64Args.ByteString>;
  (kind: Id64ArgKind.TwoNumbers    ): MaybeHighBitArray<Id64Args.TwoNumbers>;
  (kind: Id64ArgKind.Uint32Array   ): MaybeHighBitArray<Id64Args.Uint32Array>;
  (kind: Id64ArgKind.DoubleAsBuffer): MaybeHighBitArray<Id64Args.DoubleAsBuffer>;
  (kind: Id64ArgKind.BigInt        ): MaybeHighBitArray<Id64Args.BigInt>;
  (kind: Id64ArgKind.External      ): MaybeHighBitArray<Id64Args.External>;
  (kind: Id64ArgKind.HalfByteString): MaybeHighBitArray<Id64Args.HalfByteString>;
  (kind: Id64ArgKind.HexStringCustom     ): MaybeHighBitArray<Id64Args.HexStringCustom>;
  (kind: Id64ArgKind.HexStringStoi     ): MaybeHighBitArray<Id64Args.HexStringStoi>;
  // generic case
  (kind: Id64ArgKind): MaybeHighBitArray<Id64Arg>;
} = nativeBindings.getNodes;



export const nativeDjikstras
  : () => void
  = nativeBindings.nativeDjikstras;


export const doubleAsBufferWhenNanEqFallback
  : (l: Id64Args.DoubleAsBuffer[0], r: Id64Args.DoubleAsBuffer[0]) => boolean
  = nativeBindings.doubleAsBufferWhenNanEqFallback;

export function doubleAsBufferEq(...[l, _lExtra, r, _rExtra]: [...Id64Args.DoubleAsBuffer, ...Id64Args.DoubleAsBuffer]): boolean {
  // there is a small proportion (though not extremely tiny) of random u64 that will be NaN and because of the js spec we must handle these in native
  return Number.isNaN(l) || Number.isNaN(r)
    // must resort to native check when either is NaN
    ? doubleAsBufferWhenNanEqFallback(l, r)
    : l === r;
}

export function eq(...[kind, l, lExtra, r, rExtra]:
  | [Id64ArgKind.LowHighObject, ...Id64Args.LowHighObject, ...Id64Args.LowHighObject]
  | [Id64ArgKind.LowHighArray,  ...Id64Args.LowHighArray, ...Id64Args.LowHighArray]
  | [Id64ArgKind.HexStringStringStream,     ...Id64Args.HexStringStringStream, ...Id64Args.HexStringStringStream]
  | [Id64ArgKind.Base64String,  ...Id64Args.Base64String, ...Id64Args.Base64String]
  | [Id64ArgKind.ByteString,    ...Id64Args.ByteString, ...Id64Args.ByteString]
  | [Id64ArgKind.TwoNumbers,    ...Id64Args.TwoNumbers, ...Id64Args.TwoNumbers]
  | [Id64ArgKind.Uint32Array,   ...Id64Args.Uint32Array, ...Id64Args.Uint32Array]
  | [Id64ArgKind.DoubleAsBuffer,...Id64Args.DoubleAsBuffer, ...Id64Args.DoubleAsBuffer]
  | [Id64ArgKind.BigInt,        ...Id64Args.BigInt, ...Id64Args.BigInt]
  | [Id64ArgKind.External,      ...Id64Args.External, ...Id64Args.External]
  | [Id64ArgKind.HalfByteString,...Id64Args.HalfByteString, ...Id64Args.HalfByteString]
  | [Id64ArgKind.HexStringCustom,...Id64Args.HexStringCustom, ...Id64Args.HexStringCustom]
  | [Id64ArgKind.HexStringStoi, ...Id64Args.HexStringStoi, ...Id64Args.HexStringStoi]
): boolean {
  switch (kind) {
    case Id64ArgKind.LowHighObject:
      return l.low === r.low && l.high === r.high;
    case Id64ArgKind.Uint32Array:
    case Id64ArgKind.LowHighArray:
      return l[0] === r[0] && l[1] === r[1];
    case Id64ArgKind.TwoNumbers:
      return l === r && lExtra === rExtra;
    case Id64ArgKind.DoubleAsBuffer:
      // there is a small proportion (though not extremely tiny) of random u64 that will be NaN and because of the js spec we must handle these in native
      return Number.isNaN(l) && Number.isNaN(r)
        // must resort to native check when both are NaN
        ? doubleAsBufferWhenNanEqFallback(l, r)
        : l === r;
    default:
      return l === r;
  }
}

export const getLastHighBits
  : () => number
  = nativeBindings.getLastHighBits;

interface Id64NativeMap<K extends Id64Arg, V> {
  get(...[k, kExtra]: K): V;
  set(...[k, kExtra, v]: [...K, V]): Id64NativeMap<K, V>;
}

interface Id64NativeSet<K extends Id64Arg, V> {
  has(...[k, kExtra]: K): boolean;
  add(...[k, kExtra]: K): Id64NativeSet<K, V>;
}

export const Id64LowHighObjectMap: { new<V>(): Id64NativeMap<Id64Args.LowHighObject, V> } = nativeBindings.Id64LowHighObjectMap;
export const Id64LowHighObjectSet: { new<V>(): Id64NativeSet<Id64Args.LowHighObject, V> } = nativeBindings.Id64LowHighObjectSet;
export const Id64LowHighArrayMap: { new<V>(): Id64NativeMap<Id64Args.LowHighArray, V> } = nativeBindings.Id64LowHighArrayMap;
export const Id64LowHighArraySet: { new<V>(): Id64NativeSet<Id64Args.LowHighArray, V> } = nativeBindings.Id64LowHighArraySet;
export const Id64HexStringStringStreamMap: { new<V>(): Id64NativeMap<Id64Args.HexStringStringStream, V> } = nativeBindings.Id64HexStringStringStreamMap;
export const Id64HexStringStringStreamSet: { new<V>(): Id64NativeSet<Id64Args.HexStringStringStream, V> } = nativeBindings.Id64HexStringStringStreamSet;
export const Id64Base64StringMap: { new<V>(): Id64NativeMap<Id64Args.Base64String, V> } = nativeBindings.Id64Base64StringMap;
export const Id64Base64StringSet: { new<V>(): Id64NativeSet<Id64Args.Base64String, V> } = nativeBindings.Id64Base64StringSet;
export const Id64ByteStringMap: { new<V>(): Id64NativeMap<Id64Args.ByteString, V> } = nativeBindings.Id64ByteStringMap;
export const Id64ByteStringSet: { new<V>(): Id64NativeSet<Id64Args.ByteString, V> } = nativeBindings.Id64ByteStringSet;
export const Id64TwoNumbersMap: { new<V>(): Id64NativeMap<Id64Args.TwoNumbers, V> } = nativeBindings.Id64TwoNumbersMap;
export const Id64TwoNumbersSet: { new<V>(): Id64NativeSet<Id64Args.TwoNumbers, V> } = nativeBindings.Id64TwoNumbersSet;
export const Id64Uint32ArrayMap: { new<V>(): Id64NativeMap<Id64Args.Uint32Array, V> } = nativeBindings.Id64Uint32ArrayMap;
export const Id64Uint32ArraySet: { new<V>(): Id64NativeSet<Id64Args.Uint32Array, V> } = nativeBindings.Id64Uint32ArraySet;
export const Id64DoubleAsBufferMap: { new<V>(): Id64NativeMap<Id64Args.DoubleAsBuffer, V> } = nativeBindings.Id64DoubleAsBufferMap;
export const Id64DoubleAsBufferSet: { new<V>(): Id64NativeSet<Id64Args.DoubleAsBuffer, V> } = nativeBindings.Id64DoubleAsBufferSet;
export const Id64BigIntMap: { new<V>(): Id64NativeMap<Id64Args.BigInt, V> } = nativeBindings.Id64BigIntMap;
export const Id64BigIntSet: { new<V>(): Id64NativeSet<Id64Args.BigInt, V> } = nativeBindings.Id64BigIntSet;
export const Id64ExternalMap: { new<V>(): Id64NativeMap<Id64Args.External, V> } = nativeBindings.Id64ExternalMap;
export const Id64ExternalSet: { new<V>(): Id64NativeSet<Id64Args.External, V> } = nativeBindings.Id64ExternalSet;
export const Id64HalfByteStringMap: { new<V>(): Id64NativeMap<Id64Args.HalfByteString, V> } = nativeBindings.Id64HalfByteStringMap;
export const Id64HalfByteStringSet: { new<V>(): Id64NativeSet<Id64Args.HalfByteString, V> } = nativeBindings.Id64HalfByteStringSet;
export const Id64HexStringCustomMap: { new<V>(): Id64NativeMap<Id64Args.HexStringCustom, V> } = nativeBindings.Id64HexStringCustomMap;
export const Id64HexStringCustomSet: { new<V>(): Id64NativeSet<Id64Args.HexStringCustom, V> } = nativeBindings.Id64HexStringCustomSet;
export const Id64HexStringStoiMap: { new<V>(): Id64NativeMap<Id64Args.HexStringStoi, V> } = nativeBindings.Id64HexStringStoiMap;
export const Id64HexStringStoiSet: { new<V>(): Id64NativeSet<Id64Args.HexStringStoi, V> } = nativeBindings.Id64HexStringStoiSet;

export const convert: {
  // generic case (untyped right now since only exposing for REPL usage)
  (fromKind: Id64ArgKind, toKind: Id64ArgKind, ...id: Id64Arg): MaybeHighBitArray<Id64Arg>;
} = nativeBindings.convert;
