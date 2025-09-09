import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as logs from "aws-cdk-lib/aws-logs";

interface EcsStackProps extends cdk.StackProps {
    vpcId: string;
    securityGroupIds: string[];
    prefix: string;
}

export class bastionHostEcsStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: EcsStackProps) {
        super(scope, id, props);

        // Create a VPC with public subnets only and 2 max availability zones
        const vpc = ec2.Vpc.fromLookup(this, "tnrisVpc", {
            vpcId: props.vpcId,
        });

        // Define a security group for your Fargate service
        const securityGroups: ec2.ISecurityGroup[] = [];

        props.securityGroupIds.forEach((id) => {
            securityGroups.push(
                ec2.SecurityGroup.fromLookupById(this, "SecGroup" + id, id)
            );
        });

        // Create an ECS Cluster named prefix + "bastion-host-cluster"
        const cluster = new ecs.Cluster(this, "BastionHostCluster", {
            vpc,
            clusterName: props.prefix + "bastion-host-cluster",
            containerInsightsV2: ecs.ContainerInsights.ENABLED,
        });

        // Define the execution role for the ECS task
        const executionRole = new iam.Role(this, "MyExecutionRole", {
            assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            // Add any additional permissions or policies as needed
        });

        // Define the task definition with the container image
        const taskDefinition = new ecs.FargateTaskDefinition(
            this,
            props.prefix + "TaskDefinition",
            {
                memoryLimitMiB: 512,
                cpu: 256,
                executionRole: executionRole, // Assign the execution role to the task definition
            }
        );

        // Add a container to the task definition with the specified image
        taskDefinition.addContainer(props.prefix + "web", {
            image: ecs.ContainerImage.fromRegistry("amazonlinux:2023"),
            memoryLimitMiB: 512,
            cpu: 256,
            entryPoint: ["python3", "-m", "http.server", "8080"],
            logging: new ecs.AwsLogDriver({
                logGroup: new logs.LogGroup(
                    this,
                    props.prefix + "BastionHostLogGroup",
                    {
                        retention: logs.RetentionDays.ONE_DAY,
                    }
                ),
                streamPrefix: props.prefix + "web",
                // logRetention: logs.RetentionDays.ONE_DAY,
            }),
        });

        // Create a new Fargate service with the image from ECR and specify the service name and desired number of tasks
        const appService = new ecs.FargateService(this, "MyFargateService", {
            cluster,
            serviceName: props.prefix + "bastion-host-service",
            taskDefinition: taskDefinition, // Use the task definition defined above
            assignPublicIp: false, // If you want tasks to have public IP addresses
            desiredCount: 1, // Specify the desired number of tasks
            enableExecuteCommand: true,
            securityGroups: securityGroups, // Attach the security group to the service
        });

        const taskExecutionRole = appService.taskDefinition.executionRole!;

        taskExecutionRole.addToPrincipalPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    "ssmmessages:CreateDataChannel",
                    "ssmmessages:OpenDataChannel",
                    "ssmmessages:OpenControlChannel",
                    "ssmmessages:CreateControlChannel",
                    //cloudwatch permissions
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                ],
                resources: ["*"], //adjust as per your need
            })
        );
    }
}
