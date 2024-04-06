import { PassportStrategy } from "@nestjs/passport"
import { ExtractJwt, Strategy } from "passport-jwt";


export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromHeader('conversation-authorization'),
            ignoreExpiration: true,
            secretOrKey: process.env.FA_PUBLIC_KEY,
            algorithms: ['RS256'],
        })
    }

    async validate(payload: any) {
        return {roles: payload.roles}
    }
}