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
The Default Configuration file can be imported into your project using the xjs-cli `publish` command.
```sh
xjs publish Auth configs
```
The above command will publish the configuration files of this plugin into your configs folder.
Then you can include it in your xpresser config like so:

```javascript
const authPluginConfig = require('./backend/configs/Auth/config');

const config = {
    // .... other configs above ....
    plugins: {
        '@xpresser/auth': authPluginConfig
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

Add to your use.json file. if you don't have one then create a use.json file in your backend folder.
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

## Auth Providers
The auth providers are functions defined by you to tell the plugin how you want your login and registration handled.

- User Password Provider [`userPasswordProvider`]
- User Data Provider [`userDataProvider`]
- User Registration Handler [`userRegistrationHandler`]
- User Login Validator [`userLoginValidator`]

To publish the models/Auth/AuthProviders.js file run 
```
xjs publish Auth models
```


### Auth Password Provider
This function should return the previously saved hashed password for the `primaryKey` key passed to it.

```javascript
module.exports =  {
    async userPasswordProvider(primaryKeyValue, modelPrimaryKey) {
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
module.exports = {
    async authDataProvider(email) {
        // Return users hashed password from database
        const user = await this.findOne({email});
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
module.exports = {
    async authRegisterHandler(formData, http) {
        // Save new user using formData
       return await new User(formData).save();
    }
}
```
The data returned is passed to the `events.userRegistered` event, given you opportunity to do more with the request `http` instance.


### Auth Login validator
This function is where you validate how users are allowed to login. it must return an object with this signature: 
```typescript
{error: string|false, proceed: boolean}
```
For example
```javascript
module.exports = {
    async userLoginValidator(email, http) {
        const banned = await User.count({email, banned: true});
        
        return {
            // Return error message (string) if error occurred during validation.
            error: banned? 'You have been banend' : false,

            // Return false if you don't want the plugin to respond to this request.
            proceed: true
        }
    }
}
```




### Start Your App
Navigate to `/auth` to view your login page.
