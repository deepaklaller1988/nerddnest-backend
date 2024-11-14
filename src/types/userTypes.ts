export interface UserAttributes {
    id?: number,
    userId: string,
    image: string,
    email: string,
    password: string,
    firstname: string,
    lastname: string,
    handle: string,
    dob: Date,
    location: string,
    refreshToken: string,
}

export interface checkUserLoginAttributes {
    id: number,
    userId: string,
    image: string,
    email: string,
    password: string,
    firstname: string,
    lastname: string,
    handle: string,
    dob: Date,
    location: string,
}