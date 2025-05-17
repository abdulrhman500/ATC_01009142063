import { RoleType } from '@shared/RoleType';

export default class Role {
    private readonly role: RoleType;

     constructor(role: RoleType) {
        this.role = this.validateRole(role);
    }
    private validateRole(role: RoleType): RoleType {
        if (!Object.values(RoleType).includes(role)) {
            throw new Error(`Invalid role type: ${role}`);
        }
        return role;
    }

    public static defaultUser(): Role {
        return new Role(RoleType.CUSTOMER);
    }

    public static adminUser(): Role {
        return new Role(RoleType.ADMIN);
    }

    public getValue(): RoleType {
        return this.role;
    }

    public isAdmin(): boolean {
        return this.role === RoleType.ADMIN;
    }

    public isCustomer(): boolean {
        return this.role === RoleType.CUSTOMER;
    }
    public isGuest(): boolean {
        return this.role === RoleType.GUEST;
    }
    public toString(): string {
        return this.role.toString();
    }

}