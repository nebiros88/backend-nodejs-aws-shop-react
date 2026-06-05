## Swagger UI

- To watch endpoints and schemas documentation use [online swagger editor](https://editor.swagger.io/)
- openapi config file path is `./docs/openapi.yaml`, just import it into editor

## Service is available under the next URL:

- [https://h8j8j6pg2c.execute-api.eu-central-1.amazonaws.com](https://h8j8j6pg2c.execute-api.eu-central-1.amazonaws.com)

## API Endpoints

| Method | Endpoint                | Description                                       |
| ------ | ----------------------- | ------------------------------------------------- |
| GET    | `/products`             | Retrieve a list of all products                   |
| POST   | `/products`             | Create a new product                              |
| GET    | `/products/{productId}` | Retrieve product details by product ID            |
| GET    | `/import?name={name}`   | Generate a signed URL for uploading a `.csv` file |

## Scripts

- `npm run seed:products` - will seed database with the list of initial products
- `npm run cdk:deploy` - will run cdk deployment and set environment variables from local .env
