import { Request, Response } from "express";

interface ITokenOptions{
    expires: Date;
    maxAge: number;
    httpOnly: boolean;
    sameSite: 'lax' | 'strict' | undefined;
    secure?: boolean;
}

export const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || '15', 10);
export const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || '72', 10);

export const accessTokenOptions: ITokenOptions = {
    expires: new Date(Date.now() + accessTokenExpire * 60 * 1000), // in minutes
    httpOnly: true,
    maxAge: accessTokenExpire * 60 * 1000,
    sameSite: 'lax',
};

export const refreshTokenOptions: ITokenOptions = {
    expires: new Date(Date.now() + refreshTokenExpire * 60 * 60 * 1000), // in hours
    httpOnly: true,
    maxAge: refreshTokenExpire * 60 * 60 * 1000,
    sameSite: 'lax',
};

export const sendToken = (user: any, statusCode: number, res: Response) => {
    // Create tokens
    const accessToken: string = user.SignAcessToken();
    const refreshToken = user.SignRefreshToken();

    // Set secure in production mode
    if (process.env.NODE_ENV === 'production') {
        accessTokenOptions.secure = true;
    }
    
    // Set cookies
    res.cookie("access_token", accessToken, accessTokenOptions);
    res.cookie("refresh_token", refreshToken, refreshTokenOptions);
    
    // Remove password from response
    user.password = "";
    
    return res.status(statusCode).json({
        success: true,
        accessToken,
        refreshToken,
        user
    });
}