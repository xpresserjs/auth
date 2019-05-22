class AuthController extends $.controller {

    static middleware() {
        return {}
    }

    index(x){
        return x.view("auth::cp");
    }

}

module.exports = AuthController;