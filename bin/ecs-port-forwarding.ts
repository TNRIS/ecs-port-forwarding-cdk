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

// new bastionHostEcsStack(app, "acaSandboxEcsStack", {
//     vpcId: "vpc-072c5d454f0933740",
//     securityGroupIds: [
//         "sg-00695cfc74b4861a3",
//         "sg-01458088b69ab81b4",
//         "sg-0e9d027d4abee958d",
//     ],
//     prefix: "general-store-",
//     env: {
//         account: "050451380066",
//         region: "us-east-2",
//     },
//     synthesizer: new cdk.DefaultStackSynthesizer({
//         qualifier: "dir-59fds",
//     }),
// });
