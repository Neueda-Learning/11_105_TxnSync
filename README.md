# TxnSync Backend

Spring Boot backend for the TxnSync project.

## Prerequisites

- Java 17 or later
- Maven (or use the included Maven Wrapper)
- MySQL Server

## Database Setup

1. Create a MySQL database named:

```sql
CREATE DATABASE txn_sync_db;
```

2. Open:

```
backend/txnSync/src/main/resources/application.properties
```

3. Replace the placeholder value of:

```properties
spring.datasource.password=<your_password>
```

with your local MySQL password.

> **Note:** Do not commit your personal database password to the repository.

## Running the Application

Navigate to the backend project:

```bash
cd backend/txnSync
```

Run using the Maven Wrapper:

### Windows

```bash
mvnw.cmd spring-boot:run
```

### Linux/macOS

```bash
./mvnw spring-boot:run
```

The application will start on:

```
http://localhost:8080
```

If Swagger is enabled, the API documentation is available at:

```
http://localhost:8080/swagger-ui/index.html
```