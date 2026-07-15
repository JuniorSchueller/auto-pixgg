function GenerateRandomCode(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

async function PixGGFetch(url, options, token=null) {
    const baseHeaders = {
        'authorization': `Bearer ${!token ? 'null' : token}`,
        'referer': 'https://pixgg.com/',
        'origin': 'https://pixgg.com',
        'content-type': 'application/json',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 OPR/133.0.0.0',
    }
    const res = await fetch(url, {
        ...options,
        headers: {
            ...baseHeaders,
            ...options?.headers
        }
    });

    return res;
}

class Client {
    constructor({ email, password }) {
        if (!email || !password) {
            throw new Error('Auto-PixGG: Email and password are required.');
        }
        this.credentials = { email, password };
        this.session = null;
    }

    async #ensureAuth() {
        if (this.session) return;

        const { email, password } = this.credentials;
        
        const loginRes = await PixGGFetch('https://app.pixgg.com/users/login', {
            method: 'POST',
            body: JSON.stringify({ email, password, name: '' })
        });
        if (!loginRes.ok) throw new Error('PixGG Auth Error: Invalid credentials');
        const loginJson = await loginRes.json();

        const apikeyRes = await PixGGFetch('https://app.pixgg.com/users/api-key', {}, loginJson.authToken);
        if (!apikeyRes.ok) throw new Error('PixGG API Error (API-Key): ' + apikeyRes.status);
        const apikeyJson = await apikeyRes.json();

        const checkoutsRes = await PixGGFetch(`https://app.pixgg.com/checkouts?streamerUsername=${apikeyJson.username}`, null);
        if (!checkoutsRes.ok) throw new Error('PixGG API Error (Checkouts): ' + checkoutsRes.status);
        const checkoutsJson = await checkoutsRes.json();

        this.session = {
            token: loginJson.authToken,
            api: loginJson.apiKey,
            username: apikeyJson.username,
            id: checkoutsJson.id
        };
    }

    async statistics() {
        await this.#ensureAuth();

        const res = await PixGGFetch('https://app.pixgg.com/BankAccounts/statistics', {}, this.session.token);
        if (!res.ok) throw new Error('PixGG API Error: ' + res.status);
        const json = await res.json();
        
        return { 
            remaining: json.available, 
            pending: json.waitingAmount 
        };
    }

    get payments() {
        return {
            list: async (page = 1, maxItems = 10, user = '') => {
                await this.#ensureAuth();

                const res = await PixGGFetch(`https://app.pixgg.com/Reports/Donations?page=${page}&pageSize=${maxItems}&donatorNickName=${user}`, {}, this.session.token);
                if (!res.ok) throw new Error('PixGG API Error: ' + res.status);
                const json = await res.json();
                
                return json.map(item => ({
                    id: item.id,
                    createdAt: item.dateCreated,
                    approvedAt: item.approvedDate,
                    data: item.donatorMessage,
                    author: item.donatorNickname
                }));
            },

            create: async (amount = 0.5, data = '') => {
                await this.#ensureAuth();
                const paymentId = GenerateRandomCode(6);

                const res = await PixGGFetch('https://app.pixgg.com/checkouts', {
                    method: 'POST',
                    body: JSON.stringify({
                        streamerId: this.session.id,
                        donatorNickname: paymentId,
                        donatorMessage: data,
                        donatorAmount: amount,
                        minimumDonateAmount: null,
                        fileId: null,
                        country: 'Brazil',
                        songPixYoutubeUrl: '',
                        cryptoNetwork: 'ETH',
                        cryptoCoin: null,
                        youTubeVideoId: '',
                        YouTubeVideoStart: 0,
                        YouTubeVideoEnd: 0
                    })
                }, this.session.token);
                if (!res.ok) throw new Error('PixGG API Error: ' + res.status);
                const json = await res.json();
                const items = Array.isArray(json) ? json : [json];
                
                return items.map(item => ({
                    id: paymentId,
                    url: item.pixUrl
                }))[0];
            },

            check: async (paymentId) => {
                await this.#ensureAuth();

                const res = await PixGGFetch(`https://app.pixgg.com/Reports/Donations?page=1&pageSize=1&donatorNickName=${paymentId}`, {}, this.session.token);
                if (!res.ok) throw new Error('PixGG API Error: ' + res.status);
                const json = await res.json();

                if (!Array.isArray(json) || json.length === 0) {
                    return { confirmed: false, status: 'PENDING', data: null };
                }

                const item = json[0];
                return {
                    confirmed: !!item.approvedDate,
                    status: item.approvedDate ? 'APPROVED' : 'PENDING',
                    data: {
                        id: item.id,
                        createdAt: item.dateCreated,
                        approvedAt: item.approvedDate,
                        data: item.donatorMessage,
                        author: item.donatorNickname
                    }
                };
            }
        };
    }
}

module.exports = { Client };