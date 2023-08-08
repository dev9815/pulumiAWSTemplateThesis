import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

class Eks{
    public constructor(){}
    public securityGroup(name: string, idVpc: pulumi.Output<string>, vpcCidr: pulumi.Output<string>, resources: any[]){
        const sg = new aws.ec2.SecurityGroup(name, {
            description: "EKS and Nodegroup inbound traffic",
            vpcId: idVpc,
            name: name,
            ingress:[
                { 
                    fromPort: 0,
                    toPort: 0,
                    protocol: "-1",
                    cidrBlocks: [vpcCidr]
                },
                {
                    fromPort: 443,
                    toPort: 443,
                    protocol: "tcp",
                    cidrBlocks: [vpcCidr]
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

    public createRole(name: string, resources: any[]){
        const role = new aws.iam.Role(name, {
            //path: "arn:aws:iam::760012763089:role/davide-manca-cluster-instanceRole-role-b5be712",
            name: name,
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [{
                        Action: "sts:AssumeRole",
                        Effect: "Allow",
                        Sid: "",
                        Principal: {
                            Service: [
                                "eks.amazonaws.com",
                                 "ec2.amazonaws.com"
                            ]
                        },
                    }],
            }),
            //ec2fullaccesspolicy
            managedPolicyArns:[
                "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy",
                "arn:aws:iam::aws:policy/AmazonEKSServicePolicy",
                "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
                "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
            ],
            tags:{
                "Name" : name,
                "Project" : "Tesi Manca",
                "Owner" : "Abbaldo",
                "Company" : "Liquid Reply",
                "BU" : "MCI",
                "Environment" : "Tesi",
            }
        })
        resources.push({type: role.urn, name: role.name, id: role.id})
        return role
    }

    public createCluster(name: string, roleArn: pulumi.Output<string>, firstPrivateSubnetId: pulumi.Output<string>, secondPrivateSubnetId: pulumi.Output<string>, idSG: pulumi.Output<string>, resources: any[]){
        const cluster = new aws.eks.Cluster(name,{
            roleArn: roleArn,
            vpcConfig:{
                subnetIds: [firstPrivateSubnetId, secondPrivateSubnetId],
                endpointPrivateAccess: true,
                endpointPublicAccess: false,
                securityGroupIds: [idSG]
            },
            kubernetesNetworkConfig:{
                ipFamily: "ipv4",
                serviceIpv4Cidr: "172.20.0.0/16",
            },
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
        resources.push({type: cluster.urn, name: cluster.name, id: cluster.id})
        return cluster
    }

    
    public createNodeGroup(name: string, clusterId: pulumi.Output<string>, roleArn: pulumi.Output<string>, firstPrivateSubnetId: pulumi.Output<string>, secondPrivateSubnetId: pulumi.Output<string>, instanceType: pulumi.Input<pulumi.Input<string>[]>, nodeGroupName: string, resources: any[]){
        const nodeGroup = new aws.eks.NodeGroup(name, {
            clusterName: clusterId,
            nodeRoleArn: roleArn,
            scalingConfig:{
                desiredSize: 2,
                maxSize: 2,
                minSize: 2
            },
            subnetIds: [firstPrivateSubnetId, secondPrivateSubnetId],
            instanceTypes: instanceType,
            nodeGroupName: nodeGroupName,
            tags:{
                "Name" : name,
                "Project" : "Tesi Manca",
                "Owner" : "Abbaldo",
                "Company" : "Liquid Reply",
                "BU" : "MCI",
                "Environment" : "Tesi",
            },   
        })
        resources.push({type: nodeGroup.urn, name: nodeGroup.nodeGroupName, id: nodeGroup.id})
        return nodeGroup
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
        resources.push({type: scheduleAction.urn, name: scheduleAction.scheduledActionName, id: pulumi.all([scheduleAction.autoscalingGroupName, scheduleAction.scheduledActionName]).apply(([asg, name]) => asg.concat("/").concat(name))})
        return scheduleAction
    }
}

export {Eks}