import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
class BastionHost{
    public constructor(){}
    public securityGroup(name: string, idVpc: pulumi.Output<string>, resources: any[]){
        const sg = new aws.ec2.SecurityGroup(name,{
            description: "Allow inbound traffic",
            name: name,
            vpcId: idVpc,
            ingress:[{ //only reply public IPs can contact this bastion host (only the allowed ones)
                fromPort: 22,
                toPort: 22,
                protocol: "tcp",
                cidrBlocks: [ //cidr: set REPLY addresses
                    "91.218.224.5/32",
                    "91.218.224.15/32",
                    "91.218.226.5/32",
                    "91.218.226.15/32",
                    "93.46.180.242/32",
                    "2.228.86.218/32",
                    "2.228.131.82/32",
                    "93.42.2.218/32",
                    "93.42.115.154/32",
                    "92.223.138.26/32",
                    "92.223.138.174/32",
                    "93.42.131.226/32"
                ]
            }],
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

    
    public instanceTemplate(name: string, idSG: pulumi.Output<string>, resources: any[]){
        const instance = new aws.ec2.LaunchTemplate(name,{
            name: "davide-manca-bastionHost",
            imageId: "ami-00af101624cff9f1a",
            iamInstanceProfile: {
                arn: "arn:aws:iam::760012763089:instance-profile/AmazonSSMRoleForInstancesQuickSetup"
            },
            instanceType: "t3.micro",
            vpcSecurityGroupIds: [idSG],
            tagSpecifications:[{
                resourceType: "instance",
                tags:{
                    "Name" : name,
                    "Project" : "Tesi Manca",
                    "Owner" : "Abbaldo",
                    "Company" : "Liquid Reply",
                    "BU" : "MCI",
                    "Environment" : "Tesi",
                }
            }],
        })
        resources.push({type: instance.urn, name: instance.name, id: instance.id})
        return instance
    }

    public createBastionHost(name: string, firstPublicSubnetId: pulumi.Output<string>, secondPublicSubnetId: pulumi.Output<string>, instanceTemplateId: pulumi.Output<string>, resources: any[]){
        const bh = new aws.autoscaling.Group(name,{
            vpcZoneIdentifiers: [firstPublicSubnetId, secondPublicSubnetId],
            desiredCapacity: 1,
            name: name,
            minSize: 1,
            maxSize: 1,
            launchTemplate:{
                id: instanceTemplateId,
                version: "$Latest",
            },
            terminationPolicies: ["OldestInstance"],
        })
        resources.push({type: bh.urn, name: bh.name, id: bh.id})
        return bh
    }

    public scheduledAction(name: string, action: string, recurrence: string, asName: pulumi.Output<string>, minSize: pulumi.Input<number>, maxSize: pulumi.Input<number>, desiredCapacity: pulumi.Input<number>, resources: any[]){
        const scheduleAction = new aws.autoscaling.Schedule(name,{
            scheduledActionName: action,
            minSize: minSize,
            maxSize: maxSize,
            desiredCapacity: desiredCapacity,
            recurrence: recurrence,
            autoscalingGroupName: asName,
            timeZone: "Europe/Rome"
        })
        
        resources.push({type: scheduleAction.urn, name: pulumi.output(name) , id: pulumi.all([scheduleAction.autoscalingGroupName, scheduleAction.scheduledActionName]).apply(([asg, name]) => asg.concat("/").concat(name))})
        return scheduleAction
    }

}

export {BastionHost}