import crypto from "crypto";

export function generateHash( data: string| Buffer ): string{

       return crypto
       .createHash('sha256')
       .update(data)
       .digest('hex')
}