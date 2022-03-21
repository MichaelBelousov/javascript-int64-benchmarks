
import os from "os";

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

export namespace Id64Args {
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

export type Id64 = 
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

type MaybeHighBitArray<T> = T extends Id64Arg.TwoNumbers
  ? number[] & { highBits: number[] }
  : T[];

export declare function getNeighbors(kind: Id64ArgKind.LowHighObject,  ...id: Id64Args.LowHighObject):  MaybeHighBitArray<Id64Args.LowHighObject>;
export declare function getNeighbors(kind: Id64ArgKind.LowHighArray,   ...id: Id64Args.LowHighArray):   MaybeHighBitArray<Id64Args.LowHighArray>;
export declare function getNeighbors(kind: Id64ArgKind.HexString,      ...id: Id64Args.HexString):      MaybeHighBitArray<Id64Args.HexString>;
export declare function getNeighbors(kind: Id64ArgKind.Base64String,   ...id: Id64Args.Base64String):   MaybeHighBitArray<Id64Args.Base64String>;
export declare function getNeighbors(kind: Id64ArgKind.ByteString,     ...id: Id64Args.ByteString):     MaybeHighBitArray<Id64Args.ByteString>;
export declare function getNeighbors(kind: Id64ArgKind.TwoNumbers,     ...id: Id64Args.TwoNumbers):     MaybeHighBitArray<Id64Args.TwoNumbers>;
export declare function getNeighbors(kind: Id64ArgKind.Uint32Array,    ...id: Id64Args.Uint32Array):    MaybeHighBitArray<Id64Args.Uint32Array>;
export declare function getNeighbors(kind: Id64ArgKind.DoubleAsBuffer, ...id: Id64Args.DoubleAsBuffer): MaybeHighBitArray<Id64Args.DoubleAsBuffer>;
export declare function getNeighbors(kind: Id64ArgKind.BigInt,         ...id: Id64Args.BigInt):         MaybeHighBitArray<Id64Args.BigInt>;

export declare function doubleAsBufferWhenNanEqFallback(...[l, r]: [...Id64Args.DoubleAsBuffer, ...Id64Args.DoubleAsBuffer]): boolean;

export function doubleAsBufferEq(...[l, r]: [...Id64Args.DoubleAsBuffer, ...Id64Args.DoubleAsBuffer]): boolean {
  // there is a small proportion (though not extremely tiny) of random u64 that will be NaN and because of the js spec we must handle these in native
  return Number.isNaN(l) || Number.isNaN(r)
    // must resort to native check when either is NaN
    ? doubleAsBufferWhenNanEqFallback(l, r)
    : l === r;
}

export function eq(kind: Id64ArgKind.LowHighObject,  ...[l, r]: [...Id64Args.LowHighObject, ...Id64Args.LowHighObject]):  boolean
export function eq(kind: Id64ArgKind.LowHighArray,   ...[l, r]: [...Id64Args.LowHighArray, ...Id64Args.LowHighArray]):   boolean
export function eq(kind: Id64ArgKind.HexString,      ...[l, r]: [...Id64Args.HexString, ...Id64Args.HexString]):      boolean
export function eq(kind: Id64ArgKind.Base64String,   ...[l, r]: [...Id64Args.Base64String, ...Id64Args.Base64String]):   boolean
export function eq(kind: Id64ArgKind.ByteString,     ...[l, r]: [...Id64Args.ByteString, ...Id64Args.ByteString]):     boolean
export function eq(kind: Id64ArgKind.TwoNumbers,     ...[l, r]: [...Id64Args.TwoNumbers, ...Id64Args.TwoNumbers]):     boolean
export function eq(kind: Id64ArgKind.Uint32Array,    ...[l, r]: [...Id64Args.Uint32Array, ...Id64Args.Uint32Array]):    boolean
export function eq(kind: Id64ArgKind.DoubleAsBuffer, ...[l, r]: [...Id64Args.DoubleAsBuffer, ...Id64Args.DoubleAsBuffer]): boolean
export function eq(kind: Id64ArgKind.BigInt,         ...[l, r]: [...Id64Args.BigInt, ...Id64Args.BigInt]):         boolean
export function eq(...[kind, l, r, r1, r2]:
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

/** string of bytes to uint32 */
const binaryToUint32 = os.endianness() == "BE"
  ? function binaryToUint32(binary: string) {
    // TODO: check this
    return binary[0]
  }
  : function binaryToUint32(binary: string) {

  };

export function getLow(
  ...[kind, first, second]:
  | [Id64ArgKind.LowHighObject, ...Id64Args.LowHighObject]
  | [Id64ArgKind.LowHighArray,  ...Id64Args.LowHighArray]
  | [Id64ArgKind.HexString,     ...Id64Args.HexString]
  | [Id64ArgKind.Base64String,  ...Id64Args.Base64String]
  | [Id64ArgKind.ByteString,    ...Id64Args.ByteString]
  | [Id64ArgKind.TwoNumbers,    ...Id64Args.TwoNumbers]
  | [Id64ArgKind.Uint32Array,   ...Id64Args.Uint32Array]
  | [Id64ArgKind.DoubleAsBuffer,...Id64Args.DoubleAsBuffer]
  | [Id64ArgKind.BigInt,        ...Id64Args.BigInt]
): number {
  switch (kind) {
    case Id64ArgKind.LowHighObject: return first.low;
    case Id64ArgKind.LowHighArray: return first[1];
    // TODO: there are faster ways to parse this
    case Id64ArgKind.HexString: return parseInt(first.slice(-8), 16);
    case Id64ArgKind.Base64String: {
      const binary = Buffer.from(first, "base64").toString("binary");
      return binaryToUint32(binary.slice());;
    }
    case Id64ArgKind.ByteString: {
    }
    case Id64ArgKind.TwoNumbers:
    case Id64ArgKind.Uint32Array:
    case Id64ArgKind.DoubleAsBuffer:
    case Id64ArgKind.BigInt:
    default: throw Error("unreachable");
  }
}


export declare function getLastHighBits(): number;
