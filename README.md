# hepayer

A node js script for token airdrops for the HIVE blockchain based on membership holdings of a specified Hive-Engine token. 


## Disclaimers
This project is intended for airdrops: either dropping more of the same token to existing users or airdropping a token to owners of another token. Using this project for profit distributions/dividends might violate Hive-Engine's T&Cs regarding security tokens and additionally there are likely other legal compliances issues to consider. Support for Steem and Steem-engine may be deprecated in future. This project has minimal error checking. You are assumed to know what you're doing.


## Usage
`node index.js token_config.json amttoairdrop [activekey]`

Without activekey: print the airdrop distribution schedule.
With    activekey: execute the airdrop distribution schedule.

e.g. `node index.js token_SOMETOKEN.json 17.021')`
Uses the config specified in `token_SOMETOKEN.json` and prints out a schedule for the pro-rata air-dropping of 17.021 tokens.


## Installing
Requires node js.

## Users
General usage only requires the `index.js`, `package.json` and a token config.json file but it doesn't hurt to have all of the files. Change into the folder and then type:

`npm install --production`
Then edit the token config.json file to your specific needs.

## Developers
Developers should download everything. Place these into their own folder and then:

`npm install -g typescript`
`npm install`

Then edit the token config.json file to your specific needs. The project uses TypeScript so you should only edit the .ts files.

## Token config.json files
Please see the example files.

# Tips
1. Hive blockchain tokens can use a list of nodes in a JSON array to enable automatic failover.
2. Test run your distribution without an active key to review the distribution schedule before executing the distribution.
3. Test run your token config.json with a small distribution first. Often 1.0 tokens will be enough for a test run.
4. The distribution schedule printed when an active key is not supplied is optimised for importing into a spreadsheet. Redirect the output to a `.tsv` or `.txt` file and then open in your favourite programme.
5. On unix, use the`tee` command to output to a log file and to the console. `x | tee logfile.txt`. In Windows PowerShell you can use `Tee-Object` and in `x | Tee-Object -FilePath "logfile.txt"`
