
import { controller, httpGet, httpPost, interfaces } from "inversify-express-utils";
import { injectable, inject } from "inversify";


@controller("/auth")
@injectable()
export default class AuthController implements interfaces.Controller {
    constructor() {}
     @httpPost("/register")
    async register(req: any, res: any) {
        try {
        const { email, password } = req.body;
        // Perform registration logic here
        res.status(201).json({ message: "Registration successful" });
        } catch (error) {
        res.status(500).json({ error: "Internal server error" });
        }
    }
}