# fast-cbor

adapted from [atcute's DASL CBOR implementation](https://www.npmjs.com/package/@atcute/cbor), which is licensed under 0BSD.

since we do not need to encode *deterministic* CBOR, we don't need to sort object keys. additionally, there is an ASCII fast-path for encoding small utf-8 strings.
