import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

class LoadBalancer{
    public constructor(){}
    public securityGroup(name: string, idVpc: pulumi.Output<string>, resources: any[]){
        const sg = new aws.ec2.SecurityGroup(name,{
            description: "LoadBalancer inbound traffic",
            name: name,
            vpcId: idVpc,
            ingress:[
                { 
                    fromPort: 80,
                    toPort: 80,
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
                },
                { 
                    fromPort: 31803,
                    toPort: 31803,
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
                },
                {
                    fromPort: 443,
                    toPort: 443,
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
                }
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

    public createLoadBalancer(name: string, lbPort: number, lbProtocol: string, idSG: pulumi.Output<string>, firstPublicSubnetId: pulumi.Output<string>, secondPublicSubnetId: pulumi.Output<string>, resources: any[]){
        const lb = new aws.lb.LoadBalancer(name,{
            internal: false,
            loadBalancerType: "application",
            securityGroups:[idSG],
            subnets:[firstPublicSubnetId, secondPublicSubnetId],
            name: name,
            tags:{
                "Name" : name,
                "Project" : "Tesi Manca",
                "Owner" : "Abbaldo",
                "Company" : "Liquid Reply",
                "BU" : "MCI",
                "Environment" : "Tesi",
            }
        })
        resources.push({type: lb.urn, name: lb.name, id: lb.id})
        return lb
    }

    public createTargetGroup(name: string, idVpc: pulumi.Output<string>, port: number, protocol: string, targetType: string, resources: any[]){
        return new aws.lb.TargetGroup(name, {
            vpcId: idVpc,
            port: port,
            protocol: protocol,
            targetType: targetType,
            name: name,
            tags:{
                "Name" : name,
                "Project" : "Tesi Manca",
                "Owner" : "Abbaldo",
                "Company" : "Liquid Reply",
                "BU" : "MCI",
                "Environment" : "Tesi",
            }
        })
    }

    public createListener(name: string, tg: pulumi.Output<string>, lbArn: pulumi.Output<string>, port: number, protocol: string, resources: any[]){
        const listener = new aws.lb.Listener(name,{
            loadBalancerArn: lbArn,
            defaultActions:[{
                type: "forward",
                targetGroupArn: tg
            }],
            port: port,
            protocol: protocol,
            tags:{
                "Name" : name,
                "Project" : "Tesi Manca",
                "Owner" : "Abbaldo",
                "Company" : "Liquid Reply",
                "BU" : "MCI",
                "Environment" : "Tesi",
            }
        })
        resources.push({type: listener.urn, name: pulumi.output(name), id: listener.id})
        return listener
    }

    public createAttachment(name: string, autoscalingGroupName: pulumi.Output<string>, lbTargetGroupArn: pulumi.Output<string>, resources: any[]){
        return new aws.autoscaling.Attachment(name,{
            autoscalingGroupName: autoscalingGroupName,
            lbTargetGroupArn: lbTargetGroupArn
        })
    }
}

export {LoadBalancer}