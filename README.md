# ShopSmart Backend 🛒

[![Java](https://img.shields.io/badge/Java-26-orange.svg)](https://java.com/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-29.x-blue.svg)](https://www.docker.com/)

A production-style Spring Boot e-commerce backend that demonstrates secure authentication, scalable REST API design, database optimization, and containerized deployment.

This project was built to simulate real-world backend development practices rather than focusing only on basic CRUD functionality. It emphasizes security, performance, and clean architecture.

---

## 🚀 Key Features

* **Advanced Authentication & Security:** 
  * Stateless JWT-based authentication with Access & Refresh token flows.
  * Google OAuth 2.0 Login integration.
  * Secure HTTP-only cookie storage and Spring Security filter chain configuration.
  * Role-based authorization (Admin vs. Standard User).
  * BCrypt password hashing and Two-Step Verification via email.

* **Optimized Database & Performance:** 
  * PostgreSQL integration using Spring Data JPA and Hibernate.
  * DTO projections to reduce unnecessary data fetching.
  * Lazy loading for image data using LOB fetch strategies.
  * Scalable, paginated API responses and JPQL-based product search.

* **Core Business Logic:**
  * Complete product management with secure image upload support.
  * Persistent shopping cart management (One-to-One User/Cart relationship).
  * Global exception handling and robust request validation.

* **DevOps & Deployment:** 
  * Fully dockerized backend for easy environment setup.
  * Environment variable-driven configuration.

---

## 🛠️ Tech Stack

* **Core:** Java 26, Spring Boot, Spring MVC
* **Security:** Spring Security, JWT, Google OAuth 2.0, BCrypt
* **Persistence:** PostgreSQL, Spring Data JPA, Hibernate
* **Build & Deploy:** Maven, Docker

---

## 🏗️ Architecture & Database Design

The project follows a layered architecture (Controllers -> Services -> Repositories) separating concerns to keep the codebase maintainable. 
```
src/main/java/com/arpan/backend
├── controller 
├── dto 
├── entity 
├── repository 
├── service 
│ ├── interfaces 
│ └── implementation 
├── security 
├── configuration 
├── exception 
├── util 
└── ShopSmartApplication
```

**Key Database Relationships:**
* `User` ↔ `Cart` (One-to-One)
* `User` ↔ `Products` (One-to-Many)
* `Product` image stored using LOB with lazy fetching to optimize memory footprint.

---

## 🗺️ API Documentation (Postman)

* Swagger UI
---

## ⚙️ Getting Started

### Prerequisites

* Java 26
* PostgreSQL
* Docker (Optional, for containerized run)

### 1. Clone the Repository
```bash
git clone https://github.com/arpan-v/shopsmart_backend.git
cd shopsmart_backend
```
### 2. Environment Setup

The application requires certain environment variables to run securely (Database URLs, JWT secrets, OAuth credentials).

**Export all the environment variables mentioned in `.env.example`**

### 3. Run the Application

Run:
```Bash
mvnw spring-boot:run
```

**OR**

Using Docker (Recommended):
```Bash
docker build -t shopsmart-backend .
docker run -p 8080:8080 shopsmart-backend
```


## 🔮 Future Improvements

   * Integrate Redis for caching frequently accessed products.

   * Implement Elasticsearch for advanced, fuzzy product search.

   * Add Swagger/OpenAPI for interactive API documentation.

   * Build CI/CD pipelines using GitHub Actions.

   * Deploy to AWS (ECR, ECS, RDS).

   * Payment gateway integration (Stripe/Razorpay).
