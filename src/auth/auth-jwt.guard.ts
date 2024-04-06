import {
    ExecutionContext,
    Injectable,
    Logger,
  } from '@nestjs/common';
  import { AuthGuard, IAuthGuard } from '@nestjs/passport';
  import { Reflector } from '@nestjs/core';

  @Injectable()
  export class JwtAuthGuard extends AuthGuard('jwt') implements IAuthGuard {
    constructor(
        private reflector: Reflector,
    ) { super() }
    private logger: Logger = new Logger(JwtAuthGuard.name);

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        await super.canActivate(context);
        const roles = this.reflector.get<string[]>('roles', context.getHandler());
        if (!roles) {
            this.logger.debug('No roles defined for this route');
            return true;
        }
        let isAllowed = false;
        const request: Request = context.switchToHttp().getRequest();
        try {
            const tokenRoles: string[] = request['user']['roles'];
            for(let role of roles){
                if(tokenRoles?.indexOf(role) > -1){
                    isAllowed = true;
                    break;
                }
            }   
        } catch (error) {
            this.logger.error('Error in JwtAuthGuard', error);
            isAllowed = false;
        }
        if(!isAllowed){
            this.logger.debug(`Auth failed! Unauthorized access for ${request['user']} against roles ${roles}`);
        }
        return isAllowed;
    }
  
    handleRequest(err, user, info) {
        return user;
    }
  }