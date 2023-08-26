## Demo API
UUID: 22908ca4-3eec-4bec-b2d5-480c475980e1
Last Migration: 28
Hostname: 127.0.0.1
Port: 3001
Base Path: 

### Endpoints
- CRUD 127.0.0.1:3001/users

### 9b298f44-22af-4c01-9015-e713bb26d015
```bash
 127.0.0.1:3001/users
```

#### Response
```bash
{}
```

- GET 127.0.0.1:3001/template

### Creates 10 random users, or the amount specified in the 'total' query param - 3130b8b4-d6e5-4955-9b15-652e163a2c60
```bash
GET 127.0.0.1:3001/template
```

#### Response
```bash
{
  "Templating example": "For more information about templating, click the blue 'i' above this editor",
  "users": [
    {{# repeat (queryParam 'total' '10') }}
      {
        "userId": "{{ faker 'datatype.number' min=10000 max=100000 }}",
        "firstname": "{{ faker 'name.firstName' }}",
        "lastname": "{{ faker 'name.lastName' }}",
        "friends": [
          {{# repeat (faker 'datatype.number' 5) }}
            {
              "id": "{{ faker 'datatype.uuid' }}"
            }
          {{/ repeat }}
        ]
      },
    {{/ repeat }}
  ],
  "total": "{{queryParam 'total' '10'}}"
}
```

- POST 127.0.0.1:3001/content/:param1

### Default response - ac4ebc95-8049-40ac-a8d1-771476cb5732
```bash
POST 127.0.0.1:3001/content/:param1
```

#### Response
```bash
{
  "Rules example": "Default response. Served if route param 'param1' is not present."
}
```

### Content XYZ - 7aec569c-84c7-40e5-a7ac-9f7a95f018fb
```bash
POST 127.0.0.1:3001/content/xyz
```

#### Response
```bash
{
  "Rules example": "Content XYZ. Served if route param 'param1' equals 'xyz'. (See in 'Rules' tab)"
}
```

### Content not found - b654c18c-856f-4dfd-b6eb-15c0b1ce0d0e
```bash
POST 127.0.0.1:3001/content/^(?!.*xyz).*$
```

#### Response
```bash
{
  "Rules example": "Content not found. Served if route param 'param1' is not equal to 'xyz'. (See in 'Rules' tab)"
}

```

- GET 127.0.0.1:3001/file/:pageName

### Templating is also supported in file path - fec2c2ce-075a-4cc1-93f6-032c0fa0eabd
```bash
GET 127.0.0.1:3001/file/:pageName
```

#### Response
```bash
```

- PUT 127.0.0.1:3001/path/with/pattern(s)?/*

### 05897541-98f0-47ab-a7a8-a1a453549c2c
```bash
PUT 127.0.0.1:3001/path/with/pattern(s)?/*
```

#### Response
```bash
The current path will match the following routes: 
http://localhost:3000/path/with/pattern/
http://localhost:3000/path/with/patterns/
http://localhost:3000/path/with/patterns/anything-else

Learn more about Mockoon's routing: https://mockoon.com/docs/latest/routing
```

- GET 127.0.0.1:3001/forward-and-record

### f4390452-5ad9-4fe0-9fc0-d21d424bb1e3
```bash
GET 127.0.0.1:3001/forward-and-record
```

#### Response
```bash
Mockoon can also act as a proxy and forward all entering requests that are not caught by declared routes. 
You can activate this option in the environment settings ('cog' icon in the upper right corner). 
To learn more: https://mockoon.com/docs/latest/proxy-mode

As always, all entering requests, and responses from the proxied server will be recorded ('clock' icon in the upper right corner).
To learn more: https://mockoon.com/docs/latest/requests-logging
```

