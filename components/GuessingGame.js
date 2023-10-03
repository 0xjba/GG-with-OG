// components/GuessingGame.js
import guessAbi from '../artifacts/contracts/Guess.sol/Guess.json'
import ERCAbi from '../artifacts/contracts/ERC20.sol/ERC20.json'
import { useState, useEffect } from 'react';
import { Web3Provider } from "@ethersproject/providers";
import { Contract } from "@ethersproject/contracts";
import { parseEther } from "@ethersproject/units";
import styles from "./GuessingGame.module.css";

function GuessingGame({ guessContractAddress, erc20ContractAddress }) {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [guessContract, setGuessContract] = useState(null);
  const [erc20Contract, setErc20Contract] = useState(null);
  const [allowance, setAllowance] = useState(0);
  const [message, setMessage] = useState('');
  const [chainId, setChainId] = useState(null);
  const [account, setAccount] = useState(null);


  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const providerInstance = new Web3Provider(window.ethereum);

      setProvider(providerInstance);
      setSigner(providerInstance.getSigner());

      // Fetch the network details
      providerInstance.getNetwork().then(network => {
        setChainId(network.chainId);
      });

      const guessContractInstance = new Contract(guessContractAddress, guessAbi.abi, providerInstance);
      setGuessContract(guessContractInstance);

      const erc20ContractInstance = new Contract(erc20ContractAddress, ERCAbi.abi, providerInstance);
      setErc20Contract(erc20ContractInstance);
    }
  }, []);

  useEffect(() => {
    if (signer) {
      signer.getAddress().then(address => {
        setAccount(address);
      });
    }
  }, [signer]);

  const approveTokens = async (amount) => {
    if (!signer || !erc20Contract) return;

    try {
      const tx = await erc20Contract.connect(signer).approve(guessContractAddress, parseEther(amount));
      await tx.wait();
      setMessage(`Successfully approved ${amount} tokens for the game.`);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const makeGuess = async (number) => {
    if (!signer || !guessContract) return;

    try {
      const tx = await guessContract.connect(signer).attempt(number);
      await tx.wait();
      alert(`Guess submitted!`);
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  // Listen for events
  useEffect(() => {
    if (guessContract) {
      const handleGuessResult = (player, allowance, prize, guess, msg) => {
        console.log("Event captured:", player, allowance, prize, guess, msg);
        setMessage(`Guess Result: ${msg}. Your guess was ${guess}. Prize is now ${prize}.`);
      };

      guessContract.on('GuessResult', handleGuessResult);

      // Cleanup function
      return () => {
        guessContract.off('GuessResult', handleGuessResult);
      };
    }
}, [guessContract]);

  return (
    <div className={styles.guessingGameContainer}>
      <h2 className={styles.gameTitle}>Guessing Game</h2>
      <div className={styles.networkBox}>
        Network chain ID: <span id="chainId">{chainId || 'Not connected'}</span>
        <div className={styles.verticalDivider}></div>
        Account Address: <span id="accountAddress">{account ? account.slice(0, 10) + "..." : 'Not connected'}</span>
      </div>
      <div className={styles.infoSection}>
        <p>Welcome to the Obscuro Number Guessing Game!</p>
        <p>The game contract contains a secret number, generated when the contract was deployed, and visible only within the trusted execution environments of the Obscuro network. It can not be seen by any node computer or by any node operator.</p>
        <p>Each guess costs 1 token. If you guess incorrectly, your fee is added to the prize pool. But if you guess correctly, you'll win all of the prize pool! <a href="https://docs.obscu.ro/" target="_blank" rel="noopener noreferrer">Check the docs here</a> for more info.</p>
      </div>
      <div className={styles.inputSection}>
        <input id="approveAmount" type="number" placeholder="Amount to approve" className={styles.inputField} />
        <button onClick={() => approveTokens(document.querySelector("#approveAmount").value)} className={styles.actionButton}>Approve Tokens</button>
      </div>
      <div className={styles.inputSection}>
        <input id="guessNumber" type="number" placeholder="Your guess" className={styles.inputField} />
        <button onClick={() => makeGuess(document.querySelector("#guessNumber").value)} className={styles.actionButton}>Make a Guess</button>
      </div>
      <div className={styles.messageSection}>
        <p>{message}</p>
      </div>
      <div className={styles.instructionsSection}>
        <h3>Using this app:</h3>
        <ol>
          <li>Click on the Obscuro Widget in the bottom right corner.</li>
          <li>Click Join Obscuro</li>
          <li>Add Account</li>
          <li>You'll need some OGG tokens to play the game, so head to our Discord Server & the faucet channel & request some tokens.</li>
          <li>Now you can approve the guesses & make your guess.</li>
        </ol>
      </div>
    </div>
  );
}

export default GuessingGame;
