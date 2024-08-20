import { promises as fs } from 'fs';

const IP_FILE_PATH = './previous_ip.txt';
const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

const cloudflareAPIKey = '';
const domainNames = [{zoneName: "specialopstech.com", aRecords: ['test']}];

// Main function
async function main() {
    try {
        const currentIP = await getCurrentIP();

        // Make sure the IP address is valid using a regex
        if (!ipRegex.test(currentIP)) {
            console.error('Invalid IP address returned from IP service - aborting:', currentIP);
            return;
        }

        // Check if the IP address has changed based on the stored IP
        let previousIP = null;
        try {
            previousIP = await fs.readFile(IP_FILE_PATH, 'utf8');
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('Error reading previous IP address:', error);
                return;
            }
        }

        if (currentIP === previousIP) {
            console.log('IP address has not changed since last run. To force a run, delete the ' + IP_FILE_PATH + ' file. Address:', currentIP);
            return;
        }

        if (currentIP) {
            await updateCloudflareIP(currentIP);
            await fs.writeFile(IP_FILE_PATH, currentIP, 'utf8');
            console.log('IP address updated and saved:', currentIP);
        } else {
            console.error('Unable to fetch current IP address.');
        }
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

// Function to get the current IP address
async function getCurrentIP() {
    try {
        const response = await fetch('https://ipinfo.io/ip');
        const ipAddress = await response.text();
        return ipAddress.trim();
    } catch (error) {
        console.error('Error fetching IP address:', error);
        return null;
    }
}

async function verifyAPIKey() {
    try {
        const headers = {
            "Authorization": `Bearer ${cloudflareAPIKey}`,
            'Content-Type': 'application/json',
        };

        const url = `https://api.cloudflare.com/client/v4/user/tokens/verify`;
        const response = await fetch(url, { method: 'GET', headers });
        const data = await response.json();
        console.log(data);

        if (data.success && data.result.status === 'active') {
            return true;
        }
    }
    catch (error) {
        console.error('Error verifying API key:', error);
        return false;
    }
    return false;
}

// Function to update Cloudflare DNS records
async function updateCloudflareIP(ipAddress) {
    if(!verifyAPIKey()) {
        console.error('Invalid API key');
        return;
    }

    for(const domainName of domainNames) {

        try {
            const headers = {
                'Authorization': `Bearer ${cloudflareAPIKey}`,
                'Content-Type': 'application/json',
            };

            // Get the zone ID for the domain
            let zoneId = null;
            const url = `https://api.cloudflare.com/client/v4/zones?name=${domainName.zoneName}`;
            const response = await fetch(url, { method: 'GET', headers });
            const data = await response.json();
            console.log(data);
            try {
                const response = await fetch(url, { method: 'GET', headers });
                const data = await response.json();
                console.log(data);

                if (data.success) {
                    zoneId = data.result[0].id;
                } else {
                    console.error('Error fetching zone ID:', data.errors);
                    return;
                }

                for (const aRecord of domainName.aRecords) {
                    const fqdn = `${aRecord}.${domainName.zoneName}`;
                    const dnsUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`;
                    const dnsResponse = await fetch(dnsUrl, { method: 'GET', headers });
                    const dnsData = await dnsResponse.json();
                    console.log(dnsData);

                    if (dnsData.success) {
                        const dnsRecords = dnsData.result;
                        const record = dnsRecords.find((record) => record.name === fqdn && record.type === 'A');
                        if (record) {
                            const recordId = record.id;
                            const updateUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${recordId}`;
                            const body = {
                                content: ipAddress,
                                name: aRecord,
                                proxied: false,
                                type: 'A',
                                ttl: 1,
                            };
                            const updateResponse = await fetch(updateUrl, { method: 'PATCH', headers, body: JSON.stringify(body) });
                            const updateData = await updateResponse.json();
                            if (updateData.success) {
                                console.log(`Updated DNS record for ${aRecord} to ${ipAddress}`);
                            } else {
                                console.error(`Error updating DNS record for ${aRecord}:`, updateData.errors);
                            }
                        } else {
                            console.error(`DNS record for ${aRecord} not found.`);
                        }
                    } else {
                        console.error('Error fetching DNS records:', dnsData.errors);
                    }
                }
            } catch (error) {
                console.error('An error occurred:', error);
            }
            if (data.success) {
                zoneId = data.result[0].id;
                console.log('Zone ID:', zoneId);
            } else {
                console.error('Error fetching zone ID:', data.errors);
                return;
            }
        }
        catch (error) {
            console.error('Error updating Cloudflare DNS records:', error);
        }
    }
}

await main();
