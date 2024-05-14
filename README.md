# An open-source repository showing usage of AWS-CDK to provision ECS Fargate to enable local port forwarding to AWS resources in Private subnet
This is a CDK project written in TypeScript that shows implementation of ECS Fargate to enable local port forwarding to AWS resources in Private subnet. This project provisions a nginx web server with a read-only root file system on an ECS Fargate Cluster using bind mounts and running in a VPC with Private Subnet and associated IAM Roles/Policies, Security Groups, Route Tables, NAT Gateway. ECS Exec is implemented by enforcing the Security Hub best practices with read-only root file system in ECS with bind mounts in the CDK code. There is no load balancer (ALB) fronting the ECS Fargate container in Private Subnet and we show how to connect to the container from your browser using the local port forwarding. Additionally, it provisions a RedShift Cluster in Private Subnet and also shows secure access from ECS Fargate using local port forwarding explained in the associated blog post.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
