#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { bastionHostEcsStack } from "../lib/bastionHostEcsStack";

const app = new cdk.App();
new bastionHostEcsStack(app, "generalStoreEcsStack", {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
    vpcId: "vpc-ce6136aa",
    securityGroupIds: ["sg-fbd13083", "sg-0ed13076"],
    prefix: "general-store-",
});

new bastionHostEcsStack(app, "floodPipelineEcsStack", {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
    vpcId: "vpc-04d6e2bfb2165efca",
    securityGroupIds: ["sg-0ad23e749ed9017aa", "sg-0d8c2bc37a7fcc5e4"],
    prefix: "flood-pipeline-",
});
