#!/bin/bash
# Poll clipboard for file URIs using xclip (example)
while true; do
    files=$(xclip -selection clipboard -o -t TARGETS 2>/dev/null)
    # Convert URI_LIST to file paths if needed
    sleep 1
done