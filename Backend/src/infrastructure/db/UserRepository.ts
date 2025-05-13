import { PrismaClient, User as PrismaUserModel, Role as PrismaRoleEnum } from '@prisma/client';
import { inject, injectable } from 'inversify';

import User from '@domain/user/User';
import UserId from '@domain/user/value-objects/UserId';
import Email from '@domain/user/value-objects/UserEmail';
import Username from '@domain/user/value-objects/UserUsername';
import UserRole from '@domain/user/value-objects/UserRole';
import { IUserRepository } from '@domain/user/interfaces/IUserRepository';
import { TYPES } from '@src/types';
import UserName from '@src/domain/user/value-objects/UserName';

@injectable()
export class UserRepository implements IUserRepository {
    private prisma: PrismaClient;

    constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
        this.prisma = prisma;
    }

    private mapToDomain(prismaUser: PrismaUserModel): User {
        const userId = new UserId(prismaUser.id);
        const name = new UserName(prismaUser.firstName, prismaUser.middleName, prismaUser.lastName);
        const email = new Email(prismaUser.email);
        const username = new Username(prismaUser.username);

        let role: UserRole
        if (prismaUser.role.toLocaleLowerCase() == "admin") {
            role = UserRole.adminUser();
        } else {
            role = UserRole.defaultUser();
        }

        const domainUser = new User(
            userId,
            name,
            email,
            username,
            prismaUser.password,
            prismaUser.createdAt,
            role,
        );

        return domainUser;
    }

    private mapToPrismaCreateUpdateData(domainUser: User): {
        firstName: string;
        middleName: string;
        lastName: string;
        email: string;
        username: string;
        password: string;
        createdAt: Date;
        role: PrismaRoleEnum;
    } {
        const name: UserName = domainUser.getName();
        const role = domainUser.getRole();

        const prismaRole: PrismaRoleEnum = role.getValue() as PrismaRoleEnum;

        return {
            firstName: name.getFirstName(),
            middleName: name.getMiddleName() || '',
            lastName: name.getLastName(),
            email: domainUser.getEmail().getValue(),
            username: domainUser.getUsername().getValue(),
            password: domainUser.getHashedValue(),
            createdAt: domainUser.getCreatedAt(),
            role: prismaRole,
        };
    }

    public async findById(id: UserId): Promise<User | null> {
        const prismaUser = await this.prisma.user.findUnique({
            where: { id: id.getValue() },
        });

        if (!prismaUser) {
            return null;
        }

        return this.mapToDomain(prismaUser);
    }

    public async findByEmail(email: Email): Promise<User | null> {
        const prismaUser = await this.prisma.user.findUnique({
            where: { email: email.getValue() },
        });

        if (!prismaUser) {
            return null;
        }

        return this.mapToDomain(prismaUser);
    }

    public async findByUsername(username: Username): Promise<User | null> {
        const prismaUser = await this.prisma.user.findUnique({
            where: { username: username.getValue() },
        });

        if (!prismaUser) {
            return null;
        }

        return this.mapToDomain(prismaUser);
    }

    public async save(user: User): Promise<User> {
        const userData = this.mapToPrismaCreateUpdateData(user);

        let savedPrismaUser: PrismaUserModel;

        const userId = user.getId()?.getValue();

        if (userId !== undefined && userId !== null) {
            savedPrismaUser = await this.prisma.user.update({
                where: { id: userId },
                data: userData,
            });
        } else {
            savedPrismaUser = await this.prisma.user.create({
                data: userData,
            });

            const newUserId = new UserId(savedPrismaUser.id);
            const updatedDomainUser = new User(
                newUserId,
                user.getName(),
                user.getEmail(),
                user.getUsername(),
                user.getHashedValue(),
                user.getCreatedAt(),
                user.getRole(),
            );

            return updatedDomainUser;
        }

        return this.mapToDomain(savedPrismaUser);
    }
}
