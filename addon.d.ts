

declare module "build/Debug/addon" {
  enum Id64ArgKind {
    LowHighObject = "low-high-object",
    LowHighArray = "low-high-array",
    HexString = "hex-string",
    Base64String = "base64-string",
    ByteString = "byte-string",
    TwoNumbers = "two-numbers",
    Uint32Array = "uint32array",
    DoubleAsBuffer = "double-as-buffer",
    BigInt = "bigint",
  }
  namespace Id64Arg {
    type LowHighObject = [{ low: number, high: number }];
    type LowHighArray = [[ low: number, high: number ]];
    type HexString = [string];
    type Base64String = [string];
    type ByteString = [string];
    type TwoNumbers = [number, number];
    type Uint32Array = [Uint32Array];
    type DoubleAsBuffer = [number];
    type BigInt = [bigint];
  }
  export function getNeighbors(kind: Id64ArgKind.LowHighObject,  ...id: Id64Arg.LowHighObject):  Id64Arg.LowHighObject[];
  export function getNeighbors(kind: Id64ArgKind.LowHighArray,   ...id: Id64Arg.LowHighArray):   Id64Arg.LowHighArray[];
  export function getNeighbors(kind: Id64ArgKind.HexString,      ...id: Id64Arg.HexString):      Id64Arg.HexString[];
  export function getNeighbors(kind: Id64ArgKind.Base64String,   ...id: Id64Arg.Base64String):   Id64Arg.Base64String[];
  export function getNeighbors(kind: Id64ArgKind.ByteString,     ...id: Id64Arg.ByteString):     Id64Arg.ByteString[];
  export function getNeighbors(kind: Id64ArgKind.TwoNumbers,     ...id: Id64Arg.TwoNumbers):     Id64Arg.TwoNumbers[];
  export function getNeighbors(kind: Id64ArgKind.Uint32Array,    ...id: Id64Arg.Uint32Array):    Id64Arg.Uint32Array[];
  export function getNeighbors(kind: Id64ArgKind.DoubleAsBuffer, ...id: Id64Arg.DoubleAsBuffer): Id64Arg.DoubleAsBuffer[];
  export function getNeighbors(kind: Id64ArgKind.BigInt,         ...id: Id64Arg.BigInt):         Id64Arg.BigInt[];

  export function getLastHighBits(): number;
}