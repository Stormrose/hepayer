import * as fs from 'fs'
import axios from 'axios'
import { Client as hClient, PrivateKey as hPrivateKey } from '@hiveio/dhive'
import { Client as sClient, PrivateKey as sPrivateKey } from 'dsteem'
import voca from 'voca'


(async () => { 
    if(process.argv.length < 4) {
        console.log('Commandline: ./run configfilename amttodistribute [activekey]')
        console.log('e.g. ./run token_MPATH.json 17.021')
        console.log('Without activekey: print distribution schedule.')
        console.log('With    activekey: execute the distribution schedule.')
        process.exit()
    }

    // Gather config
    let config: any = {}
    try {
        config = config = JSON.parse(fs.readFileSync(process.argv[2]).toString())
    } catch (e) {
        console.error(e)
        process.exit(-1)
    }
    //console.log(config)
    
    const tokensymbol: string = config.membershiptokensymbol.toUpperCase()
    const mintokens: number = parseFloat(config.minholdingtokens)
    const maxtokens: number = parseFloat(config.maxeffectivetokens)
    const minpayout: number = parseFloat(config.minpayout)
    const excludemembers: string[] = config.excludemembers ? config.excludemembers : []
    const daccount: string = config.distributionaccount.toLowerCase()
    const dasset: string = config.distributionasset.toUpperCase()
    const dassettype: string = config.distributionassettype.toUpperCase()
    const distributionamt: number = parseFloat(process.argv[3])
    excludemembers.push(daccount)
    
    // Check the cmdlines params - not comprehensive
    if(
        !tokensymbol || tokensymbol.length < 1
        || !daccount || daccount.length < 1
        || !dasset || dasset.length < 1
        || !['HIVE','STEEM','HIVE-ENGINE','STEEM-ENGINE'].includes(dassettype)
        
    ) {
        console.error('CONFIG ERROR: Missing field in config.')
        process.exit(-1)        
    }
    if(mintokens > maxtokens) {
        console.error('CONFIG ERROR: minholdingtokens cannot be lower than maxeffectivetokens: ' + mintokens + ' > ' + maxtokens)
        process.exit(-1)
    }
    
    let activekey: hPrivateKey|sPrivateKey|undefined
    try {
        activekey = process.argv[4] ? isHive(dassettype) ? hPrivateKey.fromString(process.argv[4]) : sPrivateKey.fromString(process.argv[4]) : undefined
    } catch(e) {
        console.error('ERROR:', e.message)
        console.error('COMMAND LINE ERROR: Check that the private active key is correct.')
        process.exit(-1)
    }

    // Some helpers for the axios calls
    const hefindtemplate: string = '{ "jsonrpc": "2.0", "method": "find", "params": { "contract": "tokens", "table": "balances", "query": {"symbol": "%s"}}, "id": 1}'
    const axoptions: any = { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }}
    const hefindstr: string = voca.sprintf(hefindtemplate, tokensymbol)

    // Stores for tokenholder info
    const tokenholdersraw: {[accountname: string]: number} = {}
    const tokenholdersnorm: {[accountname: string]: number} = {}
    const tokenholdersdist: {[accountname: string]: number} = {}
    const tokenholdersdistresult: {[accountname: string]: boolean} = {}

    let accumulatedtokenbalance: number = 0
    let accumulatedpayoutamt: number = 0

//process.exit(0)
    try { 
        // Request membership list from the side-chain
        const tb: any = await axios.post(config.sidechainendpoint, hefindstr, axoptions)
        await sleep(50)
        //console.log(tb.data.result)
        
        // Build member holdings list filtering out those below minholdingtokens
        for(const i of tb.data.result) {
            if(
                !excludemembers.includes(i.account)
                && (parseFloat(i.balance) >= 0.001 || parseFloat(i.stake) >= 0.001)
            ) {
                // console.log('@' + i.account.padEnd(24) + i.balance.padStart(10) + i.stake.padStart(10))
                const amt: number = parseFloat(i.balance) + parseFloat(i.stake)
                if(amt >= mintokens) {
                    tokenholdersraw[i.account] = amt
                    accumulatedtokenbalance += Math.min(maxtokens, amt)
                }
            }
        }

        // Build a proportional (normalised) list of tokenholders and calculate the payouts
        // Consider maxeffectivetokens and minpayout
        for(const i of Object.keys(tokenholdersraw)) {
            tokenholdersnorm[i] = Math.min(maxtokens, tokenholdersraw[i]) / accumulatedtokenbalance
            const amt: number = distributionamt * tokenholdersnorm[i]
            if(amt >= minpayout) {
                tokenholdersdist[i] = amt
                accumulatedpayoutamt += amt
            }
        }

        // If the cmdline has no active key, then log the distribution schedule to console in CSV format
        if(!activekey) {
            console.log('Account,                      Holding,       Share,      Dist(' + dasset + ')')
            for(const i of Object.keys(tokenholdersdist)) {
                console.log(voca.sprintf('@%-25s %10.3f, %10.9f, %10.3f', i + ',', tokenholdersraw[i], tokenholdersnorm[i], tokenholdersdist[i]))
            }
            console.log(voca.sprintf('%-25s  %10s, %10s , %10.3f', 'TOTAL' + ',', ' ', ' ', accumulatedpayoutamt))    
        }

        // If the cmdline has an active key then attempt to do the distributions
        // Log successes first and repeat failures at the end to ease manual followup
        else {
            const hclient: hClient|sClient = isHive(dassettype) ? new hClient(config.blockchainapinode) : new sClient(config.blockchainapinode)
            let hasfails: boolean = false
            console.log(dasset + ' distribution to ' + tokensymbol + ' holders.')
            console.log('Account,                      Holding,       Share,       Dist, Result')
            if(dassettype === 'HIVE' || dassettype === 'STEEM') {
                for(const i of Object.keys(tokenholdersdist)) {
                    try {
                        await hclient.broadcast.transfer(
                            {
                                amount: tokenholdersdist[i].toFixed(3) + ' ' + dassettype,
                                from: daccount,
                                memo: 'Distribution for ' + tokensymbol,
                                to: i
                            },
                            (<any>activekey)
                        )
                        tokenholdersdistresult[i] = true
                        console.log(voca.sprintf('@%-25s %10.3f, %10.9f, %10.3f, %4s', i + ',', tokenholdersraw[i], tokenholdersnorm[i], tokenholdersdist[i], 'DONE'))
                    } catch(e) {
                        console.log('@' + i, e.message)
                        tokenholdersdistresult[i] = false
                        hasfails = true
                    }
                    await sleep(4.25 * 1000)
                }
            } else if(dassettype === 'HIVE-ENGINE' || dassettype === 'STEEM-ENGINE') {
                for(const i of Object.keys(tokenholdersdist)) {
                    try {
                        await hclient.broadcast.json(
                            {
                                id: (dassettype === 'HIVE-ENGINE' ? 'ssc-mainnet-hive' : 'ssc-mainnet1'),
                                required_auths: [ daccount ],
                                required_posting_auths: [], 
                                json: JSON.stringify({
                                    contractName: 'tokens',
                                    contractAction: 'transfer',
                                    contractPayload: {
                                        symbol: dasset,
                                        to: i,
                                        quantity: tokenholdersdist[i].toFixed(3),
                                        memo: 'Distribution for ' + tokensymbol
                                    }
                                })
                            },
                            (<any>activekey)
                        )
                        tokenholdersdistresult[i] = true
                        console.log(voca.sprintf('@%-25s %10.3f, %10.9f, %10.3f, %4s', i + ',', tokenholdersraw[i], tokenholdersnorm[i], tokenholdersdist[i], 'DONE'))
                    } catch(e) {
                        console.log('@' + i, e.message)
                        tokenholdersdistresult[i] = false
                        hasfails = true
                    }
                    await sleep(4.25 * 1000)
                }
            } else {
                console.error('CONFIG ERROR: Invalid distributionassettype: ' + dassettype)
                process.exit(-1)
            }
            if(hasfails) {
                console.log('\n\n\Fails')
                for(const i of Object.keys(tokenholdersdistresult)) {
                    if(!tokenholdersdistresult[i]) {
                        console.log(voca.sprintf('@%-25s %10.3f, %10.9f, %10.3f, %4s', i + ',', tokenholdersraw[i], tokenholdersnorm[i], tokenholdersdist[i], 'FAIL'))
                    }
                }
            } else {
                console.log('All successful.')
            }
        }
    } catch (e) {
        console.log('ERROR')
        console.log(e)
    }
})();

function isHive(dassettype: string): boolean {
    return dassettype === 'HIVE' || dassettype === 'HIVE-ENGINE'
}

async function sleep(milliseconds: number): Promise<void> { 
    return new Promise<void>(resolve => {
        setTimeout(() => {
            resolve()
        }, milliseconds)
    })
}
