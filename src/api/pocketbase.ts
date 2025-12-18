import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

// Nur für Entwicklung - als Admin anmelden
try {
    await pb.admins.authWithPassword("test@gmx.at", "test1234");
    console.log('Authenticated as admin');
} catch (err) {
    console.error('Auth error:', err);
}


pb.autoCancellation(false);

export default pb;

