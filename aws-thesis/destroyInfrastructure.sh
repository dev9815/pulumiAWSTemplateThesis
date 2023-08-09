#!/bin/bash
arg=$1
stacks=("$arg" "import-resources")
if [ ! -n "$1" ]; then
	echo "You must provide the name of the stack to operate on"
else
	for stack in "${stacks[@]}"
	do
		echo "Destroying Stack: $stack"
		pulumi stack select $stack
		pulumi destroy --yes
	done
	if [ -e ./import/resources.json ]; then
		rm -f ./import/resources.json
	fi
fi
