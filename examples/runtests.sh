#!/bin/bash

# Set Testing to True
TESTING=true

pushd examples

echo Starting Rendering Tests > /tmp/results.txt
pwd >> /tmp/results.txt

# Run all the test
for f in demo*.js ; do
  echo Running $f >> /tmp/results.txt
  node $f
  if [[ ! $? -eq 0 ]]; then
    echo Failed $f
    echo Failed $f >> /tmp/results.txt
    exit 1
  else
    echo Success $f >> /tmp/results.txt
  fi
done;

popd
exit 0