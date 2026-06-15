import "dotenv/config";
interface RawEnv {
    [key: string]: string | undefined;
}
export declare function buildConfig(source?: RawEnv): {
    port: number;
    clientUrl: string;
    mongoUri: string;
    jwtSecret: string;
    jwtRefreshSecret: string;
    jwtExpiresIn: string;
    jwtRefreshExpiresIn: string;
    nodeEnv: string;
    isProduction: boolean;
    r2Region: string;
    r2Endpoint: string;
    r2AccessKeyId: string;
    r2SecretAccessKey: string;
    r2Bucket: string;
    adminSeed: {
        email: string | undefined;
        password: string | undefined;
        fullName: string;
    };
};
export declare const config: {
    port: number;
    clientUrl: string;
    mongoUri: string;
    jwtSecret: string;
    jwtRefreshSecret: string;
    jwtExpiresIn: string;
    jwtRefreshExpiresIn: string;
    nodeEnv: string;
    isProduction: boolean;
    r2Region: string;
    r2Endpoint: string;
    r2AccessKeyId: string;
    r2SecretAccessKey: string;
    r2Bucket: string;
    adminSeed: {
        email: string | undefined;
        password: string | undefined;
        fullName: string;
    };
};
export {};
//# sourceMappingURL=env.d.ts.map