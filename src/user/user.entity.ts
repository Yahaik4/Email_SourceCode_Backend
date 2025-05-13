import { Collection } from "fireorm";

@Collection('users')
export class UserModel{
    id!: string;
    username!: string;
    email!: string;
    password!: string;
    avatar!: string | null;
    phoneNumber!: string;
}

export type UserEntity = {
    id: string;
    username: string;
    email: string;
    password: string;
    avatar: string | null;
    phoneNumber: string; 
};
