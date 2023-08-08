#!/bin/bash
arg=$1
if [ ! -n "$1" ]; then
	echo "You must provide the name of the stack to operate on"
else
	if [ ! -e "./Pulumi.import-resources.yaml" ] ; then
		find . -maxdepth 1 -type f -name "Pulumi.*.yaml" -exec cp {} Pulumi.import-resources.yaml \;
		pulumi stack init import-resources
	fi
	echo "Deploying Stack $arg"
	pulumi stack select $arg
	pulumi up --yes
fi