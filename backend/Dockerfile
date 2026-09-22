# ---- Build stage ----
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Copy Maven wrapper and pom first (layer caching for dependencies)
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Copy source and build the jar
COPY src/ src/
RUN ./mvnw clean package -DskipTests -B

# ---- Run stage ----
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy the built jar from the build stage
COPY --from=build /app/target/*.jar app.jar

# Render injects its own PORT env var at runtime; Spring reads it via application.properties.
# We do NOT hardcode PORT here so Render's value takes effect.
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
