export const generateRandomCode = (dto?: { code?: string } | number | string) => {
    if (typeof dto === 'object' && dto?.code) {
        return dto.code;
    }
    return `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};
