const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
// Swagger Definition for Swagger 2.0
const swaggerDefinition = {
    swagger: '2.0', // Swagger 2.0 version
    info: {
      title: 'My API',
      version: '1.0.0',
      description: 'A simple Express API',
    },
    host: 'localhost:3000',
    basePath: '/', // Base path for Swagger 2.0
    schemes: ['http'], // HTTP/HTTPS schemes
  };
  
  // Swagger Options
  const options = {
    swaggerDefinition,
    apis: ['./index.js'], // Path to the file containing annotations
  };
  
  
  const swaggerSpec = swaggerJSDoc(options);
  module.exports=swaggerSpec;
  