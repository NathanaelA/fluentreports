#!/bin/bash

# Set Testing to True
TESTING=true

pushd examples

echo Starting Rendering Tests > /tmp/results.txt
# Run all the test
for f in demo*.js ; do
  node $f
  if [[ ! $? -eq 0 ]]; then
    echo Failed $f
    echo Failed $f >> /tmp/results.txt
    exit 1
  fi
done;

popd
exit 0