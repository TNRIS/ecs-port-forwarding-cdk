import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as logs from "aws-cdk-lib/aws-logs";
import { DockerImageAsset } from "aws-cdk-lib/aws-ecr-assets";
import { Aspects } from "aws-cdk-lib";
import * as redshift from "aws-cdk-lib/aws-redshift";

export class ecsStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Create a VPC with public subnets only and 2 max availability zones
        const vpc = ec2.Vpc.fromLookup(this, "tnris-vpc", {
            vpcId: "vpc-ce6136aa",
        });

        // Define a security group for your Fargate service
        const fargateSG = ec2.SecurityGroup.fromLookupById(
            this,
            "TnrisBastionHostSecGroup",
            "sg-073e3d6ecc46a137c"
        );

        // Create an ECS Cluster named "bastion-host-cluster"
        const cluster = new ecs.Cluster(this, "BastionHostCluster", {
            vpc,
            clusterName: "bastion-host-cluster",
        });

        // Build and push Docker image to ECR
        // const appImageAsset = new DockerImageAsset(this, "MyAppImage", {
        //     directory: "./lib/docker",
        // });

        // Define the execution role for the ECS task
        const executionRole = new iam.Role(this, "MyExecutionRole", {
            assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            // Add any additional permissions or policies as needed
        });

        // Define the task definition with the container image
        const taskDefinition = new ecs.FargateTaskDefinition(
            this,
            "MyFargateTaskDefinition",
            {
                memoryLimitMiB: 512,
                cpu: 256,
                executionRole: executionRole, // Assign the execution role to the task definition
            }
        );

        // Add a container to the task definition with the specified image
        taskDefinition.addContainer("web", {
            // image: ecs.ContainerImage.fromRegistry(appImageAsset.imageUri),
            // image: ecs.ContainerImage.fromRegistry("public.ecr.aws/amazonlinux/amazonlinux:2023"),
            image: ecs.ContainerImage.fromRegistry("amazonlinux:2023"),
            memoryLimitMiB: 512,
            cpu: 256,
            entryPoint: ["python3", "-m", "http.server", "8080"],
            logging: new ecs.AwsLogDriver({
                // logGroup: new logs.LogGroup(this, 'MyLogGroup'),
                streamPrefix: "web",
                logRetention: logs.RetentionDays.ONE_DAY,
            }),
        });

        // Create a new Fargate service with the image from ECR and specify the service name and desired number of tasks
        const appService = new ecs.FargateService(this, "MyFargateService", {
            cluster,
            serviceName: "ecs-service",
            taskDefinition: taskDefinition, // Use the task definition defined above
            assignPublicIp: false, // If you want tasks to have public IP addresses
            desiredCount: 1, // Specify the desired number of tasks
            enableExecuteCommand: true,
            securityGroups: [fargateSG], // Attach the security group to the service
        });

        // Aspects.of(appService).add({
        //     visit: (node) => {
        //         if (node instanceof ecs.CfnTaskDefinition) {
        //             node.addPropertyOverride(
        //                 "ContainerDefinitions.0.ReadonlyRootFilesystem",
        //                 true
        //             );
        //             node.addPropertyOverride(
        //                 "ContainerDefinitions.0.linuxParameters.initProcessEnabled",
        //                 true
        //             );
        //             //If you set the task definition parameter initProcessEnabled to true, this starts the init process inside the container. This removes any zombie SSM agent child processes found.
        //         }
        //     },
        // });

        // // Define a volume for mounting to the container
        // const cacheVolume = appService.taskDefinition.addVolume({
        //     name: "cacheVolume",
        // });

        // const runVolume = appService.taskDefinition.addVolume({
        //     name: "runVolume",
        // });

        // const tmpVolume = appService.taskDefinition.addVolume({
        //     name: "tmpVolume",
        // });

        // const confVolume = appService.taskDefinition.addVolume({
        //     name: "confVolume",
        // });

        // const libAmazonVolume = appService.taskDefinition.addVolume({
        //     name: "libAmazonVolume",
        // });

        // const logAmazonVolume = appService.taskDefinition.addVolume({
        //     name: "logAmazonVolume",
        // });

        // // Override the container definition to mount the root filesystem
        // appService.taskDefinition.defaultContainer?.addMountPoints({
        //     containerPath: "/var/cache/nginx",
        //     readOnly: false,
        //     sourceVolume: "cacheVolume",
        // });

        // appService.taskDefinition.defaultContainer?.addMountPoints({
        //     containerPath: "/var/run",
        //     readOnly: false,
        //     sourceVolume: "runVolume",
        // });

        // appService.taskDefinition.defaultContainer?.addMountPoints({
        //     containerPath: "/tmp/nginx",
        //     readOnly: false,
        //     sourceVolume: "tmpVolume",
        // });

        // appService.taskDefinition.defaultContainer?.addMountPoints({
        //     containerPath: "/etc/nginx",
        //     readOnly: false,
        //     sourceVolume: "confVolume",
        // });

        // appService.taskDefinition.defaultContainer?.addMountPoints({
        //     containerPath: "/var/lib/amazon",
        //     readOnly: false,
        //     sourceVolume: "libAmazonVolume",
        // });

        // appService.taskDefinition.defaultContainer?.addMountPoints({
        //     containerPath: "/var/log/amazon",
        //     readOnly: false,
        //     sourceVolume: "logAmazonVolume",
        // });

        // Grant ECR repository permissions for the task execution role
        // appImageAsset.repository.grantPullPush(
        //     appService.taskDefinition.executionRole!
        // );

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

        // Private Subnet
        // const privateSubnet = vpc.selectSubnets({
        //     subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        // }).subnetIds[0];

        // // Create the Redshift Cluster Subnet Group
        // const subnetGroup = new redshift.CfnClusterSubnetGroup(
        //     this,
        //     "MyRedshiftSubnetGroup",
        //     {
        //         description: "Redshift cluster subnet group",
        //         subnetIds: [privateSubnet],
        //     }
        // );
        // // Security Group for Redshift Cluster
        // const redshiftSG = new ec2.SecurityGroup(
        //     this,
        //     "RedshiftSecurityGroup",
        //     {
        //         vpc,
        //         allowAllOutbound: false, // Set allowAllOutbound to false for customized outbound rules
        //     }
        // );

        // const DBNAME = "mydatabase"; // Replace with your desired database name
        // const MASTER_USERNAME = "admin"; // Replace with your desired master username
        // const MASTER_PASSWORD = "MyPassword123"; // Replace with your desired password
        // const NODE_TYPE = "dc2.large"; // Default smallest and cheapest node type for Redshift Cluster
        // const NO_OF_NODES = 1; // Default Single-node, change to 2 for multi-node for Redshift Cluster
        // const PORT = 5439; // Default port for Redshift Cluster

        // Add inbound rule to allow traffic from fargate SG to Redshift SG
        // redshiftSG.addIngressRule(
        //     fargateSG,
        //     ec2.Port.tcp(PORT),
        //     "Allow access from fargate SG"
        // );

        // // Add outbound rule to allow traffic from fargate SG to Redshift SG
        // fargateSG.addEgressRule(
        //     redshiftSG,
        //     ec2.Port.tcp(PORT),
        //     "Allow access to Redshift SG"
        // );

        // Create the Redshift Cluster
        // const redshiftCluster = new redshift.CfnCluster(
        //     this,
        //     "MyRedshiftCluster",
        //     {
        //         clusterType: "single-node", // Single-node cluster
        //         dbName: DBNAME, // Replace with your desired database name
        //         masterUsername: MASTER_USERNAME, // Replace with your desired master username
        //         masterUserPassword: MASTER_PASSWORD, // Replace with your desired password
        //         nodeType: NODE_TYPE, // Smallest and cheapest node type
        //         numberOfNodes: NO_OF_NODES, // Single-node, change to 2 for multi-node
        //         vpcSecurityGroupIds: [redshiftSG.securityGroupId], // Use the default security group
        //         clusterSubnetGroupName: subnetGroup.ref, // Use the created subnet group
        //         publiclyAccessible: false,
        //         port: PORT,
        //     }
        // );

        // Output ECS Cluster ARN
        // new cdk.CfnOutput(this, "ECSClusterARN", {
        //     value: cluster.clusterArn,
        //     description: "ECS Cluster ARN",
        // });

        // Output Redshift Cluster Endpoint Address
        // new cdk.CfnOutput(this, "RedshiftClusterEndpoint", {
        //     value: redshiftCluster.attrEndpointAddress,
        //     description: "Redshift Cluster Endpoint Address",
        // });
    }
}
