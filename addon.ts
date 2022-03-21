
const nativeBindings = require("./build/Debug/addon");
Object.assign(module, nativeBindings); // well this is kinda weird

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

export namespace Id64Arg {
  export type LowHighObject = [{ low: number, high: number }];
  export type LowHighArray = [[ low: number, high: number ]];
  export type HexString = [string];
  export type Base64String = [string];
  export type ByteString = [string];
  export type TwoNumbers = [number, number];
  export type Uint32Array = [Uint32Array];
  export type DoubleAsBuffer = [number];
  export type BigInt = [bigint];
}

type MaybeHighBitArray<T> = T extends Id64Arg.TwoNumbers
  ? number[] & { highBits: number[] }
  : T[];

export declare function getNeighbors(kind: Id64ArgKind.LowHighObject,  ...id: Id64Arg.LowHighObject):  MaybeHighBitArray<Id64Arg.LowHighObject>;
export declare function getNeighbors(kind: Id64ArgKind.LowHighArray,   ...id: Id64Arg.LowHighArray):   MaybeHighBitArray<Id64Arg.LowHighArray>;
export declare function getNeighbors(kind: Id64ArgKind.HexString,      ...id: Id64Arg.HexString):      MaybeHighBitArray<Id64Arg.HexString>;
export declare function getNeighbors(kind: Id64ArgKind.Base64String,   ...id: Id64Arg.Base64String):   MaybeHighBitArray<Id64Arg.Base64String>;
export declare function getNeighbors(kind: Id64ArgKind.ByteString,     ...id: Id64Arg.ByteString):     MaybeHighBitArray<Id64Arg.ByteString>;
export declare function getNeighbors(kind: Id64ArgKind.TwoNumbers,     ...id: Id64Arg.TwoNumbers):     MaybeHighBitArray<Id64Arg.TwoNumbers>;
export declare function getNeighbors(kind: Id64ArgKind.Uint32Array,    ...id: Id64Arg.Uint32Array):    MaybeHighBitArray<Id64Arg.Uint32Array>;
export declare function getNeighbors(kind: Id64ArgKind.DoubleAsBuffer, ...id: Id64Arg.DoubleAsBuffer): MaybeHighBitArray<Id64Arg.DoubleAsBuffer>;
export declare function getNeighbors(kind: Id64ArgKind.BigInt,         ...id: Id64Arg.BigInt):         MaybeHighBitArray<Id64Arg.BigInt>;

export declare function doubleAsBufferWhenNanEqFallback(...[l, r]: [...Id64Arg.DoubleAsBuffer, ...Id64Arg.DoubleAsBuffer]): boolean;

export function doubleAsBufferEq(...[l, r]: [...Id64Arg.DoubleAsBuffer, ...Id64Arg.DoubleAsBuffer]): boolean {
  // there is a small proportion (though not extremely tiny) of random u64 that will be NaN and because of the js spec we must handle these in native
  return Number.isNaN(l) || Number.isNaN(r)
    // must resort to native check when either is NaN
    ? doubleAsBufferWhenNanEqFallback(l, r)
    : l === r;
}

export function eq(kind: Id64ArgKind.LowHighObject,  ...[l, r]: [...Id64Arg.LowHighObject, ...Id64Arg.LowHighObject]):  boolean
export function eq(kind: Id64ArgKind.LowHighArray,   ...[l, r]: [...Id64Arg.LowHighArray, ...Id64Arg.LowHighArray]):   boolean
export function eq(kind: Id64ArgKind.HexString,      ...[l, r]: [...Id64Arg.HexString, ...Id64Arg.HexString]):      boolean
export function eq(kind: Id64ArgKind.Base64String,   ...[l, r]: [...Id64Arg.Base64String, ...Id64Arg.Base64String]):   boolean
export function eq(kind: Id64ArgKind.ByteString,     ...[l, r]: [...Id64Arg.ByteString, ...Id64Arg.ByteString]):     boolean
export function eq(kind: Id64ArgKind.TwoNumbers,     ...[l, r]: [...Id64Arg.TwoNumbers, ...Id64Arg.TwoNumbers]):     boolean
export function eq(kind: Id64ArgKind.Uint32Array,    ...[l, r]: [...Id64Arg.Uint32Array, ...Id64Arg.Uint32Array]):    boolean
export function eq(kind: Id64ArgKind.DoubleAsBuffer, ...[l, r]: [...Id64Arg.DoubleAsBuffer, ...Id64Arg.DoubleAsBuffer]): boolean
export function eq(kind: Id64ArgKind.BigInt,         ...[l, r]: [...Id64Arg.BigInt, ...Id64Arg.BigInt]):         boolean
export function eq(...[kind, l, r, r1, r2]:
  | [Id64ArgKind.LowHighObject, ...Id64Arg.LowHighObject, ...Id64Arg.LowHighObject]
  | [Id64ArgKind.LowHighArray,  ...Id64Arg.LowHighArray, ...Id64Arg.LowHighArray]
  | [Id64ArgKind.HexString,     ...Id64Arg.HexString, ...Id64Arg.HexString]
  | [Id64ArgKind.Base64String,  ...Id64Arg.Base64String, ...Id64Arg.Base64String]
  | [Id64ArgKind.ByteString,    ...Id64Arg.ByteString, ...Id64Arg.ByteString]
  | [Id64ArgKind.TwoNumbers,    ...Id64Arg.TwoNumbers, ...Id64Arg.TwoNumbers]
  | [Id64ArgKind.Uint32Array,   ...Id64Arg.Uint32Array, ...Id64Arg.Uint32Array]
  | [Id64ArgKind.DoubleAsBuffer,...Id64Arg.DoubleAsBuffer, ...Id64Arg.DoubleAsBuffer]
  | [Id64ArgKind.BigInt,        ...Id64Arg.BigInt, ...Id64Arg.BigInt]
): boolean {
  switch (kind) {
    case Id64ArgKind.LowHighObject:
      return l.low === r.low && l.high === r.high;
    case Id64ArgKind.Uint32Array:
    case Id64ArgKind.LowHighArray:
      return l[0] === r[0] && l[1] === r[1];
    case Id64ArgKind.TwoNumbers:
      return l === r1 && r === r2;
    case Id64ArgKind.TwoNumbers:
      return l === r1 && r === r2;
    case Id64ArgKind.DoubleAsBuffer:
      // there is a small proportion (though not extremely tiny) of random u64 that will be NaN and because of the js spec we must handle these in native
      return Number.isNaN(l) || Number.isNaN(r)
        // must resort to native check when either is NaN
        ? doubleAsBufferWhenNanEqFallback(l, r)
        : l === r;
    default:
      return l === r;
  }
}

export declare function getLastHighBits(): number;
