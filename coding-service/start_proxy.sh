CONFIG_PATH="$(pwd)/nginx-for-coding-and-also-proxies-multiplayer.conf" && nginx -c "$CONFIG_PATH" -s stop 2>/dev/null || true && nginx -c "$CONFIG_PATH"
