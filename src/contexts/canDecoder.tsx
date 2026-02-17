export function decodeCanGps(hexString: string): [number, number] {
    const bytes = Uint8Array.from(
        hexString.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );

    const latRaw = new DataView(bytes.buffer).getInt32(0, true);
    const lonRaw = new DataView(bytes.buffer).getInt32(4, true);

    return [ latRaw / 1e7, lonRaw / 1e7];
}

export function decodeCanTemp(hexString: string): number {
    // 7D05 = 0x057D = 1405? Kommt auf dein Format an
    if (hexString.length < 4) return 0;
    const tempHex = hexString.substring(0, 4);
    return parseInt(tempHex, 16) / 10; // z.B. 7D05 = 3205 = 32.05°C
}

export function decodeCanHum(hexString: string): number {
    // A00F = 0x0FA0 = 4000
    if (hexString.length < 4) return 0;
    const humHex = hexString.substring(0, 4);
    return parseInt(humHex, 16) / 100; // A00F = 4000 = 40.00%
}

export function decodeCanTempA(hexString: string): number {
    // 2007 = 0x0720 = 1824
    if (hexString.length < 4) return 0;
    const tempHex = hexString.substring(0, 4);
    return parseInt(tempHex, 16) / 10; // 2007 = 1824 = 18.24°C
}