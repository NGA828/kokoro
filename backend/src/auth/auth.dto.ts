import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required.' })
  @MaxLength(120)
  name: string;

  @IsEmail({}, { message: 'Please enter a valid email address.' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  @MaxLength(128)
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Date of birth is required.' })
  dob: string;

  @IsString()
  @IsNotEmpty({ message: 'Please select your gender.' })
  gender: string;

  @IsString()
  @IsNotEmpty({ message: 'Please tell us your city.' })
  @MaxLength(120)
  city: string;

  @IsString()
  @MaxLength(120)
  country?: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required.' })
  password: string;
}

export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(8)
  password: string;
}
