import { VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { apiReference } from "@scalar/nestjs-api-reference";
import { AppModule } from "./app.module";
import { AppConfig } from "./config/app.config";
import { HttpExceptionFilter } from "./exceptions/http.exception";
import { ApiResponseInterceptor } from "./interceptors/api-response.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = +app.get(AppConfig).port;

  // Add Versioning
  app.enableVersioning({
    defaultVersion: "1",
    prefix: "api/v",
    type: VersioningType.URI,
  });

  // Global Response Interceptor
  app.useGlobalInterceptors(new ApiResponseInterceptor());

  // Error Handler
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle("Demo")
    .setDescription("API Documentation")
    .setVersion("1.0")
    .addBearerAuth()
    .addServer(`http://localhost:${port}`)
    .build();
  const documentFactory = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup("api", app, documentFactory);

  app.use(
    "/api/reference",
    apiReference({ spec: { content: documentFactory } }),
  );

  // Added for prevent crash server.
  process.on("unhandledRejection", (error) => {
    console.log("UNHANDLED REJECTION...", error);
  });

  await app.listen(port, () => {
    console.log(`Server connected in ${port}`)
  });
}

bootstrap().catch((err) => {
  console.error("FAILED TO BOOTSTRAP APPLICATION:", err);
  process.exit(1);
});
