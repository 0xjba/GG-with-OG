// pages/index.js
import GuessingGame from '../components/GuessingGame';
import ObscuroWidget from '../components/ObscuroWidget';


export default function Home() {
  return (
    <div>
      <ObscuroWidget />
      <GuessingGame guessContractAddress="0x66aAb95769cDfF0DCA20a5b976309C3F69811893" erc20ContractAddress="0xfC902592A229CdaE83fb3F1CA9A9a8eb802B30FC" />
    </div>
  );
}