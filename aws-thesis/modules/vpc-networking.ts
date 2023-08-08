import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
class VpcNetworking {
    public constructor(){}
    public createVpc(vpcName: string, vpcNetworkCidr: string, resources: any[]){
        const vpc = new aws.ec2.Vpc(vpcName,{
            cidrBlock: vpcNetworkCidr,
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: {
                "Name": vpcName,
                "Project" : "Tesi Manca",
                "Owner" : "Abbaldo",
                "Company" : "Liquid Reply",
                "BU" : "MCI",
                "Environment" : "Tesi",
            }
        })
        resources.push({type: vpc.urn, name: pulumi.output(vpcName), id: vpc.id})
        return vpc
    }

    public createSubnet(subnetName: string, subnetCidr: string, idVpc: pulumi.Output<string>, az: string, ipType: boolean, resources: any[]){
        const subnet = new aws.ec2.Subnet(subnetName,{
            vpcId: idVpc,
            cidrBlock: subnetCidr,
            mapPublicIpOnLaunch: ipType,
            availabilityZone: az,
            tags:{
                "Name" : subnetName,
                "Project" : "Tesi Manca",
                "Owner" : "Abbaldo",
                "Company" : "Liquid Reply",
                "BU" : "MCI",
                "Environment" : "Tesi",
            }
        })
        resources.push({type: subnet.urn, name: pulumi.output(subnetName), id: subnet.id})
        return subnet
        
    }

    public createInternetGateway(name: string, idVpc: pulumi.Output<string>, resources: any[]){
        const ig = new aws.ec2.InternetGateway(name, {
            vpcId: idVpc,
            tags:{
                "Name" : "davide-manca-internet-gateway",
                "Project" : "Tesi Manca",
                "Owner" : "Abbaldo",
                "Company" : "Liquid Reply",
                "BU" : "MCI",
                "Environment" : "Tesi",
            }
        });
        resources.push({type: ig.urn, name: pulumi.output(name), id: ig.id})
        return ig
    }

    public createEip(nameEip: string, resources: any[]){
        const eip = new aws.ec2.Eip(nameEip,{
            vpc: true,
            tags:{
                "Name" : nameEip,
                "Project" : "Tesi Manca",
                "Owner" : "Abbaldo",
                "Company" : "Liquid Reply",
                "BU" : "MCI",
                "Environment" : "Tesi",
            }
        })
        resources.push({type: eip.urn, name: pulumi.output(nameEip), id: eip.id})
        return eip
    }

    public createNatGateway(name: string, eipAllocationId: pulumi.Output<string>, subnetId: pulumi.Output<string>, resources: any[]){
        const nat = new aws.ec2.NatGateway(name,{
            allocationId: eipAllocationId,
            subnetId: subnetId,
            tags:{
                "Name" : name,
                "Project" : "Tesi Manca",
                "Owner" : "Abbaldo",
                "Company" : "Liquid Reply",
                "BU" : "MCI",
                "Environment" : "Tesi",
            }
        })
        resources.push({type: nat.urn, name: pulumi.output(name), id: nat.id})
        return nat
    }

    public createRouteTable(name: string, idVpc: pulumi.Output<string>, idGateway: pulumi.Output<string>, resources: any[]){
        const routeTable = new aws.ec2.RouteTable(name, {
            vpcId: idVpc,
            routes: [
                {
                    cidrBlock: "0.0.0.0/0",
                    gatewayId: idGateway,
                }
            ],
            tags:{
                "Name" : name,
                "Project" : "Tesi Manca",
                "Owner" : "Abbaldo",
                "Company" : "Liquid Reply",
                "BU" : "MCI",
                "Environment" : "Tesi",
            }
        });
        resources.push({type: routeTable.urn, name: pulumi.output(name), id: routeTable.id})
        return routeTable
    }

 
   
    public subnetAssociation(name: string, SubnetId: pulumi.Output<string>, idRouteTable: pulumi.Output<string>, resources: any[]){
        const association = new aws.ec2.RouteTableAssociation(name,{
            subnetId: SubnetId,
            routeTableId: idRouteTable,
        })
        resources.push({type: association.urn, name: pulumi.output(name), id: pulumi.all([association.subnetId, association.routeTableId]).apply(([asg, name]) => asg!.concat("/").concat(name))})
        return association
    }

    
}

export {VpcNetworking}