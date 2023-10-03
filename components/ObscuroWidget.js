import React, { useEffect, useState, useRef } from 'react';
import { Web3Provider } from "@ethersproject/providers";
import styles from './ObscuroWidget.module.css';

const ObscuroWidget = () => {
    // Constants
    const eventClick = "click";
    const obscuroGatewayVersion = "v1";
    const pathJoin = obscuroGatewayVersion + "/join/";
    const pathAuthenticate = obscuroGatewayVersion + "/authenticate/";
    const pathQuery = obscuroGatewayVersion + "/query/";
    const pathRevoke = obscuroGatewayVersion + "/revoke/";
    const obscuroChainIDDecimal = 777;
    const methodPost = "post";
    const methodGet = "get";
    const jsonHeaders = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    };
    const metamaskPersonalSign = "personal_sign";

    // State for dynamic content
    const [statusMessage, setStatusMessage] = useState('');
    const [accountsData, setAccountsData] = useState([]);
    const [isObscuroPanelVisible, setObscuroPanelVisible] = useState(false);

    // Refs
    const addAccountRef = useRef(null);
    const addAllAccountsRef = useRef(null);
    const revokeUserIDRef = useRef(null);
    const statusRef = useRef(null);
    const tableBodyRef = useRef(null);

// Utility functions
function isValidUserIDFormat(value) {
    return typeof value === 'string' && value.length === 64;
}

let obscuroGatewayAddress = "https://testnet.obscu.ro";
const [provider, setProvider] = useState(null);

async function addNetworkToMetaMask(ethereum, userID, chainIDDecimal) {
    // add network to MetaMask
    let chainIdHex = "0x" + chainIDDecimal.toString(16); // Convert to hexadecimal and prefix with '0x'

    try {
        await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
                {
                    chainId: chainIdHex,
                    chainName: 'Obscuro Testnet',
                    nativeCurrency: {
                        name: 'Obscuro',
                        symbol: 'OBX',
                        decimals: 18
                    },
                    rpcUrls: [obscuroGatewayAddress+"/"+obscuroGatewayVersion+'/?u='+userID],
                    blockExplorerUrls: null
                },
            ],
        });
    } catch (error) {
        console.error(error);
        return false
    }
    return true
}

async function authenticateAccountWithObscuroGateway(ethereum, account, userID) {
    const isAuthenticated = await accountIsAuthenticated(account, userID)

    if (isAuthenticated) {
        return "Account is already authenticated"
    }

    const textToSign = "Register " + userID + " for " + account.toLowerCase();
    const signature = await ethereum.request({
        method: metamaskPersonalSign,
        params: [textToSign, account]
    }).catch(_ => { return -1 })
    if (signature === -1) {
        return "Signing failed"
    }

    const authenticateUserURL = obscuroGatewayAddress + "/" + pathAuthenticate + "?u=" + userID;
    const authenticateFields = {"signature": signature, "message": textToSign}
    const authenticateResp = await fetch(
        authenticateUserURL, {
            method: methodPost,
            headers: jsonHeaders,
            body: JSON.stringify(authenticateFields)
        }
    );
    return await authenticateResp.text()
}

async function accountIsAuthenticated(account, userID) {
    const queryAccountUserID = obscuroGatewayAddress + "/" + pathQuery + "?u=" + userID + "&a=" + account;
    const isAuthenticatedResponse = await fetch(
        queryAccountUserID, {
            method: methodGet,
            headers: jsonHeaders,
        }
    );
    let response = await isAuthenticatedResponse.text();
    let jsonResponseObject = JSON.parse(response);
    return jsonResponseObject.status
}

async function revokeUserID(userID) {
    const queryAccountUserID = obscuroGatewayAddress + "/" + pathRevoke + "?u=" + userID;
    const revokeResponse = await fetch(
        queryAccountUserID, {
            method: methodGet,
            headers: jsonHeaders,
        }
    );
    return revokeResponse.ok
}

function getRandomIntAsString(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    const randomInt = Math.floor(Math.random() * (max - min + 1)) + min;
    return randomInt.toString();
}

function checkIfMetamaskIsLoaded() {
    if (window.ethereum) {
        handleEthereum();
    } else {
        if (addAccountRef.current) addAccountRef.current.style.display = "none";
        if (addAllAccountsRef.current) addAllAccountsRef.current.style.display = "none";
        if (revokeUserIDRef.current) revokeUserIDRef.current.style.display = "none";
        if (statusRef.current) statusRef.current.innerText = 'Connecting to Metamask...';
        window.addEventListener('ethereum#initialized', handleEthereum, {
            once: true,
        });

        setTimeout(handleEthereum, 3000); // 3 seconds
    }
}

function handleEthereum() {
    const { ethereum } = window;
    if (ethereum && ethereum.isMetaMask) {
        setProvider(new Web3Provider(window.ethereum));
    } else {
        const statusArea = document.getElementById(idStatus);
        statusArea.innerText = 'Please install MetaMask to use Obscuro Gateway.';
    }
}

