import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

class RDS{
    public constructor(){}
    public securityGroup(name: string, idVpc: pulumi.Output<string>, ingressFromPort: number, ingressToPort: number, vpcCidrBlock: pulumi.Output<string>, resources: any[]){
        const sg = new aws.ec2.SecurityGroup(name, {
            description: "RDS inbound traffic",
            vpcId: idVpc,
            name: name,
            ingress:[
                { 
                    fromPort: ingressFromPort,
                    toPort: ingressToPort,
                    protocol: "tcp",
                    cidrBlocks: [vpcCidrBlock]
                },
                
            ],
            egress: [{
                fromPort: 0,
                toPort: 0,
                protocol: "-1",
                cidrBlocks: ["0.0.0.0/0"],
                ipv6CidrBlocks: ["::/0"],
            }],
            tags:{
                "Name" : name,
                "Project" : "Tesi Manca",
                "Owner" : "Abbaldo",
                "Company" : "Liquid Reply",
                "BU" : "MCI",
                "Environment" : "Tesi",
            }
        })       
        resources.push({type: sg.urn, name: sg.name, id: sg.id})
        return sg
    }

    public createSubnetGroup(name: string, firstPrivateSubnetId: pulumi.Output<string>, secondPrivateSubnetId: pulumi.Output<string>, resources: any[]){
        const subnetGroup = new aws.rds.SubnetGroup(name ,{
            subnetIds:[firstPrivateSubnetId, secondPrivateSubnetId],
            name: "davide-manca-subnetgroup",
            tags:{
                "Name" : name,
                "Project" : "Tesi Manca",
                "Owner" : "Abbaldo",
                "Company" : "Liquid Reply",
                "BU" : "MCI",
                "Environment" : "Tesi",
            }
        })
        resources.push({type: subnetGroup.urn, name: subnetGroup.name, id: subnetGroup.id})
        return subnetGroup
    }

    public createInstance(
        name: string, 
        instanceClass: string,
        dbName: string,
        engine: string,
        az: string,
        idSG: pulumi.Output<string>,
        username: string, 
        password: string, 
        port: number,
        subnetGroupName: pulumi.Output<string>,
        resources: any[]
    ){
        const db = new aws.rds.Instance(name ,{
            instanceClass: instanceClass,
            allocatedStorage: 20,
            dbName: dbName,
            engine: engine,
            skipFinalSnapshot: true,
            availabilityZone: az,
            vpcSecurityGroupIds:[idSG],
            username: username,
            password: password,
            port: port,
            dbSubnetGroupName: subnetGroupName,
            tags:{
                "Name" : name,
                "Project" : "Tesi Manca",
                "Owner" : "Abbaldo",
                "Company" : "Liquid Reply",
                "BU" : "MCI",
                "Environment" : "Tesi",
            }
        })
        resources.push({type: db.urn, name: db.name, id: db.id})
        return db
    }
}

export {RDS}