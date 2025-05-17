export default interface IPasswordHasher {
    hash(password: string): Promise<string>;

    verify(plainTextPassword: string, storedHash: string): Promise<boolean>;
}