async function populateAccountsTable(userID) {
    if (!provider) {
        console.error("Provider is not initialized");
        return;
    }

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    console.log("All requested accounts:", accounts);
    const newAccountsData = [];

    for (const account of accounts) {
        const status = await accountIsAuthenticated(account, userID);
        newAccountsData.push({
            address: account,
            status: status
        });
    }

    setAccountsData(newAccountsData);
}

async function getUserID() {
    try {
        return await provider.send('eth_getStorageAt', ["getUserID", getRandomIntAsString(0, 1000), null])
    }catch (e) {
        console.log(e)
        return null;
    }
}

async function connectAccount() {
    try {
        return await window.ethereum.request({ method: 'eth_requestAccounts' });
    } catch (error) {
        // TODO: Display warning to user to allow it and refresh page...
        console.error('User denied account access:', error);
        return null;
    }
}

    // UI Interaction Functions
    const toggleObscuroPanel = () => {
        setObscuroPanelVisible(!isObscuroPanelVisible);
    };

    // useEffect to handle initialization
    useEffect(() => {
        checkIfMetamaskIsLoaded();
    }, []);

    return (
        <>
        <button className={styles.obscuroButton} onClick={toggleObscuroPanel}>
        <img src="https://avatars.githubusercontent.com/u/93997495?s=200&v=4" alt="Obscuro Logo" className={styles.logoImage} />
        </button>

        <div className={`${styles.obscuroPanel} ${isObscuroPanelVisible ? '' : styles.hidden}`}>
            <div>
                <xbutton className={styles.closePanel} onClick={toggleObscuroPanel}>X</xbutton>
                <h3 className={styles.panelHeader}>Obscuro Gateway</h3>
                <hr />

                <button className={styles.panelButton} onClick={async () => {
                                        const joinResp = await fetch(obscuroGatewayAddress + "/" + pathJoin, {
                                            method: methodGet,
                                            headers: jsonHeaders,
                                        });    
                                        if (!joinResp.ok) {
                                            setStatusMessage("Failed to join. \nError: " + joinResp);
                                            return;
                                        }
                                    
                                        const userID = await joinResp.text();
                                        const networkAdded = await addNetworkToMetaMask(window.ethereum, userID, obscuroChainIDDecimal);
                                        if (!networkAdded) {
                                            setStatusMessage("Failed to add network");
                                            return;
                                        }
                                        setStatusMessage("Successfully joined Obscuro Gateway");
                                        await populateAccountsTable(userID);
                }}>
                    Join Obscuro
                </button>

                <button ref={addAccountRef} className={styles.panelButton} onClick={async () => {
                    const userID = await getUserID();
                    if (!isValidUserIDFormat(userID)) {
                        document.getElementById('status').innerText = "\n Please join Obscuro network first";
                        return;
                    }
                    await connectAccount();
                    const account = await provider.getSigner().getAddress();
                    if (!account) {
                        document.getElementById('status').innerText = "No MetaMask accounts found.";
                        return;
                    }
                    const authenticateAccountStatus = await authenticateAccountWithObscuroGateway(window.ethereum, account, userID);
                    await populateAccountsTable(userID);
                }}>
                    Add Account
                </button>

                <button ref={addAllAccountsRef} className={styles.panelButton} onClick={async () => {
                    const userID = await getUserID();
                    if (!isValidUserIDFormat(userID)) {
                        document.getElementById('status').innerText = "\n Please join Obscuro network first";
                        return;
                    }
                    await connectAccount();
                    const accounts = await provider.listAccounts();
                    if (!accounts || accounts.length === 0) {
                        document.getElementById('status').innerText = "No MetaMask accounts found.";
                        return;
                    }
                    for (const account of accounts) {
                        await authenticateAccountWithObscuroGateway(window.ethereum, account, userID);
                    }
                    await populateAccountsTable(userID);
                }}
                disabled  // The button is disabled until Add Account works!
                >
                    Add All Accounts
                </button>

                <button ref={revokeUserIDRef} className={styles.panelButton} onClick={async () => {
                    const userID = await getUserID();
                    const result = await revokeUserID(userID);
                    if (result) {
                        if (statusRef.current) {
                            statusRef.current.innerText = "Revoking UserID successful. Please remove current network from Metamask.";
                        }
                    } else {
                        if (statusRef.current) {
                            statusRef.current.innerText = "Revoking UserID failed";
                        }
                    }
                    await populateAccountsTable(userID);
                }}>
                    Revoke User ID
                </button>

                <div ref={statusRef} className={styles.statusMessage}>{statusMessage}</div>

                <table className={styles.accountsTable}>
                    <thead>
                        <tr>
                            <th className={styles.tableHeader}>Account</th>
                            <th className={styles.tableHeader}>Status</th>
                        </tr>
                    </thead>
                    <tbody ref={tableBodyRef}>
                        {accountsData.map((account, index) => (
                            <tr key={index}>
                                <td className={styles.tableData}>{account.address.substring(0, 10)}</td>
                                <td className={styles.tableData}>{account.status ? 'True' : 'False'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </>
    );
}

export default ObscuroWidget;
