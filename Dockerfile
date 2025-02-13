FROM node:16-alpine

WORKDIR /backend

COPY . .

RUN npm install

EXPOSE 3000

CMD [ "node" ,"index.js"]

