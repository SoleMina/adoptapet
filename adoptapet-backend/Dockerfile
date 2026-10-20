# One image per microservice, built from this multi-module project (shared-security is compiled with it).
#   docker build --build-arg SERVICE=user-service -t adoptapet/user-service .
# docker-compose.yml (repo root) builds every service with this file.

FROM maven:3.9-eclipse-temurin-21 AS build
ARG SERVICE
WORKDIR /src
COPY . .
# The cache mount keeps ~/.m2 between builds, so dependencies are downloaded only once
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -q -pl ${SERVICE} -am package -DskipTests \
 && cp ${SERVICE}/target/${SERVICE}-*.jar /app.jar

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app.jar app.jar
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75"
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
