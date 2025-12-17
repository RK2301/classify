
/**
 * function to mask the email
 * only keep first 2 characters and one before the @
 * * for example: rami.khattab0@gmail.com -> ra**********0@gmail.com
 * @param email 
 * @returns 
 */
export const maskEmail = (email: string) => {
    if (!email)
        return ''

    //only keep first 2 characters and one before the @
    const [localPart, domainPart] = email.split('@')
    if (localPart.length <= 2)
        return `**@${domainPart}`

    //number of characters to replace by *
    const charToMask = localPart.slice(2, localPart.length - 1).length

    return localPart.slice(0, 2) +
        ('*').repeat(charToMask) +
        localPart.slice(localPart.length - 1) +
        domainPart
}