#!/bin/bash

# Set Testing to True
export TESTING=1

pushd examples
mkdir -p Check

echo Starting Rendering Tests > Check/results.txt
pwd >> Check/results.txt

# Run all the test
node demo06
node demo09
if [[ $? -ne 0 ]]; then
  ls Check/
  echo -----
  ls /home/runner/work/fluentreports/fluentreports/examples/Check/
   echo Failed demo9
   echo Failed demo9 >> Check/results.txt
   exit 1
fi

#for f in demo*.js ; do
#  echo Running $f >> Check/results.txt
#  node $f
#  if [[ $? -ne 0 ]]; then
#    echo Failed $f
#    echo Failed $f >> Check/results.txt
#    exit 1
#  else
#    echo Success $f >> Check/results.txt
#  fi
#done;

popd
exit 0