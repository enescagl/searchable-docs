# Technical Architecture

## System Overview

Searchable Docs is a web application that provides semantic search capabilities for code repositories. The system fetches code from GitHub repositories, processes the content, generates embeddings, and enables users to search through the codebase using natural language queries.

## Tech Stack

- **Frontend**: Nuxt.js 3, Vue.js 3, TailwindCSS
- **Backend**: Nuxt.js Server API routes, Node.js
- **Database**: SQLite (via libsql/client), Drizzle ORM
- **Search**: Vector-based semantic search with embedding models
- **Job Processing**: BullMQ, Redis
- **Embedding Generation**: Ollama (nomic-embed-text model)
- **GitHub Integration**: Octokit

## Core Components

### Database Schema

The database consists of three main tables:

1. **Repositories**: Stores information about GitHub repositories
   - ID, owner, repo name, reference (branch/tag), processing status

2. **Documents**: Tracks individual files within repositories
   - ID, file path, repository ID, processing status

3. **Embeddings**: Stores text chunks and their vector embeddings
   - ID, heading, text content, vector embedding, document ID

### Application Layers

#### Data Access Layer

- **Repository Management**: Adding, fetching, and searching repositories
- **Document Processing**: Managing document lifecycle and processing status
- **Embedding Storage**: Storing and retrieving vector embeddings

#### Service Layer

- **GitHub Service**: Fetching repository contents and metadata
- **Chunking Service**: Splitting documents into appropriate chunks
- **Embedding Service**: Generating vector embeddings from text chunks
- **Job Queue Service**: Managing asynchronous processing tasks

#### API Layer

- **Repository API**: Endpoints for repository management
- **Search API**: Endpoints for semantic search functionality
- **Queue API**: Endpoints for job management and status

#### UI Layer

- **Repository Management UI**: Adding and browsing repositories
- **Search Interface**: Querying and viewing search results
- **Document Viewer**: Viewing and navigating source code

## Data Flow

1. **Repository Addition**
   - User submits GitHub repository URL
   - System extracts owner/repo information
   - Repository is added to the database
   - Indexing job is queued

2. **Indexing Process**
   - Job queue processes repository
   - System fetches files from GitHub
   - Files are processed and chunked
   - Chunks are converted to embeddings
   - Embeddings are stored in the database

3. **Search Process**
   - User submits search query
   - Query is converted to embedding vector
   - System performs vector similarity search
   - Relevant results are returned and displayed

## Scalability Considerations

- **Job Queue**: Handles background processing to prevent blocking
- **Chunking Strategy**: Optimized for effective semantic search
- **Embedding Caching**: Reduces redundant embedding generation
- **Incremental Updates**: Supports updating only changed files

## Future Architecture Extensions

- **User Authentication**: Adding multi-user support
- **Permissions System**: Repository access control
- **Multiple Embedding Models**: Support for different models
- **Distributed Processing**: Scaling to handle larger repositories
- **Real-time Updates**: WebSocket notifications for processing status 