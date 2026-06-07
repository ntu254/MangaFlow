# Folder Structure

```txt
server/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   ├── user/
│   │   ├── series/
│   │   ├── manuscript/
│   │   ├── chapter/
│   │   ├── page/
│   │   ├── file/
│   │   ├── region/
│   │   ├── taskType/
│   │   ├── task/
│   │   ├── submission/
│   │   ├── comment/
│   │   ├── board/
│   │   ├── publication/
│   │   ├── ranking/
│   │   ├── payroll/
│   │   ├── notification/
│   │   └── ai/
│   ├── shared/
│   └── infrastructure/

client/
├── src/
│   ├── features/
│   ├── shared/
│   └── layouts/
```

Each backend module should contain:

```txt
model
repository
service
controller
routes
validation
types
constants
```
