#!/bin/bash

# Set Testing to 1 so that our display script will enter testing mode...
export TESTING=1

pushd examples
mkdir -p Check

echo Starting Rendering Tests > Check/results.txt
pwd >> Check/results.txt

for f in demo*.js ; do
  echo Running $f >> Check/results.txt
  node $f
  if [[ $? -ne 0 ]]; then
    echo Failed $f
    echo Failed $f >> Check/results.txt
    exit 1
  else
    # Remove any of the images that passed so the Artifacts don't have them...
    name=$(echo "${f}" | cut -f 1 -d '.')
    rm Check/${name}*.png
    echo Success $f >> Check/results.txt
  fi
done;

popd
exit 0