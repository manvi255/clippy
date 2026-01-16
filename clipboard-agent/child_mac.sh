#!/bin/bash
# Poll clipboard for file URLs using AppleScript
while true; do
    files=$(osascript -e 'try
        tell application "Finder"
            set theFiles to the selection as alias list
            set thePaths to {}
            repeat with f in theFiles
                set end of thePaths to POSIX path of f
            end repeat
        end tell
        return thePaths
    end try')
    echo "$files"
    sleep 1
done
