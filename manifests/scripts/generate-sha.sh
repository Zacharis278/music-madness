#!/bin/bash
set -e

# Capture the SHA of the built client content
SHA=`find ./bracket -type f -print0 | xargs -0 shasum | shasum`

# Return as JSON
echo "{\"sha\": \"$SHA\"}"