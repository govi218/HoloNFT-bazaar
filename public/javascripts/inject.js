// © 2021 coder-question.com | with CC 4.0 by-sa copyright agreement |
// Govind Mohan, 2022: HoloNFT adaptation.
const NETWORK_ID = 4
const TOKEN_CONTRACT_ADDRESS = "0x1221F89B11e36d28595485372269d6F1fd576FBa"
const MARKETPLACE_CONTRACT_ADDRESS = "0x4f2c2303e4Bc0B84c77A98C708EbF72C2EFb9978"
const TOKEN_CONTRACT_JSON_PATH = "/javascripts/HoloNFT.sol/HoloNFT.json"
const MARKETPLACE_CONTRACT_JSON_PATH = "javascripts/Marketplace+ReentrancyGuard.sol/Marketplace.json"
var token_contract
var marketplace_contract
var accounts
var web3
var balance

// DOM stuff on network change
function metamaskReloadCallback()
{
    window.ethereum.on('accountsChanged', (accounts) => {
        document.getElementById("web3_message").innerHTML="Accounts changed, refreshing...";
        window.location.reload()
    })
    window.ethereum.on('networkChanged', (accounts) => {
        document.getElementById("web3_message").innerHTML="Network changed, refreshing...";
        window.location.reload()
    })
}

// get web3 when window loads
const getWeb3 = async () => {
    return new Promise((resolve, reject) => {
        if(document.readyState=="complete")
        {
            if (window.ethereum) {
                const web3 = new Web3(window.ethereum)
                window.location.reload()
                resolve(web3)
            } else {
                reject("must install MetaMask")
                document.getElementById("web3_message").innerHTML="Error: Please connect to Metamask";
            }
        }else
        {
            window.addEventListener("load", async () => {
                if (window.ethereum) {
                    const web3 = new Web3(window.ethereum)
                    resolve(web3)
                } else {
                    reject("must install MetaMask")
                    document.getElementById("web3_message").innerHTML="Error: Please install Metamask";
                }
            });
        }
    });
};

// get web3 contract
const getContract = async (web3, contract_json_path, contract_address) => {
    const response = await fetch(contract_json_path);
    const data = await response.json();

    const netId = await web3.eth.net.getId();
    contract = new web3.eth.Contract(
        data.abi,
        contract_address
    );
    return contract
}

async function loadDapp() {
    metamaskReloadCallback()
    document.getElementById("web3_message").innerHTML="Loading..."
    var awaitWeb3 = async function () {
        web3 = await getWeb3()
        web3.eth.net.getId((err, netId) => {

            if (netId == NETWORK_ID) {
                var awaitContract = async function () {
                    token_contract = await getContract(web3, TOKEN_CONTRACT_JSON_PATH, TOKEN_CONTRACT_ADDRESS)
                    marketplace_contract = await getContract(web3, MARKETPLACE_CONTRACT_JSON_PATH, MARKETPLACE_CONTRACT_ADDRESS)
                    await window.ethereum.request({ method: "eth_requestAccounts" })
                    accounts = await web3.eth.getAccounts()
                    balance = await token_contract.methods.balanceOf(accounts[0]).call()

                    var config = {
                        method: 'get',
                        url: 'https://testnets-api.opensea.io/api/v1/assets?owner=0x5D88f6EC856F54A4D9C31e63B95e818966139841',
                    };
                    for(i=0; i<balance; i++)
                    {
                        // axios(config)
                        //     .then(function (response) {
                        //         console.log(i);
                        //         let nft_id = response.data["assets"][i];
                        //         console.log(nft_id);
                        insertMyTokenHTML(i)
                        // })
                        // .catch(function (error) {
                        //     console.log(error);
                        // });
                    }

                    my_listings_count = await marketplace_contract.methods.getListingsByOwnerCount(accounts[0]).call()
                    for(i=0; i<my_listings_count; i++)
                    {
                        listing_id = await marketplace_contract.methods.getListingsByOwner(accounts[0], i).call()
                        insertMyListingHTML(listing_id)
                    }

                    active_listing_count = await marketplace_contract.methods.getActiveListingsCount().call()
                    for(i=0; i<active_listing_count; i++)
                    {
                        listing_id = await marketplace_contract.methods.getActiveListings(i).call()
                        insertActiveListingHTML(listing_id)
                    }

                    document.getElementById("web3_message").innerHTML="You have " + balance + " tokens"
                };
                awaitContract();
            } else {
                document.getElementById("web3_message").innerHTML="Please connect to Rinkeby";
            }
        });
    };
    awaitWeb3();
}

