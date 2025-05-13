export interface ApiResponse<T> {
    statusCode: number;
    msg: string;
    metadata: T;
}
