# proto

Packet definitions and codecs for Dreamlab network protocols. Networking is built on WebSockets.

Protocols:
- `play`
- `edit`
- `log-streaming`

## Codecs

- We should be able to choose a codec when connecting, which is used for the entire connection.
This lets us use a thin binary format in production for bandwidth efficiency,
while retaining the option of connecting via JSON (even in production!) for human readability.
- But at present, we only have a JSON codec.
