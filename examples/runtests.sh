#!/bin/bash

# Set Testing to True
TESTING=true

pushd examples

# Run all the test
for f in demo*.js ; do
  node $f
  if [[ ! $? -eq 0 ]]; then
    echo Failed $f
    exit 1
  fi
done;

popd
exit 0