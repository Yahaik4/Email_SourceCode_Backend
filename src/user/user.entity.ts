import { Types } from 'mongoose';

export type UserEntity = {
    _id: Types.ObjectId;
    username: string;
    email: string;
    password: string | null;
    avatar: string | null;
    phoneNumber: string | null;
};
