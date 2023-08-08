import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

class Repository{
    public constructor(){}
    public createRepository(name: string, resources: any[]){
        const repository = new aws.ecr.Repository(name,{
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
        resources.push({type: repository.urn, name: repository.name, id: repository.id})
        return repository
    }
}

export {Repository}