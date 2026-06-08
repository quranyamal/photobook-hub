# CLAUDE.md

## Project Overview

This repository contains the source code for a commercial PhotoBook platform.

The platform allows customers to:

* Upload photos
* Create custom photobooks
* Place orders online
* Track production status
* Receive notifications

The business objective is to build a profitable photobook service.

The engineering objective is to develop a production-grade platform demonstrating:

* Modern software architecture
* Cloud-native engineering
* Platform engineering practices
* OpenTelemetry observability
* GitOps
* CI/CD
* SLO-driven operations
* AI-assisted software development

This project serves both as a commercial product and a Solution Architect portfolio.

---

# Guiding Principles

## Business First

Prioritize customer value and business outcomes.

Prefer:

* Simpler solutions
* Faster delivery
* Lower operational complexity

Avoid introducing technologies solely for learning purposes.

Every major technical decision should answer:

> What business problem does this solve?

---

## Incremental Complexity

Start simple.

Evolution path:

```text
Monolith
↓
Modular Monolith
↓
Service Extraction
↓
Event-Driven Components
```

Do not introduce microservices before clear business or operational justification exists.

---

## AI-Assisted Development

Claude Code is a primary development tool.

Expected responsibilities:

* Generate implementation plans
* Generate code
* Generate tests
* Generate documentation
* Generate architecture decision records
* Generate runbooks

Claude should not make architectural assumptions without documenting trade-offs.

---

# Technology Stack

## Frontend

* Next.js
* TypeScript
* Tailwind CSS
* shadcn/ui

## Backend

* NestJS
* TypeScript

## Database

* PostgreSQL

## Cache

* Redis

## Storage

* S3-compatible object storage

Examples:

* MinIO
* AWS S3

---

# Architecture Principles

## Clean Architecture

Separate:

* Domain
* Application
* Infrastructure
* Presentation

Business logic must not depend on infrastructure frameworks.

---

## Domain Driven Design

Core domains:

### Customer Domain

* Registration
* Authentication
* Profile

### Catalog Domain

* Photobook templates
* Pricing

### Order Domain

* Cart
* Checkout
* Orders

### Production Domain

* Production workflow
* Status tracking

### Notification Domain

* Email
* Messaging

---

## API Standards

Use:

* REST APIs initially
* OpenAPI documentation

Requirements:

* Versioned APIs
* Consistent error responses
* Structured validation

---

# Observability Requirements

All services must be observable.

Minimum requirements:

## Logging

Structured JSON logs.

Required fields:

* timestamp
* service
* environment
* requestId
* traceId
* userId (when available)

---

## Metrics

Expose Prometheus-compatible metrics.

Required metrics:

* Request count
* Error count
* Request duration
* Database latency

---

## Tracing

All services must support OpenTelemetry.

Required trace propagation:

* HTTP requests
* Database calls
* Queue processing

---

# Testing Standards

## Unit Tests

Required for:

* Domain services
* Business rules
* Critical workflows

Target:

* 80%+ coverage for core business logic

---

## Integration Tests

Required for:

* APIs
* Database interactions

---

## End-to-End Tests

Critical paths:

* Registration
* Login
* Upload photos
* Checkout
* Order tracking

---

# Security Requirements

Never:

* Commit secrets
* Commit credentials
* Hardcode tokens

Use:

* Environment variables
* Secret management

Validate:

* User input
* Uploaded files
* Authorization checks

---

# Infrastructure Roadmap

Phase 1:

* Docker Compose
* Single application deployment

Phase 2:

* Kubernetes
* Helm

Phase 3:

* GitOps
* ArgoCD

Phase 4:

* OpenTelemetry
* Grafana LGTM

Phase 5:

* SLO Monitoring
* Incident Response

---

# CI/CD Standards

Every Pull Request must:

* Pass linting
* Pass tests
* Build successfully

Deployment pipeline stages:

```text
Lint
↓
Test
↓
Build
↓
Security Scan
↓
Container Build
↓
Deploy
```

---

# Documentation Requirements

All major changes require:

## ADR

Architecture Decision Record

Document:

* Context
* Decision
* Consequences
* Alternatives

---

## Runbooks

Create operational runbooks for:

* Deployment failures
* Database issues
* Service outages
* High latency incidents

---

# Coding Standards

Prefer:

* Readability over cleverness
* Explicit naming
* Small functions
* Strong typing

Avoid:

* Premature optimization
* Overengineering
* Unnecessary abstractions

---

# Definition of Done

A feature is complete only when:

* Code is implemented
* Tests pass
* Documentation updated
* Observability added
* Security reviewed

---

# Long-Term Vision

Build a production-grade platform that demonstrates the skills expected of:

* Senior Platform Engineer
* Solution Architect
* Cloud Architect
* Future CTO

Every architectural decision should balance:

* Customer value
* Business sustainability
* Engineering excellence
* Operational simplicity

