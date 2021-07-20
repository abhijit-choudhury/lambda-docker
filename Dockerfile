FROM amazon/aws-lambda-nodejs:latest

RUN yum update -y \
  && yum install -y sudo\
  && yum clean all

# Copy function code and package.json later update it to COPY * /var/task/ and add docker ignore file as well
COPY . /var/task/

# Install NPM dependencies for function
RUN npm install

# Set the CMD to your handler
CMD [ "app.handler" ]
