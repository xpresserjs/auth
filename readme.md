# Xpresser Auth Plugin

An Auth Plugin for xpresser.

## What you get?
1. Login.
2. Register.
3. Adds `users` table.
3. Extends RequestEngine
    1. Adds `async auth()`
    2. Adds `authUser()`
    2. Adds `isLogged()`
    
## How to install
```console
npm install @xpresser/auth

// OR

yarn add @xpresser/auth
```

Add to your `paths.jsConfigs/plugins.json`
```json
[
    ...
    "npm://@xpresser/auth"
]
```

### Config
Make sure you have set `database.startOnBoot = true`,
And appropriate database details else **xjs** will create and use `database.sqlite` in your root folder as default.


### Use Cli
Use cli to import files.
```console
xjs install npm://@xpresser/auth
```

### Migrate
Migrate new database.
```console
xjs migrate
```

### Start Your App
Navigate to `/auth` to view your login page.
