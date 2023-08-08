#!/bin/bash
arg=$1
if [ ! -n "$1" ]; then
	arg="aws-infrastructure-from-template"
fi
if [ ! -d "./${arg}" ]; then
	#!/bin/bash

	# Read the JSON data from the file and update each name using jq
	#jq 'map(.name |= "i" + .)' async-resources.json > temp.json

	# Replace the original file with the modified content
	#mv temp.json async-resources.json
#!/bin/bash

# Use sed to update the names in the JSON file
	#sed -i 's/"name": "\(.*\)"/"name": "i\1"/g' sync-resources.json
	#sed -i 's/"name": "\(.*\)"/"name": "i\1"/g' async-resources.json
	
	
	
	mkdir $arg && cd $arg
	#pulumi new azure-typescript --stack imported-resources-stack
	mkdir infrastructure
	pulumi import --file ../resources.json --protect=false --stack import-resources --yes --out ./infrastructure/index.ts
	#location=$(grep "azure-native:location" Pulumi.imported-resources-stack.yaml | sed -n 's/^[[:space:]]*azure-native:location:[[:space:]]*//p')
	#sed -i "s/eu-south-1/eu-north-1/g" ./infrastructure/index.ts
	#npm install --save @pulumi/azure
	#npm install --save @pulumi/azuread
	#cp Pulumi.imported-resources-stack.yaml Pulumi.async-resources-stack.yaml
	#cp Pulumi.imported-resources-stack.yaml Pulumi.sync-resources-stack.yaml
	#rm -f index.ts
	#for ((i = 0;i < length; i++ )); 
	#do
	#	pulumi stack init "${stacks[$i]}"
	#	pulumi stack select "${stacks[$i]}"
	#	cp "${folders[$i]}"/index.ts .
	#	specific_string="i"
	#	#sed -E -i "s/([a-zA-Z0-9_]*name[a-zA-Z0-9_]*\s*:\s*)\"([^\"]*)\"/\1\"${specific_string}\2\"/g" index.ts
		
		#sed -E -i "s/(\s*.*name.*:\s*\")([^\"]*)(\".*)/\1${specific_string}\2\3/g" index.ts
	#	sed -i '/{/{:a;N;/}/!ba;s/\([a-zA-Z0-9_]*name[a-zA-Z0-9_]*[[:space:]]*:[[:space:]]*"\)/\1'"${specific_string}"'/gi' index.ts
	#	pulumi up --yes --stack "${stacks[$i]}"
	#	rm -f index.ts
	#done
	#cd ../async-resources && pulumi up --yes --stack async-resources-stack
else
	echo "Run again this script by changing the folder name where to create the infrastructure from import"
fi