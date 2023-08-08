import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

class Lambda{
    public constructor(){}

    public createRole(name: string, resources: any[]){
        const role = new aws.iam.Role(name, {
            name: name,
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "sts:AssumeRole",
                        Principal: {
                            Service: "lambda.amazonaws.com",
                        },
                        Effect: "Allow",
                    },
                ],
            }),
        });
        resources.push({type: role.urn, name: role.name, id: role.name})
        return role
    }

    public createPolicy(name: string, resources: any[]){
        const policy = new aws.iam.Policy(name, {
            name: name,
            policy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {           
                        Effect: "Allow",
                        Action: [
                            "rds:DescribeDBInstances",
                            "rds:StopDBInstance",
                            "rds:StartDBInstance"
                        ],
                        Resource: "*"
                    },
                    {
                        Effect: "Allow",
                        Action: [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        Resource: "*"
                    }
                ]
            }),
        });
        resources.push({type: policy.urn, name: policy.name, id: policy.id})
        return policy
    }

    public createAttachment(name: string, policyArn: pulumi.Output<string>, role: pulumi.Output<string>, resources: any[]){
        const attachment = new aws.iam.RolePolicyAttachment(name, {
            policyArn: policyArn,
            role: role,
        });   
        resources.push({type: attachment.urn, name: pulumi.output(name), id: pulumi.all([attachment.role, attachment.policyArn]).apply(([role, policy]) => role.concat("/").concat(policy))})
        return attachment
    }

    public createLambdaFunction(name: string, role: pulumi.Output<string>, action: string, instanceId: pulumi.Output<string>, resources: any[]){
        let lambda: aws.lambda.Function;
        if (action === "start") {
            lambda = new aws.lambda.Function(name, {
                role: role,
                name: name,
                handler: "index.handler",
                runtime: aws.lambda.Runtime.NodeJS14dX,
                environment: {
                    variables: {
                        DB_INSTANCE_IDENTIFIER: instanceId,//rds.id.apply(id => id),
                    },
                },
                code: new pulumi.asset.AssetArchive({
                    "index.js": new pulumi.asset.StringAsset(`
                        const AWS = require("aws-sdk");
                        const rds = new AWS.RDS({region: "eu-south-1"});
            
                        exports.handler = async (event) => {
                            const params = {
                                DBInstanceIdentifier: process.env.DB_INSTANCE_IDENTIFIER,
                            };
                            return rds.startDBInstance(params).promise();
                        };
                    `),
                }),
            });
        }else{
            lambda = new aws.lambda.Function(name, {
                role: role,
                name: name,
                handler: "index.handler",
                runtime: aws.lambda.Runtime.NodeJS14dX,
                environment: {
                    variables: {
                        DB_INSTANCE_IDENTIFIER: instanceId,//rds.id.apply(id => id),
                    },
                },
                code: new pulumi.asset.AssetArchive({
                    "index.js": new pulumi.asset.StringAsset(`
                        const AWS = require("aws-sdk");
                        const rds = new AWS.RDS({region: "eu-south-1"});
            
                        exports.handler = async (event) => {
                            const params = {
                                DBInstanceIdentifier: process.env.DB_INSTANCE_IDENTIFIER,
                            };
                            return rds.stopDBInstance(params).promise();
                        };
                    `),
                }),
            });
        }
        resources.push({type: lambda.urn, name: lambda.name, id: lambda.id})
        return lambda
    }

    public scheduleAction(name: string, time: string, resources: any[]){
        const action = new aws.cloudwatch.EventRule(name, {
            scheduleExpression: time,
            name: name
        });
        resources.push({type: action.urn, name: action.name, id: action.id})
        return action
    }

    public createEventTarget(name: string, rule: pulumi.Output<string>, lambdaArn: pulumi.Output<string>, resources: any[]){
        const eventTarget = new aws.cloudwatch.EventTarget(name, {
            rule: rule,
            arn: lambdaArn,
        });
        resources.push({type: eventTarget.urn, name: pulumi.output(name), id: pulumi.all([eventTarget.eventBusName, eventTarget.rule, eventTarget.targetId]).apply(([busName, ruleName, targetId]) => busName!.concat("/").concat(ruleName).concat("/").concat(targetId))})
        return eventTarget
    }

    public createPermission(name: string, action: string, principal: string, sourceArn: pulumi.Output<string>, func: pulumi.Output<string>, resources: any[]){
        const permission = new aws.lambda.Permission(name, {
            action: action,
            principal: principal,
            sourceArn: sourceArn,
            function: func,
        });        
        resources.push({type: permission.urn, name: pulumi.output(name), id: pulumi.all([permission.function, permission.statementId]).apply(([func, statementId]) => func.concat("/").concat(statementId))})
        return permission
    }
}

export {Lambda}