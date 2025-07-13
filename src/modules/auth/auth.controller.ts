import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
} from "@nestjs/common";
import { ApiBody, ApiTags } from "@nestjs/swagger";
import { User } from "../../database/schemas/user.schema";
import { Auth } from "../../decorators/auth.decorator";
import { AuthSession, AuthUser } from "../../decorators/user.decorator";
import { UserRole } from "../../enums/user.enum";
import { ValidationPipe } from "../../pipes/validation.pipe";
import { LoginDto, RefreshTokenDto, SignupDto } from "./auth.dto";
import { AuthService } from "./auth.service";

@Controller()
@UsePipes(new ValidationPipe({ whitelist: true }))
@ApiTags("Auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  @HttpCode(HttpStatus.OK)
  async signup(@Body() body: SignupDto) {
    return {
      data: await this.authService.signup(body),
      message: "Signup successfull",
    };
  }

  @Post("login")
  @ApiBody({ type: LoginDto })
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto) {
    return {
      data: await this.authService.login(body),
      message: "Login successfull",
    };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  // @Auth()
  @Auth([UserRole.USER, UserRole.ADMIN])
  async logout(@AuthUser() user: User, @AuthSession() session: string) {
    return {
      data: await this.authService.logout(user, session),
      message: "Logout successfull",
    };
  }

  @Post("refresh")
  @ApiBody({ type: RefreshTokenDto })
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() body: RefreshTokenDto) {
    return {
      data: await this.authService.refreshToken(body),
      message: "Token refreshed successfully",
    };
  }
}
