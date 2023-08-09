import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

import {VpcNetworking} from './modules/vpc-networking';
import {BastionHost} from './modules/bastionhost';
import {Eks} from './modules/eks';
import {LoadBalancer} from './modules/loadbalancer';
import {RDS} from './modules/rds';
import {Repository} from './modules/respository';
import {WebAcl} from './modules/webAcl';
import {Lambda} from './modules/lambda';
import {JsonForImport} from "./modules/jsonForImport"

const config = new pulumi.Config();
const vpcNetworkCidr = config.require("vpcNetworkCidr");
const vpcName = config.require("vpcName");
const firstPublicSubnetName = config.require("firstPublicSubnetName");
const secondPublicSubnetName = config.require("secondPublicSubnetName");
const firstPrivateSubnetName = config.require("firstPrivateSubnetName");
const secondPrivateSubnetName = config.require("secondPrivateSubnetName");
const firstPublicSubnetCidr = config.require("firstPublicSubnetCidr");
const secondPublicSubnetCidr = config.require("secondPublicSubnetCidr");
const firstPrivateSubnetCidr = config.require("firstPrivateSubnetCidr");
const secondPrivateSubnetCidr = config.require("secondPrivateSubnetCidr");
const stackResources: any[] = []
const listResourcesInfo: any[] = []

