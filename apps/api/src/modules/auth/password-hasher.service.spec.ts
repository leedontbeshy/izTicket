import { PasswordHasher } from './password-hasher.service';

describe('PasswordHasher', () => {
    const service = new PasswordHasher();

    it('hashes and verifies passwords', async () => {
        const password = 'Password123';
        const hash = await service.hash(password);

        expect(hash).not.toBe(password);
        await expect(service.verify(hash, password)).resolves.toBe(true);
        await expect(service.verify(hash, 'wrong-password')).resolves.toBe(
            false,
        );
    });
});
