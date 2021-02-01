FROM public.ecr.aws/lambda/nodejs:12

# Copy function code and package.json later update it to COPY * /var/task/ and add docker ignore file as well
COPY *.js config models package.json /var/task/

# Install NPM dependencies for function
RUN npm install

# Set the CMD to your handler
CMD [ "app.handler" ]
