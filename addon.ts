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
  HexString = 2,
  Base64String = 3,
  ByteString = 4,
  TwoNumbers = 5,
  Uint32Array = 6,
  DoubleAsBuffer = 7,
  BigInt = 8,
  // TODO: BigInt64Array
}

export namespace Id64Args {
  export type LowHighObject = [{ low: number, high: number }, void];
  export type LowHighArray = [[ low: number, high: number ], void];
  export type HexString = [string, void];
  export type Base64String = [string, void];
  export type ByteString = [string, void];
  export type TwoNumbers = [number, number];
  export type Uint32Array = [Uint32Array, void];
  export type DoubleAsBuffer = [number, void];
  export type BigInt = [bigint, void];
}

export type Id64Arg =
  | Id64Args.LowHighObject
  | Id64Args.LowHighArray
  | Id64Args.HexString
  | Id64Args.Base64String
  | Id64Args.ByteString
  | Id64Args.TwoNumbers
  | Id64Args.Uint32Array
  | Id64Args.DoubleAsBuffer
  | Id64Args.BigInt
;

export type IdArgsFor<Kind> =
  Kind extends Id64ArgKind.LowHighObject ? Id64Args.LowHighObject
  : Kind extends Id64ArgKind.LowHighArray ? Id64Args.LowHighArray
  : Kind extends Id64ArgKind.HexString ? Id64Args.HexString
  : Kind extends Id64ArgKind.Base64String ? Id64Args.Base64String
  : Kind extends Id64ArgKind.ByteString ? Id64Args.ByteString
  : Kind extends Id64ArgKind.TwoNumbers ? Id64Args.TwoNumbers
  : Kind extends Id64ArgKind.Uint32Array ? Id64Args.Uint32Array
  : Kind extends Id64ArgKind.DoubleAsBuffer ? Id64Args.DoubleAsBuffer
  : Kind extends Id64ArgKind.BigInt ? Id64Args.BigInt
  //: Kind extends Id64ArgKind ? Id64Arg
  : never;
;


export type MaybeHighBitArray<T> = T extends Id64Args.TwoNumbers
  ? number[] & { highBits: number[] }
  : T[];

export const getNeighbors: {
  (kind: Id64ArgKind.LowHighObject,  ...id: Id64Args.LowHighObject):  MaybeHighBitArray<Id64Args.LowHighObject>;
  (kind: Id64ArgKind.LowHighArray,   ...id: Id64Args.LowHighArray):   MaybeHighBitArray<Id64Args.LowHighArray>;
  (kind: Id64ArgKind.HexString,      ...id: Id64Args.HexString):      MaybeHighBitArray<Id64Args.HexString>;
  (kind: Id64ArgKind.Base64String,   ...id: Id64Args.Base64String):   MaybeHighBitArray<Id64Args.Base64String>;
  (kind: Id64ArgKind.ByteString,     ...id: Id64Args.ByteString):     MaybeHighBitArray<Id64Args.ByteString>;
  (kind: Id64ArgKind.TwoNumbers,     ...id: Id64Args.TwoNumbers):     MaybeHighBitArray<Id64Args.TwoNumbers>;
  (kind: Id64ArgKind.Uint32Array,    ...id: Id64Args.Uint32Array):    MaybeHighBitArray<Id64Args.Uint32Array>;
  (kind: Id64ArgKind.DoubleAsBuffer, ...id: Id64Args.DoubleAsBuffer): MaybeHighBitArray<Id64Args.DoubleAsBuffer>;
  (kind: Id64ArgKind.BigInt,         ...id: Id64Args.BigInt):         MaybeHighBitArray<Id64Args.BigInt>;
  // generic case
  (kind: Id64ArgKind, ...id: Id64Arg): MaybeHighBitArray<Id64Arg>;
} = nativeBindings.getNeighbors;

export const getNodes: {
  (kind: Id64ArgKind.LowHighObject ): MaybeHighBitArray<Id64Args.LowHighObject>;
  (kind: Id64ArgKind.LowHighArray  ): MaybeHighBitArray<Id64Args.LowHighArray>;
  (kind: Id64ArgKind.HexString     ): MaybeHighBitArray<Id64Args.HexString>;
  (kind: Id64ArgKind.Base64String  ): MaybeHighBitArray<Id64Args.Base64String>;
  (kind: Id64ArgKind.ByteString    ): MaybeHighBitArray<Id64Args.ByteString>;
  (kind: Id64ArgKind.TwoNumbers    ): MaybeHighBitArray<Id64Args.TwoNumbers>;
  (kind: Id64ArgKind.Uint32Array   ): MaybeHighBitArray<Id64Args.Uint32Array>;
  (kind: Id64ArgKind.DoubleAsBuffer): MaybeHighBitArray<Id64Args.DoubleAsBuffer>;
  (kind: Id64ArgKind.BigInt        ): MaybeHighBitArray<Id64Args.BigInt>;
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
  | [Id64ArgKind.HexString,     ...Id64Args.HexString, ...Id64Args.HexString]
  | [Id64ArgKind.Base64String,  ...Id64Args.Base64String, ...Id64Args.Base64String]
  | [Id64ArgKind.ByteString,    ...Id64Args.ByteString, ...Id64Args.ByteString]
  | [Id64ArgKind.TwoNumbers,    ...Id64Args.TwoNumbers, ...Id64Args.TwoNumbers]
  | [Id64ArgKind.Uint32Array,   ...Id64Args.Uint32Array, ...Id64Args.Uint32Array]
  | [Id64ArgKind.DoubleAsBuffer,...Id64Args.DoubleAsBuffer, ...Id64Args.DoubleAsBuffer]
  | [Id64ArgKind.BigInt,        ...Id64Args.BigInt, ...Id64Args.BigInt]
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

interface DoubleAsBufferMap<V> {
  get(...[k, kExtra]: Id64Args.DoubleAsBuffer): V;
  set(...[k, kExtra, v]: [...Id64Args.DoubleAsBuffer, V]): DoubleAsBufferMap<V>;
}

export const DoubleAsBufferMap: {
  new <V>(): DoubleAsBufferMap<V>
} = nativeBindings.DoubleAsBufferMap;

interface DoubleAsBufferSet<V> {
  has(...[k, kExtra]: Id64Args.DoubleAsBuffer): boolean;
  add(...[k, kExtra]: Id64Args.DoubleAsBuffer): DoubleAsBufferSet<V>;
}

export const DoubleAsBufferSet: {
  new <V>(): DoubleAsBufferSet<V>
} = nativeBindings.DoubleAsBufferSet;
