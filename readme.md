# Xpresser Auth Plugin

An Auth Plugin for xpresser.

## What you get?
1. Login Page.
2. Register Page.
3. Extends RequestEngine
    1. Adds `async auth()`
    2. Adds `authUser()`
    2. Adds `isLogged()`
    
## Installation
Add to your project using package managers
```console
npm install @xpresser/auth

// OR

yarn add @xpresser/auth
```

## Configure
```javascript
const config = {
    // .... other configs above ....
    plugins: {
        '@xpresser/auth': {
            model: 'User'
        }
    }
}
```


Add to your `paths.jsConfigs/plugins.json`
```json
[
    ...
    "npm://@xpresser/auth"
]
```

## Register Middlewares
The auth plugin includes a **global middleware** that loads the current logged in user.
You have to add it to your project.

Add to your use.json file. if you don't have on then create a use.json in your backend folder.
```json
{
  "middlewares": {
    "Auth": "npm://@xpresser/auth/Middlewares/Auth"
  },
  "globalMiddlewares": [
    "npm://@xpresser/auth/Middlewares/GlobalMiddleware"
  ]
}
```

## Auth Model
Your defined auth model must have required functions needed to tell the plugin how you want your Login/Registration to be handled.

- Auth Password Provider [`authPasswordProvider`]
- Auth Data Provider [`authDataProvider`]

### Auth Password Provider
This function should return the previously saved hashed password for the `primaryKey` key passed to it.

```javascript
class User {
    static async authPasswordProvider(primaryKeyValue, modelPrimaryKey) {
        // Return users hashed password from database
        const user = await this.findOne({[modelPrimaryKey]: primaryKeyValue});
        if(!user) return undefined;

        // return user password.
        return user.password;
    }
}
```

if `modelPrimarykey` is `email` and the user entered the email: `john@example.com` the above code is simply running
```javascript
const user = await this.findOne({email: 'john@example.com'})
```

if the `authPasswordProvider` returns false or undefined the login is stopped, and a failed login error message displayed.

### Auth Data Provider
This function should return the user data of the `modelPrimaryKey`, it used by the plugin to check if a user exists and to load current logged in user data.

```javascript
class User {
    static async authDataProvider(primaryKeyValue, modelPrimaryKey) {
        // Return users hashed password from database
        const user = await this.findOne({[modelPrimaryKey]: primaryKeyValue});
        if(!user) return undefined;
        
        // return user data
        return user;
    }
}
```

### Auth Register Handler
This function is where you handle your registration using the form data passed to you.

**Note:** Must return true or any value but not `undefined, false or null`
```javascript
class User {
    static async authRegisterHandler(formData) {
        // Save new user using formData
       return await new User(formData).save();
    }
}
```
The data returned is passed to the `events.userRegistered` event so you can so more.





### Start Your App
Navigate to `/auth` to view your login page.