function insertMyTokenHTML(nft_id)
{
    //Token number text
    var token_element = document.createElement("p")
    token_element.innerHTML = "Token #" + nft_id
    document.getElementById("my_nfts").appendChild(token_element)

    //Approve Button
    let approve_btn = document.createElement("button")
    approve_btn.innerHTML = "Approve"
    document.getElementById("my_nfts").appendChild(approve_btn)
    approve_btn.onclick = function () {
        approve(MARKETPLACE_CONTRACT_ADDRESS, nft_id)
    }

    //Price
    var input = document.createElement("input")
    input.type = "text"
    input.value = "Price"
    input.id = "price" + nft_id
    document.getElementById("my_nfts").appendChild(input)

    //Sell Button
    let mint_btn = document.createElement("button")
    mint_btn.innerHTML = "Sell"
    document.getElementById("my_nfts").appendChild(mint_btn)
    mint_btn.onclick = function () {
        price = document.getElementById("price" + nft_id).value;
        addListing(nft_id, web3.utils.toWei(price))
    }
}

async function insertMyListingHTML(listing_id)
{
    listing = await marketplace_contract.methods.listings(listing_id).call()
    //Token number text
    var token_element = document.createElement("p")
    token_element.innerHTML = "Token #" + listing.token_id + " (price: "+ web3.utils.fromWei(listing.price) +")"
    document.getElementById("my_listings").appendChild(token_element)

    //Delist Button
    let delist_btn = document.createElement("button")
    delist_btn.innerHTML = "Delist"
    document.getElementById("my_listings").appendChild(delist_btn)
    delist_btn.onclick = function () {
        removeListing(listing_id)
    }
}

async function insertActiveListingHTML(listing_id)
{
    listing = await marketplace_contract.methods.listings(listing_id).call()
    //Token number text
    var token_element = document.createElement("p")
    token_element.innerHTML = "Token #" + listing.token_id + " (price: "+ web3.utils.fromWei(listing.price) +")"
    document.getElementById("all_listings").appendChild(token_element)

    //Delist Button
    let delist_btn = document.createElement("button")
    delist_btn.innerHTML = "Buy"
    document.getElementById("all_listings").appendChild(delist_btn)
    delist_btn.onclick = function () {
        buy(listing_id, listing.price)
    }
}

const mint = async () => {
    const result = await token_contract.methods.mintNFT("https://gateway.pinata.cloud/ipfs/QmXDz3g45wGvthJh8ZwpP2gRCkYURjv7a6BgkAVM2BAffA?preview=1")
          .send({ from: accounts[0], value: ethers.utils.parseEther("0.01") })
          .on('transactionHash', function(hash){
              document.getElementById("web3_message").innerHTML="Minting...";
              document.getElementById("transaction_hash").innerHTML="<a href=\"https://rinkeby.etherscan.io/tx/" + hash + "\">Transaction Hash</a>";
          })
          .on('receipt', function(receipt){
              document.getElementById("web3_message").innerHTML="Success!";    })
          .catch((revertReason) => {
              console.log("ERROR! Transaction reverted: " + revertReason.receipt.transactionHash)
          });
}

const approve = async (contract_address, token_id) => {
    const result = await token_contract.methods.approve(contract_address, token_id)
          .send({ from: accounts[0], gas: 0 })
          .on('transactionHash', function(hash){
              document.getElementById("web3_message").innerHTML="Approving...";
          })
          .on('receipt', function(receipt){
              document.getElementById("web3_message").innerHTML="Success!";    })
          .catch((revertReason) => {
              console.log("ERROR! Transaction reverted: " + revertReason.receipt.transactionHash)
          });
}

const addListing = async (token_id, price) => {
    const result = await marketplace_contract.methods.addListing(token_id, price)
          .send({ from: accounts[0], gas: 0 })
          .on('transactionHash', function(hash){
              document.getElementById("web3_message").innerHTML="Adding listing...";
          })
          .on('receipt', function(receipt){
              document.getElementById("web3_message").innerHTML="Success!";    })
          .catch((revertReason) => {
              console.log("ERROR! Transaction reverted: " + revertReason.receipt.transactionHash)
          });
}

const removeListing = async (listing_id) => {
    const result = await marketplace_contract.methods.removeListing(listing_id)
          .send({ from: accounts[0], gas: 0 })
          .on('transactionHash', function(hash){
              document.getElementById("web3_message").innerHTML="Removing from listings...";
          })
          .on('receipt', function(receipt){
              document.getElementById("web3_message").innerHTML="Success!";    })
          .catch((revertReason) => {
              console.log("ERROR! Transaction reverted: " + revertReason.receipt.transactionHash)
          });
}

const buy = async (listing_id, price) => {
    const result = await marketplace_contract.methods.buy(listing_id)
          .send({ from: accounts[0], gas: 0, value: price })
          .on('transactionHash', function(hash){
              document.getElementById("web3_message").innerHTML="Buying...";
          })
          .on('receipt', function(receipt){
              document.getElementById("web3_message").innerHTML="Success!";    })
          .catch((revertReason) => {
              console.log("ERROR! Transaction reverted: " + revertReason.receipt.transactionHash)
          });
}
loadDapp()
