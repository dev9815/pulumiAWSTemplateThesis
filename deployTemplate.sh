#!/bin/bash
arg=$1
arg2=$2
if [ ! -n "$1" ]; then
	arg="dev"
fi
if [ ! -n "$2" ]; then
	arg2="aws-infrastructure-from-template"
fi
if [ ! -d $arg2 ]; then
	mkdir $arg2 && cd $arg2
	pulumi new https://github.com/dev9815/pulumiAWSTemplateThesis.git --stack $arg
	sed -i 's/\r//g' destroyInfrastructure.sh
	sed -i 's/\r//g' createInfrastructure.sh && . ./createInfrastructure.sh $arg
else
	echo "Change the folder name and run again this script"
fi
