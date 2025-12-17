import { BadRequestError } from "@rkh-ms/classify-lib/errors";
import { NextFunction, Request, Response } from "express";
import jwt, { TokenExpiredError } from "jsonwebtoken";

interface validatePrcPayload {
    /**id of the reset-password record */
    id: number,
    /**indicate if the user succssfully entered a 
     * correct verification code
     * default is false
     */
    used: boolean
}

declare global {
    namespace Express {
        interface Request {
            validatePrc?: validatePrcPayload
        }
    }
}

export const validatePrcMiddleware = (req: Request, res: Response, next: NextFunction) => {

    if (!req.session)
        throw new BadRequestError('Please Try Again')
    try {
        const payload = jwt.verify(req.session!.jwt,
            process.env.JWT_KEY!) as validatePrcPayload
        req.validatePrc = payload
        next()
    } catch (err) {
        console.error(err);

        if (err instanceof TokenExpiredError)
            throw new BadRequestError(req.t('errors', 'CODE_EXPIRED'))

        throw new Error('Please Try Again, something went wrong')
    }
}