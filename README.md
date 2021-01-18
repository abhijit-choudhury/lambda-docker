Reference: https://docs.aws.amazon.com/lambda/latest/dg/images-create.html

Important : Don't change the references for files, all must be ./pathtofile.js irrespective of being placed in different folder, Docker Copy is not copying the folders

1. Install aws cli v2

2. Create a user with proper rights and add it to aws cli

        aws configure

3. Build docker

        docker build -t hello-world .

4. Test docker build

        docker run -p 9000:8080 hello-world

5. Test endpoint, 2015-03-31 is aws lambda api version dont try to change the date

        curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" 
        -d '{
            "headers": {
                "Content-Type": "application/xml"
            },
            "body": "<?xml version=\"1.0\"?><CruiseLineRequest><MessageHeader SegmentId=\"MSGHDR\"><BookNum>CL9W4M</BookNum></MessageHeader></CruiseLineRequest>"
        }'

6. Create a container repository with the same name 'hello-world' in AWS ECR

7. Authenticate the Docker to your Amazon ECR registry, 138796788942 below is your acc id, us-east-1 is the region

        aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 138796788942.dkr.ecr.us-east-1.amazonaws.com

8. Tag and push docker image to AWS ECR

        docker tag  hello-world:latest 138796788942.dkr.ecr.us-east-1.amazonaws.com/hello-world:latest
        docker push 138796788942.dkr.ecr.us-east-1.amazonaws.com/hello-world:latest

9. Create a lambda function using container, option available on US East (N. Virginia), US East (Ohio), US West (Oregon), Asia Pacific (Tokyo), Asia Pacific (Singapore), Europe (Ireland), Europe (Frankfurt), South America (São Paulo). 

    Select N. Virginia as we also pushed our docker to the ECR in same region us-east-1. Both need to be in same region ECR and Lambda

10. Create and attach a new policy below to the role assigned to the lambda, this is needed so that the lambda can be deployed into a VPC with public subnet
else it cannot make call to external api calls to mongodb etc

        {
            "Version": "2012-10-17",
            "Statement": [
                {
                "Effect": "Allow",
                "Action": [
                    "ec2:DescribeNetworkInterfaces",
                    "ec2:CreateNetworkInterface",
                    "ec2:DeleteNetworkInterface",
                    "ec2:DescribeInstances",
                    "ec2:AttachNetworkInterface"
                ],
                "Resource": "*"
                }
            ]
        }

11. Create a VPC with a private and public subnet using wizard, it requires an Elastic IP as prerequisite for NAT

12. Update lambda configuration to add the VPC, Private Subnet and Security Group

13. Create api gateway and attach the lambda and test, follow steps from below link

    Integration Request

        Adding two Mapping Templates application/xml with VTL: 
        {
            "body" : $input.json('$'),
            "headers": {"Content-Type":"$input.params('Content-Type')"}
        }

    Integration Response

        Delete application/json from Mapping Templates
        Enable Content handling Passthrough
        Add text/xml as new Mapping Template with VTL:
        
        $input.path('$.body')

    Method Response

        Remove Response Model Empty for Content-Type application/json for HTTP Status 200
        Add Response Model Empty for Content-Type application/xml

    Reference: https://github.com/mwittenbols/How-to-use-Lambda-and-API-Gateway-to-consume-XML-instead-of-JSON