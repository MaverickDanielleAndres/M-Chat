---
name: prompt-enhancer
description: Enhance user prompts by analyzing project context (code structure, dependencies, conventions, existing patterns). Use when users provide brief development requests that would benefit from project-specific context to generate more accurate, contextually-aware prompts.
---

# Prompt Enhancer

Transform brief development requests into clear, detailed requirements by analyzing project context. Present the enhanced requirements to the user for confirmation before implementation.

## When to Use This Skill

Use this skill when:
- User provides a brief development request like "build a login feature", "add an API"
- Request lacks specific implementation details
- User uploads project files or mentions "the project"
- Task requires understanding project architecture

## Core Workflow

### Step 1: Analyze Project Context

**Check for uploaded files:**
```bash
view /mnt/user-data/uploads
```

**Gather key information:**
- Project structure and organization
- Technology stack (package.json, pubspec.yaml, requirements.txt, etc.)
- Existing patterns (state management, API calls, routing)
- Code conventions (naming, file structure)
- Similar existing features

### Step 2: Extract Request Intent

From the user's brief request, identify:
- **Feature type**: New feature, bug fix, refactoring, API integration
- **Scope**: Single screen, full flow, backend + frontend
- **Dependencies**: Related features or systems

### Step 3: Build Enhanced Requirements

Create a structured requirement document with:

```markdown
# [Feature Name] Implementation Requirements

## 📋 Project Context
- Framework: [detected framework and version]
- Architecture: [detected pattern]
- State Management: [detected library]
- Key Libraries: [list relevant dependencies]

## 🎯 Implementation Scope

### Key Features
1. [Main feature 1]
2. [Main feature 2]
3. [Main feature 3]

### File Structure
[Expected file structure based on project]

## 📝 Detailed Requirements

### 1. [Layer/Component Name]
- **Location**: [File path]
- **Purpose**: [What it does]
- **Implementation**:
  - [Specific requirement 1]
  - [Specific requirement 2]
- **Follow existing pattern**: [Reference to existing pattern]

### 2. [Next Layer/Component]
...

## ✅ Success Criteria
- [ ] [Acceptance criteria 1]
- [ ] [Acceptance criteria 2]
- [ ] [Acceptance criteria 3]
- [ ] Maintain consistency with existing code style and architecture
- [ ] Write tests for all major features

## 🔍 Clarifications
- [Any questions or clarifications needed]
- [Assumptions made]

---
Shall we proceed with these requirements? Let me know if anything needs to be adjusted.
```

### Step 4: Present to User

**Important**: After creating the enhanced requirements, present them to the user and ask for confirmation:

```
I've analyzed and structured the requirements above.

Shall we proceed as is?
Let me know if there's anything you'd like to change or add!
```

**Do NOT implement** until the user confirms. The goal is to clarify requirements first.

## Analysis Patterns by Stack

### Flutter Projects

**Detect**: pubspec.yaml, lib/ directory

**Key context to gather:**
- State management (Riverpod, Bloc, Provider, GetX)
- Architecture (Clean Architecture, MVVM, MVC)
- Navigation (go_router, auto_route, Navigator)
- Network (Dio, http)
- Local storage (Hive, SharedPreferences, SQLite)

**Enhanced requirements should include:**
```markdown
## Implementation Scope

### Presentation Layer
- Screen: lib/presentation/[feature]/[screen]_screen.dart
- State: [StateNotifier/Bloc/Controller] with [state pattern]
- Widgets: Reusable components

### Domain Layer
- Entity: lib/domain/entities/[name].dart
- UseCase: lib/domain/usecases/[action]_usecase.dart
- Repository Interface: lib/domain/repositories/

### Data Layer
- Model: lib/data/models/[name]_model.dart (fromJson/toJson)
- Repository Implementation: lib/data/repositories/
- DataSource: lib/data/datasources/

### Navigation
- Route: [route path]
- Navigation method: [context.go/push based on router]

## Success Criteria
✅ State managed with [State management]
✅ Consistent styling with [Existing widget]
✅ API response error handling
✅ Loading state indicator
✅ Widget test written
```

### Next.js/React Projects

**Detect**: package.json with "next" or "react"

**Key context to gather:**
- Next.js version (App Router vs Pages Router)
- State management (Zustand, Redux, Context)
- Styling (Tailwind, CSS Modules, styled-components)
- API approach (Next.js API routes, external API)
- TypeScript usage

**Enhanced requirements should include:**
```markdown
## Implementation Scope

### UI Components
- Component: [path]/[ComponentName].tsx
- Props interface: [existing pattern]
- Styling: [Tailwind classes/CSS modules]

### State Management
- Store: [existing state structure]
- Actions: [action naming convention]

### API Layer
- Endpoint: [app/api or external]
- Method: [GET/POST/PUT/DELETE]
- Response type: [TypeScript interface]

### Routing
- Route: [app/[route] or pages/[route]]
- Dynamic segments: [if needed]

## Success Criteria
✅ TypeScript type safety
✅ Reuse [Existing components]
✅ Responsive design (mobile/desktop)
✅ SEO optimization (metadata)
✅ Unit test + Integration test
```

### Python (Django/FastAPI) Projects

**Detect**: requirements.txt, manage.py, main.py

**Key context to gather:**
- Framework (Django, FastAPI, Flask)
- ORM (SQLAlchemy, Django ORM, Tortoise)
- Authentication approach
- API documentation (OpenAPI/Swagger)

