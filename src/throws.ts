export async function throws(fn: () => void): Promise<boolean> {
    try {
        await fn();
        return false;
    }
    catch (_) {
        return true;
    }
}
