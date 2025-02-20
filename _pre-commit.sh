#!/usr/bin/env sh

FILES=$(git diff --cached --name-only --diff-filter=ACMR | sed 's| |\\ |g')
[ -z "$FILES" ] && exit 0

exec echo "$FILES" | xargs deno task format:base --check