**Enhanced requirements should include:**
```markdown
## Implementation Scope

### Models/Schema
- Model: [app]/models.py or schemas/[name].py
- Fields: [field definitions with types]
- Relationships: [ForeignKey/relationships]

### Views/Endpoints
- Route: [path]
- Method: [HTTP method]
- Request/Response schema: [Pydantic models]

### Business Logic
- Service: [if applicable]
- Validation: [input validation]

### Database
- Migration: [migration command]

## Success Criteria
✅ Auto-generated API documentation
✅ Request validation
✅ Error handling with proper status codes
✅ Unit test + Integration test
✅ [Authentication] applied
```

## Example Enhancement

**User input:**
```
Build a login feature
```

**Skill output:**
```markdown
# Login Feature Implementation Requirements

## 📋 Project Context
- Framework: Flutter 3.16.0 with null safety
- Architecture: Clean Architecture
- State Management: Riverpod (StateNotifier pattern)
- Network: Dio 5.3.0
- Storage: flutter_secure_storage
- Navigation: go_router

## 🎯 Implementation Scope

### Key Features
1. Email/password login form
2. JWT token-based authentication
3. Redirect to home screen on successful login
4. Error handling and user feedback

### File Structure
lib/
├── presentation/
│   └── auth/
│       ├── login_screen.dart
│       ├── login_notifier.dart
│       └── login_state.dart
├── domain/
│   ├── entities/user.dart
│   ├── usecases/login_usecase.dart
│   └── repositories/auth_repository.dart
└── data/
    ├── models/
    │   ├── user_model.dart
    │   └── login_response.dart
    ├── repositories/auth_repository_impl.dart
    └── datasources/auth_remote_datasource.dart

## 📝 Detailed Requirements

### 1. Presentation Layer - Login Screen
- **Location**: lib/presentation/auth/login_screen.dart
- **Purpose**: Provide user login UI
- **Implementation**:
  - Use ConsumerStatefulWidget
  - Email TextFormField (email format validation)
  - Password TextFormField (min 8 chars, obscureText)
  - Login PrimaryButton
  - Sign-up link
  - Overlay during loading state
- **Follow existing pattern**: Use core/widgets/custom_text_field.dart style

### 2. State Management
- **Location**: lib/presentation/auth/login_notifier.dart
- **Purpose**: Manage login state
- **Implementation**:
  - Extend StateNotifier<LoginState>
  - login(email, password) method
  - Save token and update state on success
  - Set error message state on failure
- **Follow existing pattern**: Same pattern as other notifiers

### 3. Domain Layer - Entity
- **Location**: lib/domain/entities/user.dart
- **Purpose**: User domain model
- **Implementation**:
  - Create immutable class with Freezed
  - Fields: id, email, name, profileImageUrl
- **Follow existing pattern**: Same structure as other entities

### 4. Domain Layer - UseCase
- **Location**: lib/domain/usecases/login_usecase.dart
- **Purpose**: Login business logic
- **Implementation**:
  - call(LoginParams) method
  - Returns Either<Failure, User>
  - Repository dependency injection
- **Follow existing pattern**: Single responsibility UseCase pattern

### 5. Data Layer - API Communication
- **Location**: lib/data/datasources/auth_remote_datasource.dart
- **Purpose**: Call the login API
- **Implementation**:
  - POST /api/auth/login
  - Request: {"email": string, "password": string}
  - Response: LoginResponse (accessToken, refreshToken, user)
  - Reuse existing Dio instance
- **Follow existing pattern**: Error handling approach of existing datasources

### 6. Data Layer - Repository Implementation
- **Location**: lib/data/repositories/auth_repository_impl.dart
- **Purpose**: Implement the Repository interface
- **Implementation**:
  - Implement login method
  - Save token (using TokenStorage)
  - Handle DioException
  - Convert UserModel to User entity
- **Follow existing pattern**: try-catch-Either pattern

### 7. Navigation Setup
- **Location**: lib/core/router/app_router.dart
- **Purpose**: Add login route
- **Implementation**:
  - Add /login route
  - Redirect to /home on successful login
  - Authentication guard logic
- **Follow existing pattern**: Existing go_router configuration style

## ✅ Success Criteria
- [ ] User can enter email and password
- [ ] API is called when the login button is clicked
- [ ] Token saved and redirected to home on success
- [ ] Appropriate error message shown on failure (SnackBar)
- [ ] Button disabled and loading indicator shown during loading
- [ ] Email format and password length validation
- [ ] Maintain existing code style and architecture consistency
- [ ] Write Widget test (login screen)
- [ ] Write Repository test (mock API)
- [ ] Write UseCase test

## 🔍 Clarifications
- Is the API endpoint `https://api.example.com` correct?
- Is automatic token refresh needed when the token expires?
- Should social login (Google, Apple, etc.) also be implemented?
- Is a "Forgot Password" feature needed?

---
Shall we proceed with these requirements? Let me know if anything needs to be adjusted!
```

## Tips for Effective Enhancement

### Always Ask for Clarification

If the project context is unclear or insufficient:
```
If you upload the project files, I can create more accurate requirements.
Alternatively, please share the following information:
- Framework in use
- State management library
- Existing project structure
```

### Include Visual Examples

When helpful, mention existing screens/components:
```
Implement with a layout similar to the existing ProfileScreen
- Same AppBar style
- Reuse TextFormField design
- Use PrimaryButton component
```

### Highlight Dependencies

```
## 🔗 Related Features
- UserRepository: Reused for user information lookup
- TokenStorage: Leverages existing token storage logic
- ErrorHandler: Applies common error handling
```

## Reference Files

For detailed patterns:
- **Enhancement patterns**: references/enhancement-patterns.md
- **Framework guides**: references/framework-guides.md