//---------------------------------VPC & NETWORKING PART -----------------------------------------------------------
if(pulumi.getStack() !== "import-resources"){
    const networking = new VpcNetworking();
    const vpc = networking.createVpc(vpcName, vpcNetworkCidr, stackResources);
    const firstPublicSubnet = networking.createSubnet(firstPublicSubnetName, firstPublicSubnetCidr, vpc.id, "eu-south-1a", true, stackResources);
    const secondPublicSubnet = networking.createSubnet(secondPublicSubnetName, secondPublicSubnetCidr, vpc.id, "eu-south-1b", true, stackResources);
    const firstPrivateSubnet = networking.createSubnet(firstPrivateSubnetName, firstPrivateSubnetCidr, vpc.id, "eu-south-1a", false, stackResources);
    const secondPrivateSubnet = networking.createSubnet(secondPrivateSubnetName, secondPrivateSubnetCidr, vpc.id, "eu-south-1b", false, stackResources);
    const internetGateway = networking.createInternetGateway("davide-manca-internet-gateway", vpc.id, stackResources);
    const firstEip = networking.createEip("davide-manca-first-eip", stackResources);
    const secondEip = networking.createEip("davide-manca-second-eip", stackResources);
    const firstNatGateway = networking.createNatGateway("davide-manca-firstNatGateway", firstEip.id, firstPublicSubnet.id, stackResources);
    const secondNatGateway = networking.createNatGateway("davide-manca-secondNatGateway", secondEip.id, secondPublicSubnet.id, stackResources);
    const publicRouteTable = networking.createRouteTable("davide-manca-public-routeTable", vpc.id, internetGateway.id, stackResources);
    const firstPrivateRouteTable = networking.createRouteTable("davide-manca-private-routeTable-1", vpc.id, firstNatGateway.id, stackResources);
    const secondPrivateRouteTable = networking.createRouteTable("davide-manca-private-routeTable-2", vpc.id, secondNatGateway.id, stackResources);
    networking.subnetAssociation("davide-manca-public-association-1", firstPublicSubnet.id, publicRouteTable.id, stackResources);
    networking.subnetAssociation("davide-manca-public-association-2", secondPublicSubnet.id, publicRouteTable.id, stackResources);
    networking.subnetAssociation("davide-manca-private-association-1", firstPrivateSubnet.id, firstPrivateRouteTable.id, stackResources);
    networking.subnetAssociation("davide-manca-private-association-2", secondPrivateSubnet.id, secondPrivateRouteTable.id, stackResources);


    //-----------------------------------BASTION HOST PART ---------------------------------------------------------
    const bastionHost = new BastionHost();
    const securityGroup = bastionHost.securityGroup("davide-manca-bastion-host-SG", vpc.id, stackResources)
    const instanceTemplate = bastionHost.instanceTemplate("davide-manca-bastionHost", securityGroup.id, stackResources)
    const autoscalingGroup = bastionHost.createBastionHost("davide-manca-autoscaling-group", firstPublicSubnet.id, secondPublicSubnet.id, instanceTemplate.id, stackResources)
    bastionHost.scheduledAction("davide-manca-bastionhost-autoscaling-booting", "booting", "0 9 * * 1-5", autoscalingGroup.name, 1, 1, 1, stackResources)
    bastionHost.scheduledAction("davide-manca-bastionhost-autoscaling-shutdown", "shutdown", "0 19 * * 1-5", autoscalingGroup.name, 0, 0, 0, stackResources)

    //---------------------------------------------------------- EKS PART ---------------------------------------------------------------------------
    const eks = new Eks();
    const nodeGroupSG = eks.securityGroup("davide-manca-nodegroup-mySG", vpc.id, vpc.cidrBlock, stackResources)
    const role = eks.createRole("davide-manca-cluster-Role", stackResources)
    const eksCluster = eks.createCluster("davide-manca-cluster", role.arn, firstPrivateSubnet.id, secondPrivateSubnet.id, nodeGroupSG.id, stackResources)
    const eksNodeGroup = eks.createNodeGroup("davide-manca-eksNodegroup", eksCluster.name, role.arn, firstPrivateSubnet.id, secondPrivateSubnet.id, ["t3.micro"], "davide-manca-eksNodegroup", stackResources)
    eks.scheduledAction("davide-manca-eksNodegroup-autoscaling-booting", "nodegroup-booting", "0 9 * * 1-5", eksNodeGroup.resources[0].autoscalingGroups[0].name, 2,2,2, stackResources)
    eks.scheduledAction("davide-manca-eksNodegroup-autoscaling-shutdown", "nodegroup-shutdown", "0 19 * * 1-5", eksNodeGroup.resources[0].autoscalingGroups[0].name, 0, 0, 0, stackResources)
    //------------------------------------------------- APPLICATION LOAD BALANCER ------------------------------------------------------------
    const lb = new LoadBalancer();
    const loadBalancerSG = lb.securityGroup("davide-manca-loadBalancer-SG", vpc.id, stackResources);
    const targetGroup = lb.createTargetGroup("davide-manca-targetGroup", vpc.id, 31803, "HTTP", "instance", stackResources)
    const loadBalancer = lb.createLoadBalancer("davide-manca-lb", 80, "HTTP", loadBalancerSG.id, firstPublicSubnet.id, secondPublicSubnet.id, stackResources)
    const listener = lb.createListener("davide-manca-listener", targetGroup.arn, loadBalancer.arn, 80, "HTTP", stackResources)
    const asgTargetGroupAttachment = lb.createAttachment("davide-manca-targetgroupattach", eksNodeGroup.resources[0].autoscalingGroups[0].name, targetGroup.arn, stackResources)

    //----------------------------------------------- RDS DATABASE ---------------------------------------------------------------------------------
    const rds = new RDS();
    const rdsSG = rds.securityGroup("davide-manca-rds-SG", vpc.id, 5432, 5432, vpc.cidrBlock, stackResources)
    const dbSubnetGroupName = rds.createSubnetGroup("davide-manca-subnetgroup", firstPrivateSubnet.id, secondPrivateSubnet.id, stackResources)
    const rdsInstance = rds.createInstance("davidemancardsdb", "db.t3.micro" , "davidemancapostgresqldb", "postgres", "eu-south-1a", rdsSG.id, "davidemanca", "davidemanca", 5432, dbSubnetGroupName.name, stackResources)

    // ----------------------------------------------- REPOSITORY ------------------------------------------------------------------------------------

    const repository = new Repository();
    const ecr = repository.createRepository("davide-manca-ecr", stackResources)

    // ------------------------------------------------- WEBACL ----------------------------------------------------------------------------------
    const webAccessControlList = new WebAcl();
    const webACL = webAccessControlList.createWebAcl("davide-manca-webACL", stackResources)
    const webACLAssociation = webAccessControlList.createAssociation("davide-manca-webACLassociation", loadBalancer.arn, webACL.arn, stackResources)

    //---------------------------------- LAMBDA FUNCTION  ----------------------------------------------------------------------------
    const rdsLambda = new Lambda();
    const lambdaRole = rdsLambda.createRole("davide-manca-lambda-role", stackResources)
    const lambdaPolicy = rdsLambda.createPolicy("davide-manca-lambda-policy", stackResources)
    const lambdaRolePolicyAttachment = rdsLambda.createAttachment("davide-manca-lambda-attachment", lambdaPolicy.arn, lambdaRole.name, stackResources)
    const startRDSInstance = rdsLambda.createLambdaFunction("davide-manca-startLambda", lambdaRole.arn, "start", rdsInstance.id.apply(id => id), stackResources)
    const stopRDSInstance = rdsLambda.createLambdaFunction("davide-manca-stopLambda", lambdaRole.arn, "stop", rdsInstance.id.apply(id => id), stackResources)
    const startRule = rdsLambda.scheduleAction("davide-manca-startRDS-rule", "cron(0 7 ? * MON-FRI *)", stackResources)
    const stopRule = rdsLambda.scheduleAction("davide-manca-stopRDS-rule", "cron(0 17 ? * MON-FRI *)", stackResources)
    const startEventTarget = rdsLambda.createEventTarget("davide-manca-startRDS-eventTarget", startRule.name, startRDSInstance.arn, startRule, stackResources)
    const stopEventTarget = rdsLambda.createEventTarget("davide-manca-stopRDS-eventTarget", stopRule.name, stopRDSInstance.arn, stopRule, stackResources)
    const startPermission = rdsLambda.createPermission("davide-manca-permission-startRule","lambda:InvokeFunction", "events.amazonaws.com", startRule.arn,startRDSInstance.id, stackResources)
    const stopPermission = rdsLambda.createPermission("davide-manca-permission-stopRule","lambda:InvokeFunction", "events.amazonaws.com", stopRule.arn, stopRDSInstance.id, stackResources)

    //------------------------------------------ Writing infrastructure on json file for future importing -----------------------------------------------
    const writeJson = new JsonForImport()
    writeJson.infrastructureToJson(stackResources, listResourcesInfo, "./import/resources.json")
}
