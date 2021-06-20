FROM node:8.15.1-alpine

WORKDIR /usr/src/
COPY ./src /usr/src/

RUN npm install .
CMD ["npm", "start"]
