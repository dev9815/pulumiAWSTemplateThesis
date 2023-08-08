import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { SrvRecord } from "dns";

class WebAcl{
    public constructor(){}
    public createWebAcl(name: string, resources: any[]){
        const webAcl = new aws.wafv2.WebAcl(name, {
            defaultAction:{
                allow:{}
            },
            scope: "REGIONAL",
            visibilityConfig: {
                cloudwatchMetricsEnabled: false,
                metricName: "davide-manca-webACL-metric",
                sampledRequestsEnabled: false,
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
        resources.push({type: webAcl.urn, name: webAcl.name, id: pulumi.all([webAcl.id, webAcl.name, webAcl.scope]).apply(([id, name, scope]) => id.concat("/").concat(name).concat("/").concat(scope))})
        return webAcl
    }

    public createAssociation(name: string, resourceArn: pulumi.Output<string>, webAclArn: pulumi.Output<string>, resources: any[]){
        const association = new aws.wafv2.WebAclAssociation(name,{
            resourceArn: resourceArn,
            webAclArn: webAclArn
        })
        resources.push({type: association.urn, name: pulumi.output(name), id: association.id})
        return association
    }
}

export {WebAcl}